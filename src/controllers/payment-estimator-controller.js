export function initPaymentEstimator() {

(function(){
  var r=document.getElementById('estRange'); if(!r) return;
  var priceEl=document.getElementById('estPrice'), moEl=document.getElementById('estMo'),
      lblEl=document.getElementById('estTermLbl'), terms=document.getElementById('estTerms');
  var months=24;
  terms.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.classList.contains('active'))));
  function fmt(n){ return '$'+Math.round(n).toLocaleString('en-US'); }
  function upd(){ var p=+r.value; priceEl.textContent=fmt(p); moEl.textContent=fmt(Math.ceil(p/months)); lblEl.textContent=months; }
  r.addEventListener('input',upd);
  terms.addEventListener('click',function(e){ var b=e.target.closest('button[data-m]'); if(!b) return;
    months=+b.getAttribute('data-m');
    terms.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});
    upd(); });
  upd();
})();

}
