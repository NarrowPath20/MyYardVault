import {CONSENT_VERSION} from '../models/privacy.js';

export class LeadError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export const submissionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value, field, limit) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new LeadError(`Please check the ${field} field.`);
  return value.trim();
}

export function normalizePhone(value) {
  if (!value) return '';
  if (!/^[+\d\s().-]+$/.test(value)) throw new LeadError('Please enter a valid phone number.');
  const digits = value.replace(/\D/g, '');
  let phone = value.startsWith('+') ? `+${digits}` : digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith('1') ? `+${digits}` : '';
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new LeadError('Please enter a valid phone number, including the country code for numbers outside the US.');
  return phone;
}

export function validateLead(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new LeadError('Please check your request.');
  if (input.adultConfirmed !== true) throw new LeadError('These inquiry forms are for adults 18 and older. Do not submit children\'s information.');
  if (input.contactConsent !== true || input.consentVersion !== CONSENT_VERSION) throw new LeadError('Please confirm permission to respond to your request and review the current privacy notice.');
  if (input.website) throw new LeadError('Unable to submit this request.');
  if (typeof input.submissionId !== 'string' || !submissionIdPattern.test(input.submissionId)) throw new LeadError('Please refresh the page and try again.');
  if (!['quote', 'showroom', 'financing', 'chat'].includes(input.type)) throw new LeadError('Please select a request type.');
  const name = text(input.name, 'name', 100);
  if (name.length < 2) throw new LeadError('Please enter your name.');
  const phone = normalizePhone(text(input.phone, 'phone', 40));
  const email = text(input.email, 'email', 254).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new LeadError('Please enter a valid email address.');
  if (!phone && !email) throw new LeadError('Please provide a phone number or email address so we can reach you.');
  const preferredDate = text(input.preferredDate, 'date', 10);
  if (preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(preferredDate)) || new Date(preferredDate).toISOString().slice(0,10) !== preferredDate)) throw new LeadError('Please choose a valid visit date.');
  const timeSlot = text(input.timeSlot, 'time', 40);
  if (timeSlot && !['Morning (8-11am)', 'Midday (11am-2pm)', 'Afternoon (2-5pm)', 'Evening (5-7pm)'].includes(timeSlot)) throw new LeadError('Please choose a valid visit time.');
  const sourcePage = text(input.sourcePage, 'page', 120);
  if (sourcePage && (!sourcePage.startsWith('/') || /[?#\r\n]/.test(sourcePage))) throw new LeadError('Please refresh the page and try again.');
  return {
    type: input.type, name, phone, email,
    consent: {contact:true, adultConfirmed:true, version:CONSENT_VERSION},
    interest: text(input.interest, 'interest', 150),
    finish: text(input.finish, 'finish', 80),
    message: text(input.message, 'message', 2000),
    location: text(input.location, 'location', 150),
    financingOption: text(input.financingOption, 'financing option', 150),
    preferredDate, timeSlot, sourcePage
  };
}
