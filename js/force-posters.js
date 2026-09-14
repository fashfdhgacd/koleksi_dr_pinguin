(function () {
  if (window.__forcePoster) return;
  window.__forcePoster = true;
  var PLACEHOLDER =
    "data:image/svg+xml," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="168" r="34" fill="#ff9000"/><polygon points="310,152 342,168 310,184" fill="#111"/></svg>');
  function allowed() {
    return !window.KDP || window.KDP.can("posters", "force-posters");
  }
  function idFrom(src) {
    if (!src) return "";
    try {
      var u = new URL(src, location.href);
      return String(u.searchParams.get("id") || (u.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov|html)$/i, "");
    } catch (_) {
      return String(src.split("/").pop() || "").replace(/\.(mp4|mov|html)$/i, "");
    }
  }
  function hostOf(src) {
    var s = String(src || "").toLowerCase();
    if (s.indexOf("videy") >= 0) return "videy";
    if (s.indexOf("userbokep") >= 0) return "userbokep";
    if (s.indexOf("indoav") >= 0) return "indoav";
    if (s.indexOf("putarin") >= 0 || s.indexOf("puterin") >= 0) return "putarin";
    return "";
  }
  function swap(card) {
    if (!allowed()) return;
    if (card.closest && card.closest("#hubRight")) return;
    var box = card.querySelector(".relative, .ph, .aspect-video") || card;
    var media = card.querySelector("iframe, video");
    var raw = "";
    if (media) raw = media.getAttribute("src") || media.getAttribute("data-src") || "";
    raw = raw || card.getAttribute("data-embed") || card.getAttribute("data-src") || "";
    var h = hostOf(raw);
    if (h === "videy") return;
    if (media && media.tagName === "VIDEO" && /videy/i.test(media.getAttribute("src") || "")) return;
    var id = idFrom(raw);
    if (!id || /^\d+$/.test(id)) return;
    var img = box.querySelector("img.kdp-cover");
    if (!img) {
      img = document.createElement("img");
      img.className = "kdp-cover";
      img.alt = "";
      img.loading = "lazy";
      img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#141414";
      box.appendChild(img);
    }
    if (img.getAttribute("data-ok") === "1") return;
    img.setAttribute("data-ok", "1");
    if (media) media.style.display = "none";
    var tries = [];
    if (h === "putarin") tries.push("/api/poster?id=" + encodeURIComponent(id));
    if (h === "indoav" || h === "userbokep") {
      tries.push("/api/thumb?h=" + h + "&id=" + encodeURIComponent(id));
      tries.push("/api/repair-poster?h=" + h + "&id=" + encodeURIComponent(id));
    }
    if (!tries.length) return;
    tries.push(PLACEHOLDER);
    var i = 0;
    img.onerror = function () {
      if (i < tries.length) img.src = tries[i++];
    };
    img.src = tries[i++];
  }
  function run() {
    if (!allowed()) return;
    document.querySelectorAll("#videoGrid .video-card, #trendingGrid .video-card, #searchResults .video-card, .sg .card").forEach(swap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  setInterval(run, 2500);
})();
