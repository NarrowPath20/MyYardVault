export function initImmersion() {
/* ===== immersion: depth parallax ===== */
(function(){
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plx=[...document.querySelectorAll('[data-parallax]')];
  function par(){ const vh=innerHeight; for(const el of plx){ const r=el.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2)-vh/2; const a=parseFloat(el.dataset.parallax)||0.06; el.style.transform='translate3d(0,'+(-c*a).toFixed(1)+'px,0)'; } }
  if(!RM && plx.length){ addEventListener('scroll',()=>requestAnimationFrame(par),{passive:true}); addEventListener('resize',par); par(); }
})();



}
