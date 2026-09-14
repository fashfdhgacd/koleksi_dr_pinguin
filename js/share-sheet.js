(function () {
  if (window.__kdpShare) return;
  window.__kdpShare = true;

  function ensure() {
    var box = document.getElementById("shareSheet");
    if (box) return box;
    box = document.createElement("div");
    box.id = "shareSheet";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<div id="shareBackdrop" class="kdp-share-bg"></div>' +
      '<div class="kdp-share-card">' +
      '<div class="kdp-share-hd"><h4>Share this video</h4><button type="button" id="shareClose">\u00d7</button></div>' +
      '<p id="shareTitlePreview"></p>' +
      '<div class="kdp-share-grid">' +
      '<button type="button" class="share-app" data-app="facebook">Facebook</button>' +
      '<button type="button" class="share-app" data-app="whatsapp">WhatsApp</button>' +
      '<button type="button" class="share-app" data-app="twitter">Twitter</button>' +
      '<button type="button" class="share-app" data-app="reddit">Reddit</button>' +
      '<button type="button" class="share-app" data-app="telegram">Telegram</button>' +
      '<button type="button" class="share-app" data-app="gmail">Gmail</button>' +
      '</div>' +
      '<button type="button" id="shareCopy">Salin link</button>' +
      '</div>';
    document.body.appendChild(box);
    if (!document.getElementById("kdpShareCss")) {
      var css = document.createElement("style");
      css.id = "kdpShareCss";
      css.textContent =
        "#shareSheet{display:none;position:fixed;inset:0;z-index:140}" +
        "#shareSheet.on{display:block}" +
        ".kdp-share-bg{position:absolute;inset:0;background:#000c}" +
        ".kdp-share-card{position:relative;z-index:1;width:min(380px,92%);margin:15vh auto 0;background:#1c1c1e;border:1px solid #333;border-radius:18px;padding:16px;color:#fff;font-family:system-ui,sans-serif}" +
        ".kdp-share-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}" +
        ".kdp-share-hd h4{margin:0;font-size:15px}" +
        "#shareClose{width:32px;height:32px;border:0;border-radius:99px;background:#2a2a2c;color:#fff;font-size:20px}" +
        "#shareTitlePreview{margin:0 0 12px;font-size:12px;color:#9a9aa0;line-height:1.4}" +
        ".kdp-share-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}" +
        ".share-app{height:42px;border-radius:12px;border:1px solid #3a3a3c;background:#2c2c2e;color:#eee;font-size:11px;font-weight:700}" +
        "#shareCopy{margin-top:12px;width:100%;height:44px;border:0;border-radius:12px;background:#3a3a3c;color:#fff;font-weight:700}";
      document.head.appendChild(css);
    }
    return box;
  }

  function currentTitle() {
    var n = document.getElementById("shareTitlePreview");
    var t =
      ((document.getElementById("hubTitle") || {}).textContent) ||
      ((document.getElementById("modalTitle") || {}).textContent) ||
      ((document.querySelector("h1") || {}).textContent) ||
      document.title;
    return String(t || "Video").trim();
  }

  function shareUrl() {
    return location.href.split("#")[0];
  }

  function openSheet() {
    var box = ensure();
    var p = document.getElementById("shareTitlePreview");
    if (p) p.textContent = currentTitle();
    box.classList.add("on");
    box.classList.remove("hidden");
    box.setAttribute("aria-hidden", "false");
  }

  function closeSheet() {
    var box = document.getElementById("shareSheet");
    if (!box) return;
    box.classList.remove("on");
    box.classList.add("hidden");
    box.setAttribute("aria-hidden", "true");
  }

  function hrefFor(app, url, title) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);
    if (app === "facebook") return "https://www.facebook.com/sharer/sharer.php?u=" + u;
    if (app === "whatsapp") return "https://api.whatsapp.com/send?text=" + t + "%20" + u;
    if (app === "twitter") return "https://twitter.com/intent/tweet?text=" + t + "&url=" + u;
    if (app === "reddit") return "https://www.reddit.com/submit?url=" + u + "&title=" + t;
    if (app === "telegram") return "https://t.me/share/url?url=" + u + "&text=" + t;
    if (app === "gmail") return "https://mail.google.com/mail/?view=cm&fs=1&su=" + t + "&body=" + u;
    return "";
  }

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target && e.target.closest ? e.target.closest("#hubShare,#btnShare,#modalShare,#modalShareMobile,button.pri") : null;
      if (t && (t.id === "hubShare" || t.id === "btnShare" || t.id === "modalShare" || t.id === "modalShareMobile" || (t.id === "" && t.textContent && /bagikan/i.test(t.textContent)))) {
        e.preventDefault();
        e.stopPropagation();
        openSheet();
        return;
      }
      if (e.target && e.target.id === "shareClose") {
        closeSheet();
        return;
      }
      if (e.target && (e.target.id === "shareBackdrop" || (e.target.classList && e.target.classList.contains("kdp-share-bg")))) {
        closeSheet();
        return;
      }
      if (e.target && e.target.id === "shareCopy") {
        var url = shareUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url);
        e.target.textContent = "Tersalin";
        setTimeout(function () { e.target.textContent = "Salin link"; }, 1200);
        return;
      }
      var appBtn = e.target && e.target.closest ? e.target.closest(".share-app") : null;
      if (appBtn) {
        var app = appBtn.getAttribute("data-app");
        var go = hrefFor(app, shareUrl(), currentTitle());
        if (go) window.open(go, "_blank", "noopener");
      }
    },
    true
  );

  window.openShareSheet = openSheet;
})();
