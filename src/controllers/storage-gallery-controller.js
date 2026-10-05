export function initStorageGallery() {

(function(){
  var wrap = document.getElementById('stGalThumbs');
  if(!wrap) return;
  var thumbs = Array.prototype.slice.call(wrap.querySelectorAll('.st-gt'));
  var big = document.getElementById('stGalImg');
  var cap = document.getElementById('stGalCap');
  var idx = document.getElementById('stGalIdx');
  var n = thumbs.length;
  function pad(x){ return ('0'+x).slice(-2); }
  function show(i){
    var t = thumbs[i], im = t.querySelector('img'), c = t.getAttribute('data-cap');
    big.src = im.src; big.alt = c;
    cap.textContent = c;
    idx.textContent = pad(i+1) + ' / ' + pad(n);
    thumbs.forEach(function(x){ x.classList.remove('active'); });
    t.classList.add('active');
  }
  thumbs.forEach(function(t,i){ t.addEventListener('click', function(){ show(i); }); });
})();

}
