import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID, createHmac} from 'node:crypto';
import {createAppServer} from '../server.js';
import {leadConfig} from '../src/server/lead-config.js';
import {LeadStore} from '../src/server/lead-store.js';
import {validateLead} from '../src/server/lead-model.js';

const accountSid = 'AC'+'1'.repeat(32), messageSid = 'SM'+'2'.repeat(32);
const fakeToken = 'offline-test-token';
const lead = overrides => ({submissionId:randomUUID(),type:'quote',name:'Test Customer',phone:'(505) 555-0100',email:'test@example.com',interest:'Storage unit',sourcePage:'/contact',...overrides});

async function setup(t, {enabled=false, fetchImpl, rateLimit=10}={}) {
  const directory = await mkdtemp(join(tmpdir(),'yardvault-leads-test-'));
  const config = leadConfig({LEAD_DATA_DIR:directory});
  Object.assign(config,{enabled,accountSid,authToken:fakeToken,from:'+15055550101',teamPhone:'+15055550102',publicBaseUrl:enabled?'https://yardvault.example':''});
  const store = new LeadStore(directory);
  const server = createAppServer({leadOptions:{config,store,fetchImpl,rateLimit}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});});
  const post = input=>fetch(base+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  return {base,post,store,config};
}

test('local mode persists all lead types, normalizes contact fields, and never contacts Twilio', async t=>{
  const {post,store}=await setup(t,{fetchImpl:()=>{throw Error('Network must stay disabled.');}});
  for(const type of ['quote','showroom','financing','chat']) {
    const input=lead({type,preferredDate:type==='showroom'?'2027-02-01':'',timeSlot:type==='showroom'?'Morning (8-11am)':''});
    const response=await post(input), result=await response.json();
    assert.equal(response.status,202);assert.equal(result.accepted,true);
    assert.equal(result.reference,input.submissionId);
    assert.equal(result.phone,undefined);
    const stored=await store.read(result.reference);
    assert.equal(stored.lead.phone,'+15055550100');
    assert.equal(stored.notification.state,'disabled');
    assert.equal(stored.lead.type,type);
  }
});

test('Twilio alerts use server-configured recipient and sender and deduplicate concurrent submissions',async t=>{
  let calls=0;
  const {post,store}=await setup(t,{enabled:true,fetchImpl:async(url,options)=>{
    calls++;
    assert.equal(url,`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`);
    const parameters=new URLSearchParams(options.body);
    assert.equal(parameters.get('To'),'+15055550102');
    assert.equal(parameters.get('From'),'+15055550101');
    assert.ok(parameters.get('Body').includes('Test Customer'));
    assert.ok(parameters.get('StatusCallback').startsWith('https://yardvault.example/api/twilio/status?leadId='));
    assert.ok(options.headers.Authorization.startsWith('Basic '));
    return new Response(JSON.stringify({sid:messageSid,status:'queued'}),{status:201});
  }});
  const input=lead({teamPhone:'+19999999999'});
  const responses=await Promise.all([post(input),post(input),post(input)]);
  assert.ok(responses.every(response=>response.status===202));
  assert.equal(calls,1);
  assert.equal((await store.read(input.submissionId)).notification.messageSid,messageSid);
  assert.equal((await post({...input,name:'Different customer'})).status,409);
  assert.equal(calls,1);
});

test('provider failure and uncertain timeouts retain leads without triggering duplicate sends',async t=>{
  for(const uncertain of [false,true]) {
    let calls=0;
    const {post,store}=await setup(t,{enabled:true,fetchImpl:async()=>{
      calls++;
      if(uncertain)throw new Error('Request timed out.');
      return new Response(JSON.stringify({code:21606,message:'Private provider diagnostic'}),{status:400});
    }});
    const input=lead(),response=await post(input);
    assert.equal(response.status,202);
    const result=await response.json();
    assert.ok(!JSON.stringify(result).includes('diagnostic'));
    assert.equal((await store.read(input.submissionId)).notification.state,uncertain?'unknown':'failed');
    assert.equal((await post(input)).status,202);
    assert.equal(calls,1);
  }
});

test('signed callbacks update delivery state; invalid signatures and stale events cannot change it',async t=>{
  const {base,post,store}=await setup(t,{enabled:true,fetchImpl:async()=>new Response(JSON.stringify({sid:messageSid,status:'queued'}),{status:201})});
  const input=lead();await post(input);
  const path='/api/twilio/status?leadId='+input.submissionId;
  const callback=async(status,valid=true)=>{
    const parameters=new URLSearchParams({AccountSid:accountSid,MessageSid:messageSid,MessageStatus:status,To:'+15055550102',ExtraProviderField:'kept in signature'});
    const canonical='https://yardvault.example'+path+[...parameters.keys()].sort().map(key=>key+parameters.get(key)).join('');
    const signature=valid?createHmac('sha1',fakeToken).update(canonical).digest('base64'):'bad';
    return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Twilio-Signature':signature},body:parameters.toString()});
  };
  assert.equal((await callback('delivered',false)).status,403);
  assert.equal((await store.read(input.submissionId)).notification.state,'queued');
  assert.equal((await callback('delivered')).status,204);
  assert.equal((await callback('sent')).status,204);
  assert.equal((await callback('delivered')).status,204);
  const saved=await store.read(input.submissionId);
  assert.equal(saved.notification.state,'delivered');assert.equal(saved.notification.events.length,2);
});

test('API rejects invalid leads, cross-site requests, large bodies and unsupported formats',async t=>{
  const {post,base}=await setup(t,{rateLimit:30});
  for(const input of [lead({name:''}),lead({phone:'abc'}),lead({phone:'',email:''}),lead({email:'wrong'}),lead({preferredDate:'2027-02-30'}),lead({website:'spam'}),lead({submissionId:'../private'}),lead({type:'other'})]) {
    assert.equal((await post(input)).status,400);
  }
  assert.equal((await fetch(base+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://other.example'},body:JSON.stringify(lead())})).status,403);
  assert.equal((await fetch(base+'/api/leads',{method:'POST',headers:{'Content-Type':'text/plain'},body:'data'})).status,415);
  assert.equal((await fetch(base+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'})).status,400);
  assert.equal((await post(lead({message:'x'.repeat(17000)}))).status,413);
  assert.equal((await fetch(base+'/api/leads')).status,405);
  assert.equal((await fetch(base+'/api/unknown')).status,404);
  for(const path of ['/.env','/.data/leads','/server/lead-config.js','/server/lead-api.js'])assert.equal((await fetch(base+path)).status,404);
});

test('submission rate limiting returns a retry interval',async t=>{
  const {post}=await setup(t,{rateLimit:1});
  assert.equal((await post(lead())).status,202);
  const blocked=await post(lead());assert.equal(blocked.status,429);assert.ok(blocked.headers.get('retry-after'));
});

test('live delivery requires explicit activation and complete configuration',()=>{
  assert.equal(leadConfig({}).enabled,false);
  assert.throws(()=>leadConfig({TWILIO_NOTIFICATIONS_ENABLED:'true'}),/require/);
  assert.throws(()=>leadConfig({LEAD_DATA_DIR:'public/leads'}),/outside/);
  assert.throws(()=>leadConfig({PUBLIC_BASE_URL:'http://yardvault.example'}),/HTTPS/);
  assert.equal(validateLead(lead({phone:'',email:'TEST@EXAMPLE.COM'})).email,'test@example.com');
});
