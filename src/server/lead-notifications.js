import {notifyTeam} from './twilio-service.js';

export async function deliverNotification(config, store, record, fetchImpl) {
  if (!config.enabled) return;
  try {
    const delivery = await notifyTeam(config, record, fetchImpl);
    await store.update(record.id, current => {
      current.notification.messageSid = delivery.messageSid;
      // A signed callback can arrive before the create-message request finishes.
      if (['pending', 'unknown'].includes(current.notification.state)) current.notification.state = delivery.state;
    });
  } catch (error) {
    await store.update(record.id, current => {
      if (current.notification.state !== 'pending') return;
      current.notification.state = error.definiteFailure ? 'failed' : 'unknown';
      current.notification.providerCode = error.providerCode || null;
    });
  }
}
