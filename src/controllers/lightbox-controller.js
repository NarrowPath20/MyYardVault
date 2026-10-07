export function initLightbox() {

(function(){
  var grid=document.getElementById('main-content'), lb=document.getElementById('lightbox');
  if(!grid||!lb) return;
  var lbImg=lb.querySelector('.lb-img'), lbCap=lb.querySelector('.lb-cap');
  var list=[], idx=0, previousFocus, previousOverflow, background=[];
  function visible(){ return Array.prototype.filter.call(grid.querySelectorAll('img.image-focus-trigger'),
    function(im){ return im.getClientRects().length && !im.closest('.hide, [hidden], [aria-hidden="true"]'); }); }
  function show(i){
    if(!list.length) return;
    idx=(i+list.length)%list.length;
    var im=list[idx], cap=im.closest('figure')?.querySelector('figcaption');
    lbImg.src=im.currentSrc||im.src; lbImg.alt=im.alt||'';
    lbCap.textContent=cap?cap.textContent:im.alt;
    lb.querySelectorAll('.lb-nav').forEach(button => { button.hidden=list.length<2; });
  }
  function open(im){ list=visible(); var i=list.indexOf(im); if(i<0)return; show(i);
    previousFocus=document.activeElement; previousOverflow=document.body.style.overflow;
    background=Array.from(document.body.children).filter(el=>el!==lb).map(el=>[el,el.inert]);
    background.forEach(([el])=>{el.inert=true;});
    lb.inert=false; lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    requestAnimationFrame(()=>{if(lb.classList.contains('open'))lb.querySelector('.lb-close').focus();}); }
  function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); lb.inert=true; document.body.style.overflow=previousOverflow;
    background.forEach(([el,inert])=>{el.inert=inert;}); background=[]; previousFocus?.focus(); }
  grid.querySelectorAll('img').forEach(im=>{
    if(im.closest('button,[role="button"]'))return;
    im.classList.add('image-focus-trigger'); im.tabIndex=0; im.setAttribute('role','button');
    im.setAttribute('aria-haspopup','dialog'); im.setAttribute('aria-label','View image: '+(im.alt||'Website photo'));
  });
  grid.addEventListener('click',function(e){
    var im=e.target.closest('img')||e.target.closest('#galGrid figure')?.querySelector('img');
    if(im&&visible().includes(im)){e.preventDefault();e.stopPropagation();im.focus({preventScroll:true});open(im);}
  },true);
  grid.addEventListener('keydown',function(e){
    if(e.target.matches('img')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();open(e.target);}
  },true);
  lb.addEventListener('click',function(e){
    if(e.target===lb||e.target.classList.contains('lb-close')) close();
    else if(e.target.classList.contains('lb-next')) show(idx+1);
    else if(e.target.classList.contains('lb-prev')) show(idx-1);
  });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open')) return;
    if(e.key==='Escape'){e.preventDefault();close();}
    else if(e.key==='ArrowRight'){e.preventDefault();show(idx+1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();show(idx-1);}
    else if(e.key==='Tab'){
      var controls=Array.from(lb.querySelectorAll('button')).filter(button=>!button.hidden);
      var current=controls.indexOf(document.activeElement);
      e.preventDefault();controls[(current+(e.shiftKey?-1:1)+controls.length)%controls.length].focus();
    }
  });
})();

}
