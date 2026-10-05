import {DATA} from '../models/office-use-cases.js';
export function initOfficeUseCases() {

(function(){
  
  var tabsWrap=document.getElementById('ofUcTabs'); if(!tabsWrap) return;
  var tabs=Array.prototype.slice.call(tabsWrap.querySelectorAll('.of-uc-tab'));
  var img=document.getElementById('ofUcImg'), tag=document.getElementById('ofUcTag'),
      ttl=document.getElementById('ofUcTitle'), cpy=document.getElementById('ofUcCopy');
  function show(i){
    var d=DATA[i]; if(!d) return;
    img.style.opacity=0;
    setTimeout(function(){ img.src=d.uri; img.style.opacity=1; },150);
    tag.innerHTML=d.tag; ttl.innerHTML=d.title; cpy.innerHTML=d.copy;
    tabs.forEach(function(x){x.classList.remove('active');}); tabs[i].classList.add('active');
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){ show(i); });
    t.addEventListener('mouseenter',function(){ show(i); });
  });
})();

}
