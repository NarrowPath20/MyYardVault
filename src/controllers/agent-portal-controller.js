import {showToast} from '../views/renderers/notifications.js';
export function initAgentPortal() {

(function(){
  document.querySelectorAll('[data-agent-portal]').forEach(function(a){
    a.addEventListener('click',function(e){
      if(a.getAttribute('href')==='#'){ e.preventDefault(); if(typeof showToast==='function') showToast('Agent login coming soon.'); }
    });
  });
})();

}
