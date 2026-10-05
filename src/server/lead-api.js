import {LeadError, validateLead, submissionIdPattern} from './lead-model.js';
import {LeadStore} from './lead-store.js';
import {validateTwilioSignature} from './twilio-service.js';
import {deliverNotification} from './lead-notifications.js';

const statusRank = {accepted: 0, scheduled: 0, queued: 1, sending: 2, sent: 3, delivered: 4, undelivered: 4, failed: 4, canceled: 4, read: 5};

function json(response, status, body, headers = {}) {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers});
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []; let bytes = 0;
    const receive = chunk => {
      bytes += chunk.length;
      if (bytes > 16384) {
        chunks.length = 0;
        request.removeListener('data', receive);
        request.resume(); reject(new LeadError('Your request is too large.', 413)); return;
      }
      chunks.push(chunk);
    };
    request.on('data', receive);
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
    request.on('aborted', () => reject(new LeadError('Request interrupted.')));
  });
}

export function createLeadApi(config, {store = new LeadStore(config.directory), fetchImpl, rateLimit = 10, windowMs = 600000} = {}) {
  const visitors = new Map();
  return async function handleLeadRequest(request, response, pathname) {
    if (!pathname.startsWith('/api/')) return false;
    if (!['/api/leads', '/api/twilio/status'].includes(pathname)) {json(response, 404, {error: 'Not found.'}); return true;}
    if (request.method !== 'POST') {json(response, 405, {error: 'Use POST for this endpoint.'}, {Allow: 'POST'}); return true;}
    try {
      if (pathname === '/api/leads') {
        const expectedOrigin = config.publicBaseUrl || new URL(`http://${request.headers.host}`).origin;
        if ((request.headers.origin && request.headers.origin !== expectedOrigin) || request.headers['sec-fetch-site'] === 'cross-site') throw new LeadError('Please submit your request from this website.', 403);
        if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] || '')) throw new LeadError('Please send a JSON request.', 415);
        const now = Date.now(), ip = request.socket.remoteAddress;
        for (const [key, visitor] of visitors) if (visitor.expires <= now) visitors.delete(key);
        const visitor = visitors.get(ip) || {count: 0, expires: now + windowMs};
        if (visitors.size >= 10000 && !visitors.has(ip)) throw new LeadError('Please try again later.', 429);
        visitor.count++; visitors.set(ip, visitor);
        if (visitor.count > rateLimit) {json(response, 429, {error: 'Please wait a few minutes before submitting another request.'}, {'Retry-After': String(Math.ceil((visitor.expires-now)/1000))}); return true;}
        let input;
        try { input = JSON.parse(await readBody(request)); }
        catch(error) {if(error instanceof LeadError)throw error;throw new LeadError('Please check your request.');}
        const lead = validateLead(input);
        const result = await store.create(input.submissionId, lead, config.enabled);
        if (result.created) await deliverNotification(config, store, result.record, fetchImpl);
        json(response, 202, {accepted: true, reference: result.record.id});
      } else {
        if (!config.enabled || !config.publicBaseUrl) throw new LeadError('Webhook is not configured.', 503);
        if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers['content-type'] || '')) throw new LeadError('Unsupported webhook format.', 415);
        const parameters = new URLSearchParams(await readBody(request));
        const url = config.publicBaseUrl + request.url;
        if (!validateTwilioSignature(config.authToken, url, parameters, request.headers['x-twilio-signature'])) throw new LeadError('Invalid webhook signature.', 403);
        if (parameters.get('AccountSid') !== config.accountSid) throw new LeadError('Invalid webhook account.', 403);
        const id = new URL(url).searchParams.get('leadId');
        const messageSid = parameters.get('MessageSid'), status = parameters.get('MessageStatus');
        if (!submissionIdPattern.test(id || '') || !/^SM[0-9a-f]{32}$/i.test(messageSid || '') || !Object.hasOwn(statusRank, status)) throw new LeadError('Invalid delivery callback.');
        const updated = await store.update(id, record => {
          const notification = record.notification;
          if (notification.state === 'disabled' || (notification.messageSid && notification.messageSid !== messageSid)) throw new LeadError('Message does not match this request.', 409);
          notification.messageSid = messageSid;
          const errorCode = /^\d+$/.test(parameters.get('ErrorCode') || '') ? parameters.get('ErrorCode') : null;
          if (!notification.events.some(event => event.status === status && event.errorCode === errorCode)) {
            notification.events.push({status, errorCode, receivedAt: new Date().toISOString()});
            notification.events = notification.events.slice(-50);
          }
          if (!(notification.state in statusRank) || statusRank[status] > statusRank[notification.state]) notification.state = status;
        });
        if (!updated) throw new LeadError('Unknown request reference.', 404);
        response.writeHead(204, {'Cache-Control': 'no-store'}); response.end();
      }
    } catch(error) {
      const status = error instanceof LeadError ? error.status : 503;
      json(response, status, {error: error instanceof LeadError ? error.message : 'We could not save your request. Please try again or contact us by phone or email.'});
    }
    return true;
  };
}
