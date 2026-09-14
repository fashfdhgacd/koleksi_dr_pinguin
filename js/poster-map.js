(function () {
  var map = {};
  window.KDP_POSTERS = map;
  window.kdpPoster = function (id) { return map[id] || ""; };

  function idFrom(src) {
    if (!src) return "";
    try {
      var u = new URL(src, location.href);
      return String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov)$/i, "");
    } catch (_) {
      return String(src.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
    }
  }
  function hostOf(src) {
    var s = String(src || "").toLowerCase();
    if (s.indexOf("userbokep") >= 0) return "userbokep";
    if (s.indexOf("indoav") >= 0) return "indoav";
    return "";
  }
  function posterSrc(id, src) {
    var h = hostOf(src);
    if (h && id) return "/api/thumb?h=" + h + "&id=" + encodeURIComponent(id);
    if (id && map[id]) return map[id];
    return "";
  }
  function applyCards(root) {
    if (!root) return;
    root.querySelectorAll(".video-card").forEach(function (card) {
      if (card.getAttribute("data-poster-ok") === "1") return;
      var media = card.querySelector("iframe, video");
      var src = "";
      if (media) src = media.getAttribute("src") || media.getAttribute("data-src") || "";
      src = src || card.getAttribute("data-embed") || "";
      var id = idFrom(src);
      if (!id || /^\d+$/.test(id)) return;
      var url = posterSrc(id, src);
      if (!url) return;
      var img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.className = "absolute inset-0 w-full h-full object-cover bg-black pointer-events-none";
      img.src = url;
      img.onerror = function () {
        if (img.dataset.fb) return;
        img.dataset.fb = "1";
        img.src = "/logo.png";
      };
      if (media && media.parentNode) media.parentNode.replaceChild(img, media);
      else {
        var box = card.querySelector(".relative, .ph, .aspect-video");
        if (box) box.insertBefore(img, box.firstChild);
      }
      card.setAttribute("data-poster-ok", "1");
    });
  }
  function boot() {
    ["videoGrid", "trendingGrid", "searchResults"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      applyCards(el);
      if (window.MutationObserver) new MutationObserver(function () { applyCards(el); }).observe(el, { childList: true, subtree: true });
    });
  }
  Promise.all([
    fetch("/data/posters.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
    fetch("/data/latest-posters.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
  ]).then(function (arr) {
    map = Object.assign({}, arr[0] || {}, arr[1] || {});
    window.KDP_POSTERS = map;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  });
})();
