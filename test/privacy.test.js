import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp, rm, writeFile, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateLead} from '../src/server/lead-model.js';
import {LeadStore} from '../src/server/lead-store.js';
import {createAppServer} from '../server.js';
import {leadConfig} from '../src/server/lead-config.js';

const input = overrides => ({submissionId:randomUUID(),type:'quote',name:'Privacy Test',email:'privacy@example.com',
  adultConfirmed:true,contactConsent:true,consentVersion:'2026-10-07',...overrides});

test('consent and adult confirmation are required, current, explicit, and cannot be forged with truthy strings', () => {
  for(const overrides of [{adultConfirmed:false},{adultConfirmed:'true'},{contactConsent:false},
    {contactConsent:'true'},{consentVersion:'old'},{adultConfirmed:undefined},{contactConsent:undefined}]) {
    assert.throws(()=>validateLead(input(overrides)));
  }
  const lead=validateLead(input({dateOfBirth:'2010-01-01',socialSecurityNumber:'do-not-store',marketingConsent:true}));
  assert.deepEqual(lead.consent,{adultConfirmed:true,contact:true,version:'2026-10-07'});
  assert.equal(lead.dateOfBirth,undefined);assert.equal(lead.socialSecurityNumber,undefined);assert.equal(lead.marketingConsent,undefined);
  for(const type of ['quote','showroom','chat','financing'])assert.equal(validateLead(input({type})).phone,'');
});

test('requests without consent do not create a lead record', async t => {
  const directory=await mkdtemp(join(tmpdir(),'yardvault-privacy-'));
  const server=createAppServer({leadOptions:{config:leadConfig({LEAD_DATA_DIR:directory})}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});});
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/leads`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input({contactConsent:false}))});
  assert.equal(response.status,400);assert.deepEqual(await readdir(directory),[]);
});

test('retention and deletion remove only validated inquiry records and do not recreate them on callbacks', async t => {
  const directory=await mkdtemp(join(tmpdir(),'yardvault-retention-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const store=new LeadStore(directory), old=input(), current=input(), now=Date.now();
  await store.create(old.submissionId,validateLead(old),false);
  await store.create(current.submissionId,validateLead(current),false);
  await store.update(old.submissionId,record=>{record.createdAt=new Date(now-181*86400000).toISOString();});
  await writeFile(join(directory,'operator-notes.json'),'{}');
  const legacyId=randomUUID();
  await writeFile(join(directory,legacyId+'.json'),JSON.stringify({id:legacyId,createdAt:new Date(now-365*86400000).toISOString()}));
  assert.equal(await store.prune({now}),1);assert.equal(await store.read(old.submissionId),null);
  assert.ok(await store.read(current.submissionId));assert.ok((await readdir(directory)).includes('operator-notes.json'));
  assert.ok(await store.read(legacyId),'legacy data must be reviewed before applying the new retention policy');
  await assert.rejects(()=>store.delete('../operator-notes'));
  assert.equal(await store.delete(current.submissionId),true);
  assert.equal(await store.update(current.submissionId,record=>{record.notification.state='delivered';}),null);
  assert.equal(await store.read(current.submissionId),null);
});
