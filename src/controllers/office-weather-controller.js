export function initOfficeWeather() {

(function(){
  var hero=document.querySelector('#office-view .of-hero'); if(!hero) return;
  var c=document.createElement('canvas'); c.className='of-weather'; hero.appendChild(c);
  var ctx=c.getContext('2d'), W=1,H=1,flakes=[];
  function resize(){ var r=hero.getBoundingClientRect(); W=c.width=Math.max(1,Math.round(r.width)); H=c.height=Math.max(1,Math.round(r.height)); }
  function mk(rand){ return {x:Math.random()*W, y:rand?Math.random()*H:-8, r:0.7+Math.random()*2.2, sp:0.35+Math.random()*1.0, dr:(Math.random()-0.5)*0.5, sw:Math.random()*6.28}; }
  function init(){ resize(); var n=Math.round(W*H/15000); flakes=[]; for(var i=0;i<n;i++) flakes.push(mk(true)); }
  function step(){
    if(!document.body.classList.contains('on-office')){ ctx.clearRect(0,0,W,H); return requestAnimationFrame(step); }
    var r=hero.getBoundingClientRect(), nw=Math.max(1,Math.round(r.width)), nh=Math.max(1,Math.round(r.height));
    if(nh>2 && (nw!==W||nh!==H)) init();
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff';
    for(var i=0;i<flakes.length;i++){ var f=flakes[i]; f.y+=f.sp; f.sw+=0.02; f.x+=Math.sin(f.sw)*0.4+f.dr;
      if(f.y>H+6){ f.x=Math.random()*W; f.y=-6; } if(f.x<-6)f.x=W+6; if(f.x>W+6)f.x=-6;
      ctx.globalAlpha=0.35+0.5*Math.min(1,f.r/2.4); ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,6.29); ctx.fill(); }
    ctx.globalAlpha=1; requestAnimationFrame(step);
  }
  var rt; addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(init,150); });
  init(); requestAnimationFrame(step);
})();

}
