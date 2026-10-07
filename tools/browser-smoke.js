import {spawn} from 'node:child_process';
import {mkdtemp, rm, mkdir, writeFile, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppServer} from '../server.js';
import {PAGES} from '../src/models/pages.js';
import {leadConfig} from '../src/server/lead-config.js';
import {LeadStore} from '../src/server/lead-store.js';

const executable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await mkdtemp(join(tmpdir(), 'yardvault-browser-'));
const leadConfiguration = leadConfig({LEAD_DATA_DIR:join(profile, 'test-leads')});
const leadStore = new LeadStore(leadConfiguration.directory);
const server = createAppServer({leadOptions:{config:leadConfiguration,store:leadStore,fetchImpl:()=>{throw Error('Browser checks must not send SMS.');}}});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser, socket;
try {
  browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
    {windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(Error('Browser startup timed out')), 15000);
    browser.once('error', reject);
    browser.stderr.on('data', data => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {clearTimeout(timeout); resolve(match[1]);}
    });
  });
  const targets = await (await fetch(endpoint.replace(/^ws:/, 'http:').replace(/\/devtools\/browser\/.*/, '/json/list'))).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
  let nextId = 0;
  const pending = new Map(), errors = [], checks = [], externalRequests = new Set();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {const call = pending.get(message.id); pending.delete(message.id); message.error ? call.reject(message.error) : call.resolve(message.result);}
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if(message.method === 'Network.requestWillBeSent') {
      const url=message.params.request.url;
      if(/^https?:/.test(url)&&new URL(url).origin!==new URL(base).origin)externalRequests.add(new URL(url).origin);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params}));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const check = async (name, expression) => {
    if (!await evaluate(expression)) throw Error(name);
    checks.push(name);
  };
  const ready = async path => {
    for (let i=0;i<100;i++) {
      let loaded=false;
      try { loaded=await evaluate(`location.pathname===${JSON.stringify(path)} && document.documentElement?.dataset.appReady==='true'`); }
      catch (error) {if(!/context|Cannot find/i.test(JSON.stringify(error)))throw error;}
      if(loaded)return;
      if(errors.length)throw Error(JSON.stringify(errors));
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw Error('Initialization timed out: '+path);
  };
  const navigate = async path => {
    await send('Page.navigate',{url:base+path});
    await ready(new URL(base+path).pathname);
  };
  const screenshot = async name => {
    await new Promise(resolve=>setTimeout(resolve,200));
    const result=await send('Page.captureScreenshot',{format:'png'});
    await writeFile(`out/responsive/${name}.png`,Buffer.from(result.data,'base64'));
  };
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-color-scheme',value:'light'}]});
  await navigate('/');
  await check('privacy notice has no optional tracking consent', "!document.getElementById('cookieBanner').hidden && document.cookie==='' && !document.querySelector('#cookieBanner input:checked')");
  await evaluate("document.getElementById('cookieSession').click()");
  await check('continue without saving dismisses notice without persistent acknowledgement', "document.getElementById('cookieBanner').hidden && localStorage.getItem('yard-vault-privacy')===null");
  await check('light theme follows device preference', "document.documentElement.dataset.theme==='light' && getComputedStyle(document.body).backgroundColor==='rgb(250, 249, 246)' && getComputedStyle(document.body).color==='rgb(32, 44, 48)'");
  await evaluate("document.getElementById('themeToggle').click(); new Promise(resolve => setTimeout(resolve, 350))");
  await check('toggle applies dark palette and accessible label', "document.documentElement.dataset.theme==='dark' && getComputedStyle(document.body).backgroundColor==='rgb(20, 31, 35)' && getComputedStyle(document.body).color==='rgb(245, 244, 239)' && document.getElementById('themeToggle').getAttribute('aria-label')==='Switch to light mode'");
  await navigate('/contact');
  await check('theme persists across navigation', "document.documentElement.dataset.theme==='dark'");
  await send('Page.reload');
  await ready('/contact');
  await check('theme persists after reload', "document.documentElement.dataset.theme==='dark'");
  await evaluate("document.getElementById('themeToggle').click(); new Promise(resolve => setTimeout(resolve, 350))");
  await navigate('/');
  await check('light theme restores and persists', "document.documentElement.dataset.theme==='light' && getComputedStyle(document.body).backgroundColor==='rgb(250, 249, 246)'");
  await send('Emulation.setDeviceMetricsOverride', {width:320,height:740,deviceScaleFactor:1,mobile:true});
  await check('theme control fits smallest mobile header', "document.getElementById('themeToggle').getBoundingClientRect().right<=320 && document.getElementById('burger').getBoundingClientRect().right<=320 && document.documentElement.scrollWidth<=320");
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await check('homepage contains only its own page', "document.querySelectorAll('main > div[id$=\"-view\"]').length===1 && !!document.getElementById('home-view') && !document.getElementById('storage-view') && !document.getElementById('start')");
  await check('home offers only the three stocked finishes', "JSON.stringify([...document.querySelectorAll('#swatches button')].map(b=>b.dataset.name))===JSON.stringify(['White Aluminum','Oyster White','Slate Grey'])");
  await check('home separates special-order colors and delivery warning', "document.querySelectorAll('.stock-finish-grid .chip').length===3 && document.querySelectorAll('.special-finish-grid .chip').length>0 && document.querySelector('.finish-special').textContent.includes('substantial delivery delays')");
  await evaluate("const motion=document.getElementById('pauseMotion');if(!motion.hidden && motion.getAttribute('aria-pressed')!=='true')motion.click()");
  await check('viewer motion can be paused or unavailable viewer controls are hidden', "(document.getElementById('pauseMotion').hidden && getComputedStyle(document.getElementById('heroFallback')).opacity==='1') || document.getElementById('pauseMotion').getAttribute('aria-pressed')==='true'");
  await evaluate("document.getElementById('burger').click()");
  await check('submenus start collapsed', "document.getElementById('menu-products').hidden && document.getElementById('menu-solutions').hidden");
  await evaluate("document.querySelector('[aria-controls=\"menu-products\"]').click();document.querySelector('[aria-controls=\"menu-solutions\"]').click()");
  await check('products and solutions expand independently', "!document.getElementById('menu-products').hidden && !document.getElementById('menu-solutions').hidden");
  await evaluate("document.querySelector('#menu-products [data-view=\"office\"]').click()");
  await ready('/office');
  await check('submenu performs native page navigation', "!!document.getElementById('office-view') && !document.getElementById('home-view') && !document.body.classList.contains('menu-open')");
  await evaluate("document.querySelectorAll('#ofUcTabs .of-uc-tab')[1].click()");
  await check('office use cases work', "document.getElementById('ofUcTitle').textContent.includes('Medical')");
  const history=await send('Page.getNavigationHistory');
  await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id});
  await ready('/');
  checks.push('browser Back returns to homepage');
  await evaluate("document.querySelector('.use-card[data-view=\"kiosk\"]').click()");
  await ready('/kiosk');
  checks.push('product summary opens its own page');
  await evaluate("document.querySelector('header .brand').click()");
  await ready('/');
  checks.push('logo navigates home');
  for(const [key,page] of Object.entries(PAGES)) {
    await navigate(page.path);
    await check(key+' is isolated at its direct URL', `document.body.dataset.page===${JSON.stringify(key)} && document.querySelectorAll('main > div[id$="-view"]').length===1 && !!document.getElementById(${JSON.stringify(key+'-view')})`);
    await evaluate("document.documentElement.style.scrollBehavior='auto';scrollTo(0,document.documentElement.scrollHeight)");
    await check(key+' scroll stays on the current page', `location.pathname===${JSON.stringify(page.path)} && document.querySelectorAll('main > div[id$="-view"]').length===1 && !!document.querySelector('footer')`);
  }
  await navigate('/sizes');
  await evaluate("document.querySelector('#sizeTabs button[data-k=\"19\"]').click()");
  await new Promise(resolve=>setTimeout(resolve,400));
  await check('size selector price and image', "document.getElementById('sizePrice').textContent==='$8,100' && document.getElementById('sizeImg').naturalWidth>0");
  await navigate('/storage');
  await evaluate("document.querySelector('a[href=\"#st-sizes\"]').click()");
  await check('storage size link stays within storage', "location.pathname==='/storage' && !!document.getElementById('st-sizes') && !document.getElementById('sizes-view')");
  await evaluate("document.querySelector('[data-go-fin]').click()");
  await ready('/contact');
  await check('financing CTA opens correct contact panel', "!document.getElementById('panel-financing').hidden && document.getElementById('panel-showroom').hidden");
  await evaluate("const range=document.getElementById('estRange');range.value=9600;range.dispatchEvent(new Event('input'))");
  await check('payment estimator works on contact page', "document.getElementById('estPrice').textContent==='$9,600'");
  await evaluate("document.querySelector('header [data-open=\"quote\"]').click()");
  await new Promise(resolve=>setTimeout(resolve,200));
  await ready('/contact');
  await check('quote CTA opens correct panel', "!document.getElementById('panel-quote').hidden && document.getElementById('panel-financing').hidden");
  await evaluate(`window.__leadReceipts=[];const originalFetch=window.fetch;window.fetch=async(...args)=>{
    const response=await originalFetch(...args);
    if(args[0]==='/api/leads')window.__leadReceipts.push(await response.clone().json());
    return response;
  };document.getElementById('qName').value='Browser Test';document.getElementById('qPhone').value='';document.getElementById('qEmail').value='';document.getElementById('quoteForm').requestSubmit();`);
  await check('consent is unchecked and blocks form submission', "window.__leadReceipts.length===0 && !document.querySelector('#quoteForm [name=contactConsent]').checked");
  await evaluate("document.querySelectorAll('#quoteForm input[type=checkbox]').forEach(el=>el.checked=true);document.getElementById('quoteForm').requestSubmit()");
  await new Promise(resolve=>setTimeout(resolve,150));
  await check('form shows backend validation errors', "document.querySelector('#quoteForm .lead-status').textContent.includes('phone number or email')");
  await evaluate("document.getElementById('qEmail').value='browser@example.com';document.getElementById('quoteForm').requestSubmit()");
  await new Promise(resolve=>setTimeout(resolve,200));
  await check('quote form submits directly without email-client handoff', "document.querySelector('#quoteForm .lead-status').textContent.includes('has been received') && !document.querySelector('#quoteForm button[type=\"submit\"]').disabled");
  let reference=await evaluate('window.__leadReceipts.at(-1).reference');
  if((await leadStore.read(reference)).lead.type!=='quote')throw Error('Quote was not persisted');
  await evaluate("document.getElementById('quoteForm').requestSubmit()");
  await new Promise(resolve=>setTimeout(resolve,200));
  await check('form retry reuses reference', 'window.__leadReceipts.at(-1).reference===window.__leadReceipts.at(-2).reference');
  await evaluate("window.__selectPanel('showroom');document.querySelectorAll('#showroomForm input[type=checkbox]').forEach(el=>el.checked=true);document.getElementById('vName').value='Browser Test';document.getElementById('vPhone').value='5055550100';document.getElementById('showroomForm').requestSubmit()");
  await new Promise(resolve=>setTimeout(resolve,200));
  await check('showroom form submits', "document.querySelector('#showroomForm .lead-status').textContent.includes('has been received')");
  await evaluate("window.__selectPanel('financing');document.querySelectorAll('#finForm input[type=checkbox]').forEach(el=>el.checked=true);document.getElementById('fName').value='Browser Test';document.getElementById('fPhone').value='5055550100';document.getElementById('finForm').requestSubmit()");
  await new Promise(resolve=>setTimeout(resolve,200));
  await check('financing inquiry submits', "document.querySelector('#finForm .lead-status').textContent.includes('has been received')");
  await evaluate("document.getElementById('yvChatFab').click();document.getElementById('ycInput').value='sizes';document.getElementById('ycForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
  await new Promise(resolve=>setTimeout(resolve,1500));
  await check('shared chat works on separate pages', "document.getElementById('ycMsgs').textContent.includes('Seven sizes')");
  const chatMessage=async text=>{
    await evaluate(`document.getElementById('ycInput').value=${JSON.stringify(text)};document.getElementById('ycForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);
    await new Promise(resolve=>setTimeout(resolve,1300));
  };
  await chatMessage('human');
  await evaluate("document.getElementById('chatAdult').checked=true;document.getElementById('chatConsent').checked=true");
  await evaluate("[...document.querySelectorAll('.yc-chips button')].find(b=>b.textContent.includes('someone reach out')).click()");
  await new Promise(resolve=>setTimeout(resolve,1300));
  for(const answer of ['Storage unit','Browser Chat Test','5055550100','chat@example.com','Gallup, NM'])await chatMessage(answer);
  await new Promise(resolve=>setTimeout(resolve,1300));
  await evaluate("[...document.querySelectorAll('.yc-chips button')].find(b=>b.textContent==='Send request').click()");
  await new Promise(resolve=>setTimeout(resolve,1500));
  await check('chat submits a lead and confirms actual acceptance', "document.getElementById('ycMsgs').textContent.includes('Your request has been received')");
  reference=await evaluate('window.__leadReceipts.at(-1).reference');
  if((await leadStore.read(reference)).lead.type!=='chat')throw Error('Chat lead was not persisted');
  await navigate('/gallery');
  await evaluate("document.querySelector('#galGrid figure').click()");
  await new Promise(resolve=>setTimeout(resolve,100));
  await check('gallery lightbox opens', "document.getElementById('lightbox').classList.contains('open')");
  await check('lightbox moves focus and makes background inert', "document.activeElement.classList.contains('lb-close') && document.getElementById('main-content').inert");
  await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
  await check('gallery lightbox closes', "!document.getElementById('lightbox').classList.contains('open')");
  await check('lightbox restores keyboard focus', "document.activeElement.matches('#galGrid figure') && !document.getElementById('main-content').inert && document.getElementById('lightbox').inert");
  await send('Page.navigate',{url:base+'/#storage'});
  await ready('/storage');
  checks.push('legacy hash bookmark redirects to real storage URL');
  await send('Page.reload');
  await new Promise(resolve=>setTimeout(resolve,200));
  await ready('/storage');
  checks.push('product URL survives reload');
  await check('storage uses the same three stocked finishes and accurate swatch colors', "JSON.stringify([...document.querySelectorAll('#stSwatches button')].map(b=>b.dataset.name))===JSON.stringify(['White Aluminum','Oyster White','Slate Grey']) && document.querySelectorAll('#stSwatches button')[1].style.backgroundColor==='rgb(227, 217, 198)'");
  await navigate('/sizes');
  await check('sizes separates stocked and special-order finishes', "JSON.stringify([...document.querySelectorAll('.stock-finish-grid .meta b')].map(b=>b.textContent))===JSON.stringify(['White Aluminum','Oyster White','Slate Grey']) && [...document.querySelectorAll('.special-finish-grid .meta')].every(e=>e.textContent.includes('Special order')) && document.querySelector('.finish-special').textContent.includes('substantial delivery delays')");
  await mkdir('out/responsive',{recursive:true});
  for(const width of [390,1440]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1024});
    for(const path of ['/','/storage'])for(const theme of ['light','dark']) {
      await navigate(path);
      await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.querySelector('.quote-disclosure').scrollIntoView({block:'center',behavior:'instant'})`);
      await check(`disclosure stays above fixed visual layers: ${path} ${theme} ${width}`, `(()=>{
        const disclosure=document.querySelector('.quote-disclosure'),s=getComputedStyle(disclosure);
        const visuals=[...document.querySelectorAll('#vault-canvas,#stBgCanvas,.hero-fallback')];
        const original=visuals.map(v=>v.style.pointerEvents);visuals.forEach(v=>v.style.pointerEvents='auto');
        try {
          return s.position==='relative' && Number(s.zIndex)>0 && s.backgroundColor===getComputedStyle(document.body).backgroundColor &&
            [...disclosure.querySelectorAll('p')].length===3 && [...disclosure.querySelectorAll('p')].every(p=>{
              p.scrollIntoView({block:'center',behavior:'instant'});const r=p.getBoundingClientRect();
              const hit=document.elementFromPoint(r.left+Math.min(20,r.width/2),r.top+Math.min(8,r.height/2));
              return r.left>=0 && r.right<=innerWidth && disclosure.contains(hit);
            });
        } finally {visuals.forEach((v,i)=>v.style.pointerEvents=original[i]);}
      })()`);
      await evaluate("document.querySelector('.quote-disclosure').scrollIntoView({block:'center',behavior:'instant'})");
      await screenshot(`disclosure-${path==='/'?'home':'storage'}-${theme}-${width}`);
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  if(process.argv.includes('--accessibility')) {
    await mkdir('out/responsive',{recursive:true});
    const axe = await readFile(new URL('./vendor/axe.min.js',import.meta.url),'utf8');
    const report=[];
    for(const theme of ['light','dark']) {
      for(const [key,page] of Object.entries(PAGES)) {
        await navigate(page.path);
        await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
        await new Promise(resolve=>setTimeout(resolve,700));
        await evaluate(axe);
        const audit=async state=>{
          const result=await evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))}))");
          report.push({page:key,theme,state,...result});
        };
        await audit('default');
        if(['home','office','contact','gallery'].includes(key))await screenshot(`audit-${theme}-${key}`);
        if(key==='contact')for(const panel of ['quote','financing']) {await evaluate(`window.__selectPanel('${panel}')`);await audit(panel);}
        console.log(`Accessibility: ${theme} ${page.path}`);
      }
    }
    await mkdir('out/audit',{recursive:true});await writeFile('out/audit/accessibility.json',JSON.stringify(report,null,2));
    const failures=report.filter(r=>r.violations.length);
    if(failures.length)errors.push({accessibility:failures});
  }
  if(process.argv.includes('--responsive')) {
    await mkdir('out/responsive',{recursive:true});
    const dimensions=[[280,320],[320,568],[390,844],[540,720],[768,1024],[844,390],[1024,600],[1440,900],[2560,1080]];
    for(const [width,height] of dimensions) {
      await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1024});
      for(const [key,page] of Object.entries(PAGES)) {
        await navigate(page.path);
        const audit=await evaluate(`(()=>{
          document.documentElement.style.scrollBehavior='auto';
          document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
          const failures=[],root=document.getElementById('main-content'),menu=document.getElementById('mmenu');
          if(getComputedStyle(menu).visibility!=='hidden'||!menu.inert)failures.push('closed navigation visible');
          for(const el of [...root.querySelectorAll('h1,h2,h3,p,a,button,input,select,textarea'),...document.querySelectorAll('footer a,footer p')]) {
            const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
            if(!rect.width||!rect.height||style.visibility==='hidden')continue;
            let scroller=false;
            for(let p=el.parentElement;p&&p!==root;p=p.parentElement)if(['auto','scroll'].includes(getComputedStyle(p).overflowX)){scroller=true;break;}
            if(!scroller&&(rect.left < -1||rect.right>innerWidth+1))failures.push(el.tagName+'.'+el.className+' outside viewport');
            if(!scroller&&el.clientWidth>0&&style.display!=='inline'&&el.scrollWidth>el.clientWidth+2)failures.push(el.tagName+'.'+el.className+' clips content');
          }
          document.getElementById('burger').click();
          menu.querySelectorAll('.menu-toggle').forEach(el=>el.click());menu.scrollTop=menu.scrollHeight;
          const last=menu.querySelector('.btn').getBoundingClientRect();
          if(last.bottom>innerHeight+1||last.top<68)failures.push('menu action unreachable');
          if(getComputedStyle(document.getElementById('yvChatFab')).display!=='none')failures.push('chat covers menu');
          document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
          if(document.body.classList.contains('menu-open'))failures.push('Escape does not close menu');
          return [...new Set(failures)];
        })()`);
        if(audit.length)errors.push({viewport:`${width}x${height}`,page:key,failures:audit});
        if([390,844,1440].includes(width)&&['home','storage','contact','gallery'].includes(key)) {
          await evaluate('scrollTo(0,0)');await screenshot(`${key}-${width}x${height}`);
        }
      }
      console.log(`${width}x${height}: checked all ${Object.keys(PAGES).length} independent pages`);
    }
  }
  if(externalRequests.size)errors.push({unexpectedThirdPartyRequests:[...externalRequests]});
  else checks.push('no third-party browser requests');
  if(errors.length)throw Error(JSON.stringify(errors));
  console.log(`PASS: ${checks.length} browser checks; no JavaScript exceptions.`);
  console.log(checks.join(', '));
} finally {
  socket?.close();
  if(browser&&browser.exitCode===null){const stopped=new Promise(resolve=>browser.once('exit',resolve));browser.kill();await stopped;}
  await new Promise(resolve=>server.close(resolve));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:300});
}
