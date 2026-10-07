import {createLeadSubmitter} from '../models/lead-client.js';
import {CONSENT_VERSION} from '../models/privacy.js';

export function initLeadForms() {
  const value = id => document.getElementById(id)?.value || '';
  const forms = [
    {id: 'showroomForm', payload: () => ({type: 'showroom', name: value('vName'), phone: value('vPhone'), location: value('vZip'), interest: value('vSize'), preferredDate: value('sDate'), timeSlot: document.querySelector('#slots .slot.active')?.dataset.v || ''})},
    {id: 'quoteForm', payload: () => ({type: 'quote', name: value('qName'), phone: value('qPhone'), email: value('qEmail'), interest: value('qSize'), finish: value('qColor'), message: value('qMsg')})},
    {id: 'finForm', payload: () => ({type: 'financing', name: value('fName'), phone: value('fPhone'), financingOption: value('fType')})}
  ];
  for (const {id, payload} of forms) {
    const form = document.getElementById(id);
    if (!form) continue;
    const submit = createLeadSubmitter(), button = form.querySelector('[type="submit"]');
    const status = form.querySelector('.lead-status');
    let submitting = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || !form.reportValidity()) return;
      submitting = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
      status.textContent = 'Sending your request...'; status.classList.remove('lead-error');
      try {
        const result = await submit({...payload(), website: form.elements.website.value,
          contactConsent:form.elements.contactConsent.checked, adultConfirmed:form.elements.adultConfirmed.checked,
          consentVersion:CONSENT_VERSION});
        status.textContent = `Your request has been received. Reference: ${result.reference.slice(0,8)}.`;
      } catch(error) {
        status.classList.add('lead-error');
        status.textContent = error.name === 'TimeoutError' || error.name === 'TypeError' ? 'We could not confirm your submission. Please try again or contact us by phone or email.' : error.message;
      } finally {
        submitting = false; button.disabled = false; form.removeAttribute('aria-busy');
      }
    });
  }
}
