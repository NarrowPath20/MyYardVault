// Read-only layout audit; screenshots and measured geometry go under out/spacing.
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppServer} from '../server.js';
import {leadConfig} from '../src/server/lead-config.js';
import {PAGES} from '../src/models/pages.js';

const profile=await mkdtemp(join(tmpdir(),'yardvault-spacing-'));
const server=createAppServer({leadOptions:{config:leadConfig({LEAD_DATA_DIR:join(profile,'leads')})}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser,socket;
try {
  browser=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',[
    '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'
  ],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{
    let output='';const timeout=setTimeout(()=>reject(Error('Browser startup timed out')),15000);
    browser.once('error',reject);browser.stderr.on('data',data=>{output+=data;const match=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
  });
  const targets=await(await fetch(endpoint.replace(/^ws:/,'http:').replace(/\/devtools\/browser\/.*/,'/json/list'))).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let next=0;const pending=new Map();
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await mkdir('out/spacing',{recursive:true});
  const report=[];
  const inspect=()=>{
    const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,w:r.width,h:r.height,right:r.right,bottom:r.bottom+scrollY};};
    const label=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.');
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    const clips=[],overlaps=[],metrics=[];
    for(const el of document.querySelectorAll('main h1,main h2,main h3,main p,main .txt,main figcaption,main .consent-check,footer p')){
      if(!visible(el))continue;
      const r=el.getBoundingClientRect();
      for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
        const s=getComputedStyle(p),pr=p.getBoundingClientRect();
        if(['hidden','clip'].includes(s.overflowX)&&(r.left<pr.left-2||r.right>pr.right+2))clips.push({element:label(el),container:label(p),elementRect:rect(el),containerRect:rect(p),axis:'x'});
        if(['hidden','clip'].includes(s.overflowY)&&(r.top<pr.top-2||r.bottom>pr.bottom+2))clips.push({element:label(el),container:label(p),elementRect:rect(el),containerRect:rect(p),axis:'y'});
      }
    }
    for(const container of document.querySelectorAll('.use-card,.spec-grid,.thesis-grid,.start-grid,.st-hero,.of-hero,.bw,.of-uc,.cookie-banner')){
      const children=[...container.children].filter(visible);
      for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
        const a=children[i],b=children[j];
        if(/scrim|hero-bg|hero-photo|weather|hero-grad/.test(a.className+' '+b.className))continue;
        const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
        const x=Math.min(ar.right,br.right)-Math.max(ar.left,br.left),y=Math.min(ar.bottom,br.bottom)-Math.max(ar.top,br.top);
        if(x>2&&y>2)overlaps.push({container:label(container),a:label(a),b:label(b),x,y,aRect:rect(a),bRect:rect(b)});
      }
    }
    for(const el of document.querySelectorAll('main h1,main > div > section,main > div.policy-page,.sec > .wrap,.st-sec > .wrap,.of-sec > .wrap,.kv-sec > .wrap,.mc-sec > .wrap,.cn-sec > .wrap,.acc-sec > .wrap,.use-card,.spec-card,.spec-mini,.start-switch,.consent-group,.chat-notice,.chat-consent,.yc-msgs,.yc-inrow,.policy-links')){
      if(!visible(el))continue;const s=getComputedStyle(el);
      metrics.push({element:label(el),rect:rect(el),padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],margin:[s.marginTop,s.marginRight,s.marginBottom,s.marginLeft],gap:s.gap,grid:s.gridTemplateColumns});
    }
    const header=document.querySelector('header').getBoundingClientRect(),h1=document.querySelector('main h1').getBoundingClientRect();
    return {actualPath:location.pathname,actualPage:document.body.dataset.page,clips,overlaps,metrics,headingGap:h1.top+scrollY-header.bottom,documentHeight:document.documentElement.scrollHeight};
  };
  async function capture(key,theme,width,height,state='default'){
    const data=await evaluate(`(${inspect.toString()})()`);
    report.push({key,theme,width,height,state,...data});
    const full=await send('Page.getLayoutMetrics');
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:full.cssContentSize.height,scale:1}});
    await writeFile(`out/spacing/${key}-${theme}-${width}-${state}.png`,Buffer.from(shot.data,'base64'));
    const target=key==='home'?'.use-grid':key==='build'?'.bw':key==='storage'?'.st-hero':key==='office'?'.of-uc':null;
    if(target&&state==='default'){
      const bounds=await evaluate(`(()=>{const r=document.querySelector('${target}').getBoundingClientRect();return {x:Math.max(0,r.x),y:Math.max(0,r.y+scrollY),width:Math.min(innerWidth,r.width),height:r.height,scale:1}})()`);
      const detail=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:bounds});
      await writeFile(`out/spacing/${key}-${theme}-${width}-detail.png`,Buffer.from(detail.data,'base64'));
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:base+'/contact'});
  for(let i=0;i<100;i++){if(await evaluate("location.pathname==='/contact' && document.documentElement?.dataset.appReady==='true'"))break;await new Promise(r=>setTimeout(r,50));}
  await evaluate("document.getElementById('cookieBanner').hidden=false");await capture('cookie','light',844,390,'landscape');
  await evaluate("document.getElementById('cookieSession').click();document.getElementById('yvChatFab').click()");
  await new Promise(r=>setTimeout(r,180));await capture('chat','light',844,390,'landscape');
  report.at(-1).chat=await evaluate("(()=>{const e=document.querySelector('.yc-msgs'),p=document.getElementById('yvChat');return {conversationHeight:e.getBoundingClientRect().height,panelHeight:p.getBoundingClientRect().height,noticeHeight:document.querySelector('.chat-notice').getBoundingClientRect().height,consentHeight:document.querySelector('.chat-consent').getBoundingClientRect().height,inputRect:document.querySelector('.yc-inrow').getBoundingClientRect().toJSON()}})()");
  await writeFile('out/spacing/measurements.json',JSON.stringify(report,null,2));
  const widths=[280,390,900,1024,1346,1440];
  for(const width of widths){
    const height=width<=390?844:900;
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});
    for(const [key,page] of Object.entries(PAGES)){
      await send('Page.navigate',{url:base+page.path});
      let ready=false;
      for(let i=0;i<150;i++){try{ready=await evaluate(`location.pathname===${JSON.stringify(page.path)} && document.documentElement?.dataset.appReady==='true'`);}catch{}if(ready)break;await new Promise(r=>setTimeout(r,50));}
      if(!ready)throw Error('Page not ready: '+page.path);
      await evaluate("document.getElementById('cookieSession').click();document.querySelectorAll('img').forEach(i=>i.loading='eager');document.fonts.ready");
      await new Promise(r=>setTimeout(r,250));
      await evaluate("document.documentElement.dataset.theme='dark'");
      await capture(key,'dark',width,height);
      if(width===1346||width===390){await evaluate("document.documentElement.dataset.theme='light'");await capture(key,'light',width,height);}
      if(key==='contact')for(const panel of ['quote','financing']){await evaluate(`window.__selectPanel('${panel}')`);await capture(key,'light',width,height,panel);}
    }
    await send('Page.navigate',{url:base+'/contact'});
    for(let i=0;i<100;i++){if(await evaluate("location.pathname==='/contact' && document.documentElement?.dataset.appReady==='true'"))break;await new Promise(r=>setTimeout(r,50));}
    await evaluate("document.getElementById('cookieBanner').hidden=false");await capture('cookie','light',width,height,'open');
    await evaluate("document.getElementById('cookieSession').click();document.getElementById('yvChatFab').click()");
    await new Promise(r=>setTimeout(r,180));await capture('chat','light',width,height,'open');
    const chat=await evaluate("(()=>{const e=document.querySelector('.yc-msgs'),p=document.getElementById('yvChat');return {conversationHeight:e.getBoundingClientRect().height,panelHeight:p.getBoundingClientRect().height,noticeHeight:document.querySelector('.chat-notice').getBoundingClientRect().height,consentHeight:document.querySelector('.chat-consent').getBoundingClientRect().height}})()");
    report.at(-1).chat=chat;
    await evaluate("document.querySelector('.yc-close').click();document.getElementById('burger').click();document.querySelectorAll('.menu-toggle').forEach(b=>b.click())");
    await capture('navigation','light',width,height,'expanded');
    await writeFile('out/spacing/measurements.json',JSON.stringify(report,null,2));
    console.log(`Audited ${width}px: 18 pages, form panels, cookie banner, chat, navigation.`);
  }
  console.log('Report: out/spacing/measurements.json');
}finally{
  socket?.close();if(browser&&browser.exitCode===null){const stopped=new Promise(r=>browser.once('exit',r));browser.kill();await stopped;}
  await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300});
}
