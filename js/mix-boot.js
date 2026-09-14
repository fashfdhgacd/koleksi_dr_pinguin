(function () {
  var PER = 12;
  function codeOf(v) {
    var u = String((v && (v.embed || v.direct)) || "");
    var m = u.match(/\/(?:e|v|d)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : "";
  }
  function titleOf(v) {
    var t = String((v && v.title) || "").replace(/[<>]/g, "").replace(/_/g, " ").trim();
    if (!t || /^campur\s+[a-z0-9_-]+$/i.test(t)) return ((v && v.source) || "Mix") + " video";
    return t;
  }
  function embedOf(v) {
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct)) || "");
    if (/streamtape|strcloud/i.test(raw + " " + ((v && v.source) || ""))) return "https://streamtape.com/e/" + id + "/";
    if (/lulu/i.test(raw + " " + ((v && v.source) || ""))) return "https://lulustream.com/e/" + id;
    return raw;
  }
  function posterOf(v) {
    if (v && (v.poster || v.thumb)) return v.poster || v.thumb;
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct)) || "");
    if (/lulu/i.test(raw + " " + ((v && v.source) || ""))) return "https://img.lulustream.com/" + id + ".jpg";
    return "";
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, "");
  }
  function pageNow() {
    var n = parseInt((location.hash.match(/p(\d+)/) || [])[1] || "1", 10);
    return n > 0 ? n : 1;
  }
  function cardHTML(v) {
    var id = codeOf(v);
    var poster = posterOf(v);
    var title = titleOf(v);
    var media = poster
      ? '<img src="' + esc(poster) + '" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover bg-black">'
      : '<div class="absolute inset-0 bg-neutral-900"></div>';
    return (
      '<article class="video-card group cursor-pointer" data-id="' +
      id +
      '">' +
      '<div class="relative aspect-video rounded overflow-hidden bg-black border border-neutral-800">' +
      media +
      '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-medium tracking-wide z-10">' +
      esc(v.source || "Mix") +
      "</span>" +
      '<button type="button" class="card-share absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white text-xs" aria-label="Share">↗</button>' +
      '<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">' +
      '<span class="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold" style="background:#ff9000">▶</span>' +
      "</div></div>" +
      '<div class="mt-2.5 px-0.5"><h3 class="text-sm font-medium leading-snug line-clamp-2">' +
      esc(title) +
      "</h3></div></article>"
    );
  }
  function openModal(v) {
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    var title = document.getElementById("modalTitle");
    var meta = document.getElementById("modalMeta");
    if (!modal || !frame) return;
    if (title) title.textContent = titleOf(v);
    if (meta) meta.textContent = v.source || "Mix";
    frame.src = embedOf(v);
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    window.__kdpCurrent = { id: codeOf(v), title: titleOf(v), embed: embedOf(v), source: v.source || "Mix" };
  }
  function closeModal() {
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    if (frame) frame.src = "";
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function draw(items) {
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (!grid) return;
    var pages = Math.max(1, Math.ceil(items.length / PER) || 1);
    var p = Math.min(pageNow(), pages);
    var slice = items.slice((p - 1) * PER, p * PER);
    if (count) count.textContent = items.length + " video";
    grid.innerHTML = slice.map(cardHTML).join("") || '<p class="text-neutral-500">Belum ada video Mix.</p>';
    if (pager) {
      var html = "";
      if (p > 1) html += '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + (p - 1) + '">Prev</a>';
      for (var i = 1; i <= pages; i++) {
        html += i === p
          ? '<span class="min-w-[40px] h-10 px-3 bg-ph text-black font-black rounded flex items-center justify-center">' + i + "</span>"
          : '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + i + '">' + i + "</a>";
      }
      if (p < pages) html += '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="#p' + (p + 1) + '">Next</a>';
      pager.innerHTML = html;
    }
    grid.querySelectorAll(".video-card").forEach(function (card, idx) {
      var v = slice[idx];
      card.addEventListener("click", function (e) {
        if (e.target.closest(".card-share")) {
          e.stopPropagation();
          var url = "https://koleksidrpinguin.com/v/" + encodeURIComponent(codeOf(v));
          if (navigator.clipboard) navigator.clipboard.writeText(url);
          var sheet = document.getElementById("shareSheet");
          if (sheet) {
            var prev = document.getElementById("shareTitlePreview");
            if (prev) prev.textContent = titleOf(v);
            sheet.classList.remove("hidden");
          }
          return;
        }
        openModal(v);
      });
    });
  }
  fetch("/data/campur.json?t=" + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (items) {
      window._mix = Array.isArray(items) ? items : [];
      draw(window._mix);
    })
    .catch(function () {
      window._mix = [];
      draw([]);
    });
  window.addEventListener("hashchange", function () { draw(window._mix || []); });
  document.addEventListener("click", function (e) {
    if (e.target.id === "modalClose" || e.target.id === "modalBackdrop") closeModal();
    if (e.target.id === "shareClose" || e.target.id === "shareBackdrop") {
      var sheet = document.getElementById("shareSheet");
      if (sheet) sheet.classList.add("hidden");
    }
  });
})();
