(function () {
  if (window.__modalCloseFix) return;
  window.__modalCloseFix = true;
  if (!document.getElementById('modalCloseCss')) {
    var s = document.createElement('style');
    s.id = 'modalCloseCss';
    s.textContent = '#videoModal.hidden{display:none!important;pointer-events:none!important}';
    document.head.appendChild(s);
  }
  function unlock() {
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
  }
  function closeModal() {
    var modal = document.getElementById('videoModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.removeAttribute('style');
    }
    var iframe = document.getElementById('modalIframe');
    if (iframe) {
      iframe.removeAttribute('style');
      iframe.src = 'about:blank';
    }
    var native = document.getElementById('modalNativeVideo');
    if (native) {
      try { native.pause(); } catch (e) {}
      native.removeAttribute('src');
      native.style.display = 'none';
    }
    unlock();
  }
  function hook() {
    var btn = document.getElementById('modalClose');
    var backdrop = document.getElementById('modalBackdrop');
    if (btn && !btn.__closeFix) {
      btn.__closeFix = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }, true);
    }
    if (backdrop && !backdrop.__closeFix) {
      backdrop.__closeFix = true;
      backdrop.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      }, true);
    }
  }
  hook();
  setTimeout(hook, 400);
})();
