import {mkdir, readFile, writeFile, rename, unlink, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import {LeadError, submissionIdPattern} from './lead-model.js';

// Local single-process persistence. Replace this adapter with the client's CRM/database.
export class LeadStore {
  constructor(directory) { this.directory = directory; this.operations = new Map(); }
  path(id) {
    if (!submissionIdPattern.test(id)) throw new LeadError('Invalid request reference.');
    return join(this.directory, `${id.toLowerCase()}.json`);
  }
  async locked(id, action) {
    const previous = this.operations.get(id) || Promise.resolve();
    const operation = previous.catch(() => {}).then(action);
    this.operations.set(id, operation);
    try { return await operation; }
    finally { if (this.operations.get(id) === operation) this.operations.delete(id); }
  }
  async read(id) {
    try { return JSON.parse(await readFile(this.path(id), 'utf8')); }
    catch(error) { if(error.code === 'ENOENT') return null; throw error; }
  }
  async write(record) {
    await mkdir(this.directory, {recursive: true, mode: 0o700});
    const temporary = join(this.directory, `${record.id}.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, JSON.stringify(record, null, 2) + '\n', {mode: 0o600, flag: 'wx'});
      await rename(temporary, this.path(record.id));
    } finally { await unlink(temporary).catch(error => { if(error.code !== 'ENOENT') throw error; }); }
  }
  async create(id, lead, notify) {
    id = id.toLowerCase();
    return this.locked(id, async () => {
      const fingerprint = createHash('sha256').update(JSON.stringify(lead)).digest('hex');
      const existing = await this.read(id);
      if (existing) {
        if (existing.fingerprint !== fingerprint) throw new LeadError('This request changed. Please refresh the page and submit again.', 409);
        return {created: false, record: existing};
      }
      const record = {id, createdAt: new Date().toISOString(), retentionDays:180, fingerprint, lead,
        notification: {state: notify ? 'pending' : 'disabled', messageSid: null, events: []}};
      await this.write(record);
      return {created: true, record};
    });
  }
  async update(id, mutate) {
    return this.locked(id.toLowerCase(), async () => {
      const record = await this.read(id);
      if (!record) return null;
      mutate(record);
      record.updatedAt = new Date().toISOString();
      await this.write(record);
      return record;
    });
  }
  async delete(id) {
    return this.locked(id.toLowerCase(), async () => {
      try { await unlink(this.path(id)); return true; }
      catch(error) { if(error.code === 'ENOENT') return false; throw error; }
    });
  }
  async prune({now = Date.now(), days = 180} = {}) {
    let files;
    try { files = await readdir(this.directory); }
    catch(error) { if(error.code === 'ENOENT') return 0; throw error; }
    let removed = 0;
    for (const file of files) {
      const id = file.replace(/\.json$/, '');
      if (!file.endsWith('.json') || !submissionIdPattern.test(id)) continue;
      await this.locked(id, async () => {
        const record = await this.read(id);
        // Older records predate this policy and require an operator's retention review.
        if (record?.retentionDays === 180 && Date.parse(record.createdAt) < now - days * 86400000) {
          await unlink(this.path(id)); removed++;
        }
      });
    }
    return removed;
  }
}
