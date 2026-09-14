(function () {
  function clean() {
    document.querySelectorAll("a").forEach(function (a) {
      var href = String(a.getAttribute("href") || "");
      var t = String(a.textContent || "").replace(/\s+/g, " ").trim();
      if (href === "/mumu" || /AI China/i.test(t)) {
        a.remove();
        return;
      }
      if (href === "/putarin" || href === "/putarin/") {
        a.setAttribute("href", "/?cat=jav");
        a.textContent = "JAV";
        return;
      }
      if (href === "/campur" || href === "/campur/" || href === "/mix" || href === "/mix/" || /Pilihan Dr|Harimau/i.test(t)) {
        a.remove();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", clean);
  else clean();
  setTimeout(clean, 200);
})();
