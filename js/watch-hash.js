(function () {
  function keyFrom(u) {
    if (!u || u === "about:blank") return "";
    try {
      var url = new URL(u, location.href);
      return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
    } catch (_) {
      return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
    }
  }
  function setHash(id) {
    if (!id) return;
    var next = "#v=" + encodeURIComponent(id);
    if (location.hash !== next) history.replaceState(null, "", "/" + next);
  }
  function clearHash() {
    if (location.hash.indexOf("#v=") === 0) history.replaceState(null, "", "/");
  }
  function currentId() {
    var iframe = document.getElementById("modalIframe");
    var native = document.getElementById("modalNativeVideo");
    return keyFrom(iframe && iframe.src) || keyFrom(native && native.src);
  }
  function openFromHash() {
    var m = location.hash.match(/^#v=([^&]+)/);
    if (!m) return;
    var id = decodeURIComponent(m[1]);
    var modal = document.getElementById("videoModal");
    var iframe = document.getElementById("modalIframe");
    if (!modal || !iframe || !id) return;
    var card = document.querySelector('.video-card[data-id="' + id + '"], .video-card iframe[src*="' + id + '"], .video-card video[src*="' + id + '"]');
    if (card) {
      var wrap = card.closest ? card.closest(".video-card") || card : card;
      wrap.click();
      return;
    }
    modal.classList.remove("hidden");
    iframe.style.display = "";
    iframe.src = "https://puterin.biz/e/" + encodeURIComponent(id);
    var title = document.getElementById("modalTitle");
    if (title && !title.textContent) title.textContent = id;
  }
  function track() {
    var modal = document.getElementById("videoModal");
    if (!modal) return;
    if (modal.classList.contains("hidden")) clearHash();
    else {
      var id = currentId();
      if (id) setHash(id);
    }
  }
  setInterval(track, 800);
  window.addEventListener("hashchange", openFromHash);
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#modalClose")) setTimeout(clearHash, 50);
  }, true);
  function boot() {
    if (location.hash.indexOf("#v=") === 0) setTimeout(openFromHash, 700);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
