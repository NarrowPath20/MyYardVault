// Reuse the reference when retrying an identical request, preventing duplicate alerts.
export function createLeadSubmitter() {
  let previousPayload, submissionId;
  return async function submitLead(lead) {
    const payload = JSON.stringify({...lead, sourcePage: location.pathname});
    if (payload !== previousPayload) { previousPayload = payload; submissionId = crypto.randomUUID(); }
    const response = await fetch('/api/leads', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...JSON.parse(payload), submissionId}), signal: AbortSignal.timeout(20000)
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('We could not submit your request. Please try again or contact us by phone or email.'); }
    if (!response.ok || !result.accepted) throw new Error(result.error || 'We could not submit your request. Please try again.');
    return result;
  };
}
