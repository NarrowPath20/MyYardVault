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
    setTimeout(function(){ img.src=d.uri; img.alt=d.title.replace(/&amp;/g,'&'); img.style.opacity=1; },150);
    tag.innerHTML=d.tag; ttl.innerHTML=d.title; cpy.innerHTML=d.copy;
    tabs.forEach(function(x,j){x.classList.toggle('active',j===i);x.setAttribute('aria-pressed',String(j===i));});
  }
  tabs.forEach(function(t,i){
    t.setAttribute('aria-pressed',String(i===0));
    t.addEventListener('click',function(){ show(i); });
  });
})();

}
