(function () {
  function cardTitle(card) {
    var h = card.querySelector('h3');
    return (h && h.textContent || 'Video').trim();
  }
  function cardCat(card) {
    var s = card.querySelector('span');
    return (s && s.textContent || '').trim();
  }
  function keepIframe(src) {
    var u = String(src || '').toLowerCase();
    return u.indexOf('indoav') !== -1 || u.indexOf('userbokep') !== -1;
  }
  function fixIframe(card) {
    var frame = card.querySelector('iframe');
    if (!frame) return;
    if (keepIframe(frame.getAttribute('src') || frame.src)) return;
    var title = cardTitle(card);
    var cat = cardCat(card);
    var img = document.createElement('img');
    img.src = '/api/thumb?title=' + encodeURIComponent(title) + '&cat=' + encodeURIComponent(cat);
    img.alt = title;
    img.width = 480;
    img.height = 270;
    img.decoding = 'async';
    img.className = frame.className || 'absolute inset-0 w-full h-full object-cover bg-black pointer-events-none';
    frame.parentNode.replaceChild(img, frame);
  }
  function scan(root) {
    (root || document).querySelectorAll('.video-card').forEach(fixIframe);
  }
  var t = null;
  function schedule() {
    clearTimeout(t);
    t = setTimeout(function () { scan(document); }, 50);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
  var obs = new MutationObserver(schedule);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
