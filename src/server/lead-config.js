import {resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const phonePattern = /^\+[1-9]\d{7,14}$/;

export function leadConfig(environment = process.env) {
  const config = {
    enabled: environment.TWILIO_NOTIFICATIONS_ENABLED === 'true',
    directory: resolve(root, environment.LEAD_DATA_DIR || '.data/leads'),
    accountSid: environment.TWILIO_ACCOUNT_SID || '',
    authToken: environment.TWILIO_AUTH_TOKEN || '',
    from: environment.TWILIO_FROM_NUMBER || '',
    messagingServiceSid: environment.TWILIO_MESSAGING_SERVICE_SID || '',
    teamPhone: environment.LEAD_TEAM_PHONE || '',
    publicBaseUrl: environment.PUBLIC_BASE_URL || ''
  };
  const publicDirectory = resolve(root, 'public');
  const normalizePath = path => process.platform === 'win32' ? path.toLowerCase() : path;
  if(normalizePath(config.directory) === normalizePath(publicDirectory) || normalizePath(config.directory).startsWith(normalizePath(publicDirectory + sep))) throw new Error('Lead records must be stored outside the public website directory.');
  if (config.publicBaseUrl) {
    const url = new URL(config.publicBaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('PUBLIC_BASE_URL must be a public HTTPS origin without a path or query.');
    }
    config.publicBaseUrl = url.origin;
  }
  if (config.enabled) {
    if (!/^AC[0-9a-f]{32}$/i.test(config.accountSid) || !config.authToken || !phonePattern.test(config.teamPhone) || !config.publicBaseUrl) {
      throw new Error('Twilio notifications require ACCOUNT_SID, AUTH_TOKEN, LEAD_TEAM_PHONE, and PUBLIC_BASE_URL.');
    }
    if (config.messagingServiceSid ? !/^MG[0-9a-f]{32}$/i.test(config.messagingServiceSid) : !phonePattern.test(config.from)) {
      throw new Error('Configure a valid TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER.');
    }
  }
  return config;
}
