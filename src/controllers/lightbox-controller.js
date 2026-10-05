export function initLightbox() {

(function(){
  var grid=document.getElementById('galGrid'), lb=document.getElementById('lightbox');
  if(!grid||!lb) return;
  var lbImg=lb.querySelector('.lb-img'), lbCap=lb.querySelector('.lb-cap');
  var list=[], idx=0;
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
    lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  grid.addEventListener('click',function(e){ var f=e.target.closest('figure'); if(f&&grid.contains(f)){ e.preventDefault(); open(f); } });
  lb.addEventListener('click',function(e){
    if(e.target===lb||e.target.classList.contains('lb-close')) close();
    else if(e.target.classList.contains('lb-next')) show(idx+1);
    else if(e.target.classList.contains('lb-prev')) show(idx-1);
  });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowRight') show(idx+1);
    else if(e.key==='ArrowLeft') show(idx-1);
  });
})();

}
