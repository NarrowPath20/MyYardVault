import {loadEnvFile} from 'node:process';
import {readdir} from 'node:fs/promises';
import {leadConfig} from '../src/server/lead-config.js';
import {LeadStore} from '../src/server/lead-store.js';
import {deliverNotification} from '../src/server/lead-notifications.js';

try { loadEnvFile('.env'); } catch(error) { if(error.code !== 'ENOENT')throw error; }
const config = leadConfig(), store = new LeadStore(config.directory);
const [command = 'list', id, flag] = process.argv.slice(2);
if(command === 'list') {
  let files = [];
  try { files = await readdir(config.directory); } catch(error) { if(error.code !== 'ENOENT')throw error; }
  const records = await Promise.all(files.filter(file=>file.endsWith('.json')).map(file=>store.read(file.slice(0,-5))));
  console.table(records.filter(Boolean).map(record=>({reference:record.id,createdAt:record.createdAt,type:record.lead.type,notification:record.notification.state})));
} else if(command === 'show') {
  const record = await store.read(id);
  if(!record)throw Error('Lead not found.');
  console.log(JSON.stringify(record,null,2));
} else if(command === 'retry') {
  if(!config.enabled || flag !== '--send')throw Error('Enable configured Twilio notifications and pass --send to notify the team.');
  const record = await store.read(id);
  if(!record)throw Error('Lead not found.');
  if(!['disabled','failed'].includes(record.notification.state) || record.notification.messageSid)throw Error('Check the existing message in Twilio before resending; this notification may already have been accepted.');
  await store.update(id,current=>{current.notification.state='pending';});
  await deliverNotification(config,store,record);
  console.log('Notification state:',(await store.read(id)).notification.state);
} else throw Error('Usage: node tools/leads.js list | show <reference> | retry <reference> --send');
