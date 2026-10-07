export function initLightbox() {

(function(){
  var grid=document.getElementById('galGrid'), lb=document.getElementById('lightbox');
  if(!grid||!lb) return;
  var lbImg=lb.querySelector('.lb-img'), lbCap=lb.querySelector('.lb-cap');
  var list=[], idx=0;
  let trigger, background = [];
  grid.querySelectorAll('figure').forEach(figure => {
    figure.tabIndex=0; figure.setAttribute('role','button');
    figure.setAttribute('aria-label','Open image: '+figure.querySelector('img').alt);
    figure.addEventListener('keydown', event => {
      if(event.key==='Enter'||event.key===' ') {event.preventDefault();open(figure);}
    });
  });
  function visible(){ return Array.prototype.filter.call(grid.querySelectorAll('figure'),
    function(f){ return !f.classList.contains('hide'); }); }
  function show(i){
    if(!list.length) return;
    idx=(i+list.length)%list.length;
    var fig=list[idx], im=fig.querySelector('img'), cap=fig.querySelector('figcaption');
    lbImg.src=im.currentSrc||im.src; lbImg.alt=im.alt||'';
    lbCap.textContent=cap?cap.textContent:'';
  }
  function open(fig){ list=visible(); var i=list.indexOf(fig); show(i<0?0:i);
    trigger=fig; background=[...document.body.children].filter(el=>el!==lb).map(el=>[el,el.inert]);
    background.forEach(([el])=>{el.inert=true;});
    lb.inert=false; lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    requestAnimationFrame(()=>{if(lb.classList.contains('open'))lb.querySelector('.lb-close').focus();}); }
  function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); lb.inert=true;
    background.forEach(([el,inert])=>{el.inert=inert;}); background=[];
    document.body.style.overflow=''; trigger?.focus(); }
  grid.addEventListener('click',function(e){ var f=e.target.closest('figure'); if(f&&grid.contains(f)){ e.preventDefault(); open(f); } });
  lb.addEventListener('click',function(e){
    if(e.target===lb||e.target.classList.contains('lb-close')) close();
    else if(e.target.classList.contains('lb-next')) show(idx+1);
    else if(e.target.classList.contains('lb-prev')) show(idx-1);
  });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key==='Tab') {
      const buttons=[...lb.querySelectorAll('button')], first=buttons[0], last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
    if(e.key==='Escape') close();
    else if(e.key==='ArrowRight') show(idx+1);
    else if(e.key==='ArrowLeft') show(idx-1);
  });
})();

}
