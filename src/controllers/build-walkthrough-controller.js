import {DATA} from '../models/build-walkthrough.js';
export function initBuildWalkthrough() {

(function(){
  var rail=document.getElementById('bwRail'); if(!rail) return;
  
  var steps=Array.prototype.slice.call(rail.querySelectorAll('.bw-step'));
  var img=document.getElementById('bwImg'),tag=document.getElementById('bwTag'),ttl=document.getElementById('bwTitle'),cpy=document.getElementById('bwCopy'),need=document.getElementById('bwNeed');
  function show(i){var d=DATA[i]; if(!d) return; img.style.opacity=0;
    setTimeout(function(){img.src=d.uri; img.style.opacity=1;},150);
    tag.innerHTML=d.tag; ttl.innerHTML=d.title; cpy.innerHTML=d.copy; need.innerHTML=d.need;
    steps.forEach(function(s){s.classList.remove('active');}); steps[i].classList.add('active');}
  steps.forEach(function(s,i){ s.addEventListener('click',function(){show(i);}); s.addEventListener('mouseenter',function(){show(i);}); });
})();

}
