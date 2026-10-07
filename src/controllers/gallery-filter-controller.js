export function initGalleryFilter() {

(function(){
  var tabs=document.getElementById('galTabs'); if(!tabs) return;
  var figs=document.querySelectorAll('#galGrid > figure');
  tabs.querySelectorAll('button').forEach(function(btn){
    btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));
    btn.addEventListener('click',function(){
      var cat=btn.getAttribute('data-cat');
      tabs.querySelectorAll('button').forEach(function(b){b.classList.remove('active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      figs.forEach(function(f){ f.classList.toggle('hide', f.getAttribute('data-cat')!==cat); });
    });
  });
})();

}
