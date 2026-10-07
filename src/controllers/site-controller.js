import {STOCK_FINISHES, SWATCHES, RAL, SPECIAL_ORDER_FINISHES, SIZES, SIZE_ORDER, ST_FINISHES} from '../models/catalog.js';
export function initSite(scene) {
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- NAV / UI ---------------- */
const hdr=document.getElementById('hdr');
addEventListener('scroll',()=>hdr.classList.toggle('scrolled',scrollY>40),{passive:true});
const burger=document.getElementById('burger'), mmenu=document.getElementById('mmenu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mmenu.setAttribute('aria-hidden', String(!open));
  mmenu.inert = !open;
  if (!open) mmenu.querySelectorAll('.menu-toggle').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    document.getElementById(button.getAttribute('aria-controls')).hidden = true;
  });
  if (open) { mmenu.scrollTop = 0; mmenu.querySelector('button').focus({preventScroll:true}); }
}
burger.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
mmenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
hdr.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
mmenu.querySelectorAll('.menu-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    document.getElementById(button.getAttribute('aria-controls')).hidden = !expanded;
  });
});
document.addEventListener('click', event => {
  if (document.body.classList.contains('menu-open') && !mmenu.contains(event.target) && !hdr.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') { setMenu(false); burger.focus(); }
  if (event.key === 'Tab') {
    const items = [burger, ...mmenu.querySelectorAll('a, button')].filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    if (event.shiftKey && document.activeElement === items[0]) {event.preventDefault(); items.at(-1).focus();}
    else if (!event.shiftKey && document.activeElement === items.at(-1)) {event.preventDefault(); burger.focus();}
  }
});

/* swatches UI */
const swWrap=document.getElementById('swatches');
if(swWrap) SWATCHES.forEach((s,i)=>{
  const b=document.createElement('button');
  b.className='swatch'+(i===0?' active':''); b.style.background=s.hex; b.dataset.name=s.name;
  b.setAttribute('aria-label',s.name);
  b.setAttribute('aria-pressed', String(i === 0));
  b.addEventListener('click',()=>{
    swWrap.querySelectorAll('.swatch').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
    b.classList.add('active'); b.setAttribute('aria-pressed','true'); scene.setVaultColor(s);
    document.querySelector('.swatch-row .lbl').textContent='Stocked finish: '+s.name;
  });
  swWrap.appendChild(b);
});
if(swWrap) scene.setVaultColor(SWATCHES[0]);

/* storage finish swatches -> recolor the shed ; view toggle -> switch door photo */

const stsw=document.getElementById('stSwatches');
if(stsw){ ST_FINISHES.forEach((sw,i)=>{
  const b=document.createElement('button');
  b.className='swatch'+(i===0?' active':''); b.style.background=sw.hex; b.dataset.name=sw.name; b.setAttribute('aria-label',sw.name); b.setAttribute('aria-pressed',String(i===0));
  b.addEventListener('click',()=>{ stsw.querySelectorAll('.swatch').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');}); b.classList.add('active'); b.setAttribute('aria-pressed','true'); document.querySelector('.st-finish-lbl').textContent='Stocked finish: '+sw.name; if(window.__recolorShed) window.__recolorShed(sw.hex); document.body.classList.add('st-focus'); if(window.__stRedraw) window.__stRedraw(); });
  stsw.appendChild(b);
}); }
document.querySelectorAll('#stViews .st-view').forEach(v=>{
  v.setAttribute('aria-pressed',String(v.classList.contains('active')));
  v.addEventListener('click',()=>{
  document.querySelectorAll('#stViews .st-view').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');}); v.classList.add('active');v.setAttribute('aria-pressed','true');
  if(window.__setShedView) window.__setShedView(v.dataset.shedView);
});});


/* recolor ONLY the shed in each door photo, keeping its real shading */
(function(){
  const cv=document.getElementById('stBgCanvas'); if(!cv) return;
  const ctx=cv.getContext('2d');
  /* --- day -> evening -> night time-of-day cycle (30s per phase) --- */
  const TOD_KF=[
    {t:0,  mul:[255,255,255], dark:[0,0,0,0],      glow:0},
    {t:30, mul:[255,150,86],  dark:[30,15,8,0.10], glow:0.26},
    {t:60, mul:[58,74,128],   dark:[6,9,26,0.44],  glow:0},
    {t:90, mul:[255,255,255], dark:[0,0,0,0],      glow:0}
  ];
  const TOD_PERIOD=90; const TOD_t0=performance.now(); const _lp=(a,b,f)=>a+(b-a)*f;
  function todNow(){ let t=((performance.now()-TOD_t0)/1000)%TOD_PERIOD; let i=0; while(i<TOD_KF.length-1 && t>=TOD_KF[i+1].t) i++;
    const a=TOD_KF[i], b=TOD_KF[i+1], f=(t-a.t)/(b.t-a.t);
    return { mul:[_lp(a.mul[0],b.mul[0],f),_lp(a.mul[1],b.mul[1],f),_lp(a.mul[2],b.mul[2],f)],
      dark:[_lp(a.dark[0],b.dark[0],f),_lp(a.dark[1],b.dark[1],f),_lp(a.dark[2],b.dark[2],f),_lp(a.dark[3],b.dark[3],f)], glow:_lp(a.glow,b.glow,f) }; }
  function applyTOD(vw,vh){ const s=todNow();
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle='rgb('+(s.mul[0]|0)+','+(s.mul[1]|0)+','+(s.mul[2]|0)+')'; ctx.fillRect(0,0,vw,vh);
    ctx.globalCompositeOperation='source-over';
    if(s.dark[3]>0.002){ ctx.fillStyle='rgba('+(s.dark[0]|0)+','+(s.dark[1]|0)+','+(s.dark[2]|0)+','+s.dark[3]+')'; ctx.fillRect(0,0,vw,vh); }
    if(s.glow>0.002){ const g=ctx.createRadialGradient(vw*0.5,vh*0.74,0,vw*0.5,vh*0.74,vh*0.75); g.addColorStop(0,'rgba(255,150,60,'+s.glow+')'); g.addColorStop(1,'rgba(255,150,60,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,vw,vh); }
    ctx.globalCompositeOperation='source-over'; }
  const scenes={
    side:{bg:document.getElementById('stBgSrc'),  mask:document.getElementById('stMaskSrc')},
    end: {bg:document.getElementById('stBgSrc2'), mask:document.getElementById('stMaskSrc2')}
  };
  let view='side', color=ST_FINISHES[0].hex;
  const PHOTO={ '#0f9199':{side:document.getElementById('stCTeal'), end:document.getElementById('stCTealEnd')}, '#15487c':{side:document.getElementById('stCBlue'), end:document.getElementById('stCBlueEnd')}, '#cba54a':{side:document.getElementById('stCSand'), end:document.getElementById('stCSandEnd')}, '#2f5233':{side:document.getElementById('stCGreen'), end:document.getElementById('stCGreenEnd')}, '#555e61':{side:document.getElementById('stCGrey'), end:document.getElementById('stCGreyEnd')}, '#52504c':{side:document.getElementById('stCCharcoal'), end:document.getElementById('stCCharcoalEnd')}, '#a7acaa':{side:document.getElementById('stCWhiteal'), end:document.getElementById('stCWhitealEnd')}, '#a2302a':{side:document.getElementById('stCRed'), end:document.getElementById('stCRedEnd')}, '#6a2b8c':{side:document.getElementById('stCViolet'), end:document.getElementById('stCVioletEnd')}, '#15151a':{side:document.getElementById('stCBlack'), end:document.getElementById('stCBlackEnd')} };
  const hexToRgb=h=>{h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,ss,l=(mx+mn)/2;if(mx===mn){h=ss=0;}else{const d=mx-mn;ss=l>0.5?d/(2-mx-mn):d/(mx+mn);switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}return [h,ss,l];}
  const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  function hslToRgb(h,s,l){let r,g,b;if(s===0){r=g=b=l;}else{const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return [r*255,g*255,b*255];}
  function ensure(k){ const S=scenes[k]; if(S.ready) return true;
    if(!S.bg||!S.mask||!S.bg.complete||!S.mask.complete||!S.bg.naturalWidth) return false;
    const NW=S.bg.naturalWidth, NH=S.bg.naturalHeight;
    const off=document.createElement('canvas'); off.width=NW; off.height=NH; const octx=off.getContext('2d',{willReadFrequently:true});
    octx.drawImage(S.bg,0,0,NW,NH); const orig=octx.getImageData(0,0,NW,NH).data.slice(0);
    const mc=document.createElement('canvas'); mc.width=NW; mc.height=NH; const mx=mc.getContext('2d',{willReadFrequently:true});
    mx.drawImage(S.mask,0,0,NW,NH); const alpha=mx.getImageData(0,0,NW,NH).data;
    const idx=[], Ls=[];
    for(let i=0;i<NW*NH;i++){ if(alpha[i*4]>8){ idx.push(i); const p=i*4; Ls.push((0.299*orig[p]+0.587*orig[p+1]+0.114*orig[p+2])/255); } }
    Ls.sort((a,b)=>a-b);
    S.NW=NW; S.NH=NH; S.off=off; S.octx=octx; S.orig=orig; S.alpha=alpha; S.idx=idx; S.Lmid=Ls.length?Ls[Math.floor(Ls.length/2)]:0.42; S.Lref=Ls.length?Ls[Math.floor(Ls.length*0.85)]:0.8; if(S.Lref<0.12)S.Lref=0.12; S.ready=true; return true; }
  function apply(k){ const S=scenes[k]; if(!S.ready) return;
    const img=S.octx.getImageData(0,0,S.NW,S.NH), d=img.data; d.set(S.orig);
    if(color){ const c=hexToRgb(color), tr=c[0], tg=c[1], tb=c[2], Lref=S.Lref||0.8;
      for(let j=0;j<S.idx.length;j++){ const p=S.idx[j]*4, a=S.alpha[p]/255;
        const L=(0.299*S.orig[p]+0.587*S.orig[p+1]+0.114*S.orig[p+2])/255;
        let fct=L/Lref; if(fct>1.18)fct=1.18;
        d[p]=S.orig[p]*(1-a)+tr*fct*a; d[p+1]=S.orig[p+1]*(1-a)+tg*fct*a; d[p+2]=S.orig[p+2]*(1-a)+tb*fct*a; } }
    S.octx.putImageData(img,0,0); }
  function draw(){ const S=scenes[view]; if(!S||!S.ready) return;
    const vw=innerWidth, vh=innerHeight, dpr=Math.min(devicePixelRatio||1,2);
    const cw=Math.round(vw*dpr), ch=Math.round(vh*dpr); if(cv.width!==cw||cv.height!==ch){ cv.width=cw; cv.height=ch; }
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,vw,vh);
    const P=color?PHOTO[color]:null; const ph=P?(P[view]||P.any):null; let src,sw,sh; if(ph&&ph.complete&&ph.naturalWidth){src=ph;sw=ph.naturalWidth;sh=ph.naturalHeight;}else{src=S.off;sw=S.NW;sh=S.NH;} const sc=Math.max(vw/sw,vh/sh), dw=sw*sc, dh=sh*sc; ctx.drawImage(src,(vw-dw)/2,(vh-dh)*0.42,dw,dh);
    applyTOD(vw,vh); }
  function render(){ if(ensure(view)){ apply(view); draw(); } }
  window.__recolorShed=hex=>{ color=hex; render(); };
  window.__setShedView=v=>{ if(scenes[v]){ view=v; render(); } };
  window.__stRedraw=draw;
  Object.keys(scenes).forEach(k=>{ const S=scenes[k]; if(S.bg) S.bg.addEventListener('load',render); if(S.mask) S.mask.addEventListener('load',render); });
  ['stCTeal','stCBlue','stCSand','stCGreen','stCGrey','stCCharcoal','stCWhiteal','stCRed','stCViolet','stCBlack','stCTealEnd','stCBlueEnd','stCSandEnd','stCGreenEnd','stCGreyEnd','stCCharcoalEnd','stCWhitealEnd','stCRedEnd','stCVioletEnd','stCBlackEnd'].forEach(id=>{ const im=document.getElementById(id); if(im) im.addEventListener('load',()=>{ if(scenes[view]&&scenes[view].ready) draw(); }); });
  addEventListener('resize',()=>{ if(scenes[view]&&scenes[view].ready) draw(); });
  render();
  (function todLoop(){ if(document.body.classList.contains('on-storage') && scenes[view] && scenes[view].ready) draw(); setTimeout(()=>requestAnimationFrame(todLoop), 55); })();
})();

/* color chips */
const quoteFinish=document.getElementById('qColor');
if(quoteFinish){
  const stocked=document.createElement('optgroup'); stocked.label='Stocked finishes';
  STOCK_FINISHES.forEach(finish=>stocked.appendChild(new Option(`${finish.name} (${finish.code})`,finish.name)));
  const special=document.createElement('optgroup'); special.label='Special order: substantial delivery delays';
  SPECIAL_ORDER_FINISHES.forEach(finish=>special.appendChild(new Option(`${finish.n} (${finish.c}) - special order`,`${finish.n} - special order`)));
  quoteFinish.append(stocked,special,new Option('Not sure yet','Not sure yet'));
}
document.querySelectorAll('.stock-finish-grid,.special-finish-grid').forEach(cg=>{
const finishes=cg.classList.contains('special-finish-grid')?SPECIAL_ORDER_FINISHES:RAL;
finishes.forEach(r=>{
  const d=document.createElement('div'); d.className='chip';
  d.innerHTML=`<div class="sw" style="background:${r.h}"></div><div class="meta"><b>${r.n}</b><span>${cg.classList.contains('special-finish-grid')?'Special order': 'Stocked finish'}</span><span>${r.c}</span></div>`;
  cg.appendChild(d);
});
});

/* size selector */
const sizeTabs=document.getElementById('sizeTabs');
let firstTab;
if(sizeTabs) SIZE_ORDER.forEach((k,i)=>{
  const b=document.createElement('button'); b.className='size-tab'+(k==='10'?' active':'');
  b.innerHTML=k+'&prime;'; b.dataset.k=k;
  b.setAttribute('aria-pressed',String(k==='10'));
  b.addEventListener('click',()=>selectSize(k,b));
  sizeTabs.appendChild(b);
});
function selectSize(k,btn){
  document.querySelectorAll('.size-tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
  btn.classList.add('active');
  btn.setAttribute('aria-pressed','true');
  const s=SIZES[k];
  const img=document.getElementById('sizeImg');
  img.style.opacity=0;
  setTimeout(()=>{img.src=s.img; img.alt=k+'-foot storage vault with dimensions'; img.style.opacity=1;},180);
  document.getElementById('sizeView').style.background=s.bg;
  document.getElementById('sizeTag').innerHTML=s.tag;
  document.getElementById('sizeName').innerHTML=s.name;
  document.getElementById('sizeDims').innerHTML=k+'&prime; L &times; 7.5&prime; W &times; 7.2&prime; H';
  document.getElementById('sizeArea').innerHTML=s.area;
  document.getElementById('sizeFor').innerHTML=s.use;
  document.getElementById('sizeDoor').innerHTML=s.door;
  document.getElementById('sizePrice').innerHTML=s.price;
  document.getElementById('sizeNote').innerHTML=s.note;
}
if(sizeTabs) document.getElementById('sizeView').style.background=SIZES['10'].bg;

/* use-case cards switch the immersive scene (Storage -> your backyard) */
(function(){
  const cards=[...document.querySelectorAll('.use-card[data-scene]')];
  const hint=document.getElementById('sceneHint');
  const head=document.querySelector('#uses .sec-head');
  const eb=head&&head.querySelector('.eyebrow'), h2=head&&head.querySelector('h2'), lead=head&&head.querySelector('.lead');
  const orig=head?{e:eb.textContent,h:h2.textContent,l:lead.textContent}:null;
  const back={e:'See it at home', h:'Picture it in your backyard.',
    l:'Your vault, in the finish you picked, sitting on blocks at dusk, like it has always been there. Tap another use to head back to the showroom.'};
  function copy(on){ if(!head) return; eb.textContent=on?back.e:orig.e; h2.textContent=on?back.h:orig.h; lead.textContent=on?back.l:orig.l; }
  cards.forEach(c=>{
    c.setAttribute('role','button'); c.setAttribute('tabindex','0');
    const go=()=>{ const m=c.dataset.scene, on=(m==='backyard'); if(typeof scene.setScene==='function') scene.setScene(m);
      document.body.classList.toggle('scene-backyard', on);
      cards.forEach(x=>x.classList.toggle('active', x===c && on));
      copy(on);
      if(hint) hint.textContent = on
        ? 'You\u2019re seeing it in your backyard, tap another use to return to the showroom.'
        : 'Tap \u201cStorage\u201d to picture it in your backyard.';
      if(on){ const u=document.getElementById('uses'); if(u) u.scrollIntoView({behavior:'smooth',block:'start'}); }
    };
    c.addEventListener('click',go);
    c.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
  });
})();

/* get-started: option picker + showroom / quote / financing forms */
(function(){
  const opts=[...document.querySelectorAll('.opt')];
  const names=['showroom','quote','financing'];
  function selectPanel(name){
    if(names.indexOf(name)<0) return;
    opts.forEach(o=>{o.classList.toggle('active', o.dataset.panel===name);o.setAttribute('aria-pressed',String(o.dataset.panel===name));});
    names.forEach(p=>{ const el=document.getElementById('panel-'+p); if(el) el.hidden=(p!==name); });
  }
  opts.forEach(o=>o.addEventListener('click',()=>selectPanel(o.dataset.panel)));
  document.querySelectorAll('[data-open]').forEach(a=>a.addEventListener('click',()=>selectPanel(a.dataset.open)));
  window.__selectPanel=selectPanel;
  if(opts.length)selectPanel(opts.find(o=>o.classList.contains('active'))?.dataset.panel || 'showroom');

  const dateEl=document.getElementById('sDate');
  if(dateEl){ const t=new Date(); t.setDate(t.getDate()+1); dateEl.min=t.toISOString().split('T')[0]; }
  document.querySelectorAll('#slots .slot').forEach(b=>{
    b.setAttribute('aria-pressed',String(b.classList.contains('active')));
    b.addEventListener('click',()=>{
    document.querySelectorAll('#slots .slot').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');}); b.classList.add('active');b.setAttribute('aria-pressed','true');
  });});

})();


}
