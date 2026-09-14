(function () {
  function swap(a) {
    var emb = a.getAttribute("data-embed");
    if (!emb) return;
    var p = document.querySelector(".player");
    var h = document.querySelector("h1");
    if (h) h.textContent = a.getAttribute("data-title") || "";
    if (p) {
      if (/\.mp4($|\?)/i.test(emb)) {
        p.innerHTML = "<video controls autoplay playsinline src=\"" + emb.replace(/\"/g, "") + "\"></video>";
      } else {
        p.innerHTML = "<iframe src=\"" + emb.replace(/\"/g, "") + "\" allow=\"autoplay;encrypted-media;fullscreen\" allowfullscreen></iframe>";
      }
    }
    var href = a.getAttribute("href");
    if (href) history.replaceState({}, "", href);
  }
  document.querySelectorAll("a.card").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!a.getAttribute("data-embed")) return;
      e.preventDefault();
      swap(a);
    });
  });
})();
