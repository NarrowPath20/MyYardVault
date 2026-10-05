export function initPaymentEstimator() {

(function(){
  var veil=document.getElementById('introVeil');
  if(veil){
    var seen=false; try{ seen=sessionStorage.getItem('yvIntro')==='1'; }catch(e){}
    var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(seen||rm){ veil.remove(); }
    else{ requestAnimationFrame(function(){ requestAnimationFrame(function(){ veil.classList.add('off'); }); });
      setTimeout(function(){ veil.remove(); },1600);
      try{ sessionStorage.setItem('yvIntro','1'); }catch(e){} }
  }
  var r=document.getElementById('estRange'); if(!r) return;
  var priceEl=document.getElementById('estPrice'), moEl=document.getElementById('estMo'),
      lblEl=document.getElementById('estTermLbl'), terms=document.getElementById('estTerms');
  var months=24;
  function fmt(n){ return '$'+Math.round(n).toLocaleString('en-US'); }
  function upd(){ var p=+r.value; priceEl.textContent=fmt(p); moEl.textContent=fmt(Math.ceil(p/months)); lblEl.textContent=months; }
  r.addEventListener('input',upd);
  terms.addEventListener('click',function(e){ var b=e.target.closest('button[data-m]'); if(!b) return;
    months=+b.getAttribute('data-m');
    terms.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b);});
    upd(); });
  upd();
})();

}
