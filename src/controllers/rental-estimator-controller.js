export function initRentalEstimator() {

(function(){
  var comp=document.getElementById('mcComp'); if(!comp) return;
  var rate=document.getElementById('mcRate'), mo=document.getElementById('mcMonthly'), yr=document.getElementById('mcYearly');
  var n=8;
  function fmt(x){ return '$'+Math.round(x).toLocaleString('en-US'); }
  function render(){
    var r=parseFloat(rate.value)||0; if(n<1)n=1; if(n>60)n=60;
    comp.textContent=n; mo.textContent=fmt(n*r); yr.textContent=fmt(n*r*12);
  }
  document.querySelectorAll('#mc-roi [data-step]').forEach(function(b){ b.addEventListener('click',function(){ n+=parseInt(b.getAttribute('data-step'),10); render(); }); });
  document.querySelectorAll('#mc-roi [data-comp]').forEach(function(b){ b.addEventListener('click',function(){ n=parseInt(b.getAttribute('data-comp'),10); render(); }); });
  rate.addEventListener('input', render);
  render();
})();

}
