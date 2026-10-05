export function initImmersion() {
/* ===== immersion: cursor glow, depth parallax, card tilt ===== */
(function(){
  const HOVER=matchMedia('(hover:hover)').matches;
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(HOVER){
    const root=document.documentElement;
    addEventListener('pointermove',e=>{root.style.setProperty('--mx',e.clientX+'px');root.style.setProperty('--my',e.clientY+'px');},{passive:true});
  }
  const plx=[...document.querySelectorAll('[data-parallax]')];
  function par(){ const vh=innerHeight; for(const el of plx){ const r=el.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2)-vh/2; const a=parseFloat(el.dataset.parallax)||0.06; el.style.transform='translate3d(0,'+(-c*a).toFixed(1)+'px,0)'; } }
  if(!RM && plx.length){ addEventListener('scroll',()=>requestAnimationFrame(par),{passive:true}); addEventListener('resize',par); par(); }
  if(HOVER && !RM){
    document.querySelectorAll('.spec-card,.use-card,.chip').forEach(c=>{
      c.addEventListener('pointermove',e=>{ const r=c.getBoundingClientRect(); const px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5; c.style.transform='perspective(820px) rotateX('+(-py*5).toFixed(2)+'deg) rotateY('+(px*6).toFixed(2)+'deg) translateY(-5px)'; });
      c.addEventListener('pointerleave',()=>{ c.style.transform=''; });
    });
  }
})();



}
