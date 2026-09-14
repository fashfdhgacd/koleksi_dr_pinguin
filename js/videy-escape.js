(function () {
  document.addEventListener("click", function (e) {
    var card = e.target.closest && e.target.closest("#hubRight .vcard");
    if (!card) return;
    var native = document.getElementById("modalNativeVideo");
    var iframe = document.getElementById("modalIframe");
    if (native) {
      try { native.pause(); } catch (_) {}
      native.removeAttribute("src");
      try { native.load(); } catch (_) {}
      native.style.display = "none";
    }
    if (iframe) iframe.style.display = "";
  }, true);
})();
