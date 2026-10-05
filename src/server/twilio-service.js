import {createHmac, timingSafeEqual} from 'node:crypto';

export function validateTwilioSignature(authToken, url, parameters, signature = '') {
  let payload = url;
  for (const key of [...new Set(parameters.keys())].sort()) {
    for (const value of [...new Set(parameters.getAll(key))].sort()) payload += key + value;
  }
  const expected = Buffer.from(createHmac('sha1', authToken).update(payload).digest('base64'));
  const supplied = Buffer.from(signature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function notificationText(record) {
  const lead = record.lead;
  return [`Yard Vault ${lead.type} request`, `Ref: ${record.id}`, `Name: ${lead.name}`,
    lead.phone && `Phone: ${lead.phone}`, lead.email && `Email: ${lead.email}`,
    lead.interest && `Interest: ${lead.interest}`, lead.finish && `Finish: ${lead.finish}`,
    lead.location && `Location: ${lead.location}`, lead.preferredDate && `Visit: ${lead.preferredDate} ${lead.timeSlot}`,
    lead.financingOption && `Financing: ${lead.financingOption}`,
    lead.message && `Notes: ${lead.message}`].filter(Boolean).join('\n').slice(0, 1400);
}

export async function notifyTeam(config, record, fetchImpl = fetch) {
  const callback = new URL('/api/twilio/status', config.publicBaseUrl);
  callback.searchParams.set('leadId', record.id);
  const parameters = new URLSearchParams({To: config.teamPhone, Body: notificationText(record), StatusCallback: callback.href});
  parameters.set(config.messagingServiceSid ? 'MessagingServiceSid' : 'From', config.messagingServiceSid || config.from);
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: {'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`},
    body: parameters.toString()
  });
  const result = await response.json();
  if (!response.ok || !/^SM[0-9a-f]{32}$/i.test(result.sid || '')) {
    const error = new Error('Twilio could not accept the notification.');
    error.providerCode = Number.isInteger(result.code) ? result.code : null;
    error.definiteFailure = response.status >= 400 && response.status < 500 && response.status !== 408;
    throw error;
  }
  const states = ['accepted', 'scheduled', 'queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'canceled'];
  return {messageSid: result.sid, state: states.includes(result.status) ? result.status : 'accepted'};
}
