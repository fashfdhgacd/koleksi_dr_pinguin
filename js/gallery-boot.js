(function () {
  var cfg = window.KDP_GALLERY || { file: "/data/campur.json", label: "Mix" };
  var PER = 12;
  var catNow = "all";
  var seriesNow = "";
  var ORDER = ["AI", "Indo", "ABG", "JAV", "Series", "Hentai ENG", "Anime", "Film", "Lulu", "Streamtape", "Lainnya"];
  function isFolderCat(c) { return c === "Series" || c === "Hentai ENG"; }
  function codeOf(v) {
    var u = String((v && (v.embed || v.direct)) || "");
    var m = u.match(/[?&]id=([A-Za-z0-9_-]+)/) || u.match(/\/(?:e|v|d|watch)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : "";
  }
  function titleOf(v) {
    var t = String((v && v.title) || "").replace(/^[\uD83C\uDFAC\s]+/, "").replace(/[<>]/g, "").replace(/_/g, " ").trim();
    if (!t) return (cfg.label || "Video") + " " + codeOf(v);
    return t;
  }
  function embedOf(v) {
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct)) || "");
    if (/streamtape|strcloud/i.test(raw)) return "https://streamtape.com/e/" + id + "/";
    if (/lulu/i.test(raw)) return "https://luluvdo.com/e/" + id;
    if (/putarin|puterin/i.test(raw)) {
      try { return new URL(raw).origin + "/e/" + id; } catch (_) { return raw.replace(/\/v\//, "/e/"); }
    }
    return raw.replace(/\/d\//, "/e/");
  }
  function posterOf(v) {
    var id = codeOf(v);
    var raw = String((v && (v.embed || v.direct || v.source)) || "");
    if (v && (v.poster || v.thumb) && !/img\.lulustream\.com\/[A-Za-z0-9]+\.jpg/.test(String(v.poster || v.thumb || ""))) return v.poster || v.thumb;
    if (/mumu\.watch|m-cdn\.video/i.test(raw) && id) return "https://m-cdn.video/hls/" + id + "/thumbnail.jpg";
    if (/lulu/i.test(raw) && id) return "/p/" + encodeURIComponent(id) + ".jpg";
    return "";
  }
  function isEp(t) {
    return /s\d{1,2}\s*e\d{1,3}|episode\s*\d+|eps\.?\s*\d+/i.test(String(t || ""));
  }
  function seriesName(v) {
    var t = titleOf(v);
    t = t.replace(/s\d{1,2}\s*e\d{1,3}.*$/i, "").replace(/episode\s*\d+.*$/i, "").replace(/\s+[\u2013\-]\s+.*$/, "");
    t = t.replace(/^hentai\s*eng\s*[-:]?\s*/i, "");
    return t.replace(/\s+/g, " ").trim() || "Series";
  }
  function kindOf(v) {
    var raw = String((v && (v.embed || v.direct || v.source || v.category)) || "");
    var t = titleOf(v).toLowerCase();
    var blob = (t + " " + raw + " " + String((v && v.category) || "")).toLowerCase();
    if (/hentai\s*eng|hentai.?eng|\bhentai\b/.test(blob)) return "Hentai ENG";
    if (isEp(titleOf(v))) return "Series";
    if (/\bai\b|ai\s*\d|ai-|stable diffusion/i.test(t)) return "AI";
    if (/\babg\b/.test(t)) return "ABG";
    if (/^indo\b|bokep indo|\bindo\b|janda|mahasiswa|tante|kakak|adik|pelajar/i.test(t)) return "Indo";
    if (/\bjav\b|[a-z]{2,5}-\d{3}|tokyo[- ]?hot|caribbean|1pondo|heyzo|fc2/i.test(blob)) return "JAV";
    if (/anime|doraemon|naruto|one piece|slime|jojo/i.test(t)) return "Anime";
    if (/\(20\d\d\)|film|movie/i.test(t)) return "Film";
    if (/lulu/i.test(raw) && cfg.label === "Mix") return "Lulu";
    if (/streamtape|strcloud/i.test(raw) && cfg.label === "Mix") return "Streamtape";
    return "Lainnya";
  }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, ""); }
  function pageNow() {
    var n = parseInt((location.hash.match(/p(\d+)/) || [])[1] || "1", 10);
    return n > 0 ? n : 1;
  }
  function readHash() {
    var c = (location.hash.match(/[?&#]c=([^&]*)/) || location.hash.match(/c=([^&]+)/) || [])[1];
    var s = (location.hash.match(/s=([^&]+)/) || [])[1];
    catNow = c ? decodeURIComponent(c) : "all";
    seriesNow = s ? decodeURIComponent(s) : "";
  }
  function href(p, cat, ser) {
    var h = "#p" + p;
    if (cat && cat !== "all") h += "&c=" + encodeURIComponent(cat);
    if (ser) h += "&s=" + encodeURIComponent(ser);
    return h;
  }
  function cardHTML(v, badge) {
    var id = codeOf(v);
    var poster = posterOf(v);
    var media = poster
      ? '<img src="' + esc(poster) + '" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover bg-black">'
      : '<div class="absolute inset-0 bg-neutral-900"></div>';
    return '<article class="video-card group cursor-pointer" data-id="' + id + '">' +
      '<div class="relative aspect-video rounded overflow-hidden bg-black border border-neutral-800">' +
      media +
      '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-medium z-10">' + esc(badge || kindOf(v)) + '</span>' +
      '<button type="button" class="card-share absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white text-xs">↗</button>' +
      '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold" style="background:#ff9000">▶</span></div>' +
      '</div><div class="mt-2.5 px-0.5"><h3 class="text-sm font-medium leading-snug line-clamp-2">' + esc(titleOf(v)) + '</h3></div></article>';
  }
  function seriesCard(name, list) {
    var v = list[0] || {};
    var poster = posterOf(v);
    var media = poster
      ? '<img src="' + esc(poster) + '" alt="" loading="lazy" class="absolute inset-0 w-full h-full object-cover bg-black">'
      : '<div class="absolute inset-0 bg-neutral-900"></div>';
    return '<article class="video-card group cursor-pointer" data-series="' + esc(name) + '">' +
      '<div class="relative aspect-video rounded overflow-hidden bg-black border border-neutral-800">' +
      media +
      '<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] font-medium z-10">' + esc(catNow) + '</span>' +
      '<span class="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black" style="background:#ff9000;color:#000">' + list.length + ' eps</span>' +
      '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="w-9 h-9 rounded-full flex items-center justify-center text-black font-bold" style="background:#ff9000">▶</span></div>' +
      '</div><div class="mt-2.5 px-0.5"><h3 class="text-sm font-medium leading-snug line-clamp-2">' + esc(name) + '</h3></div></article>';
  }
  function openModal(v) {
    if (window.kdpPlay) { window.kdpPlay(v); return; }
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    var title = document.getElementById("modalTitle");
    var meta = document.getElementById("modalMeta");
    var ext = document.getElementById("modalOpenExternal");
    if (!modal || !frame) return;
    if (title) title.textContent = titleOf(v);
    if (meta) meta.textContent = kindOf(v);
    if (ext) ext.href = embedOf(v);
    frame.src = "about:blank";
    setTimeout(function () { frame.src = embedOf(v); }, 30);
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    window.__kdpCurrent = { id: codeOf(v), title: titleOf(v), embed: embedOf(v) };
  }
  function closeModal() {
    var modal = document.getElementById("videoModal");
    var frame = document.getElementById("modalIframe");
    if (frame) frame.src = "";
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function ensureNav() {
    if (document.getElementById("kdpTopNav")) return;
    var nav = document.createElement("nav");
    nav.id = "kdpTopNav";
    nav.className = "sticky top-0 z-50 h-12 bg-black flex items-center";
    nav.style.borderBottom = "2px solid #ff9000";
    nav.innerHTML = '<div class="w-full max-w-[1500px] mx-auto px-3 flex items-center justify-between gap-3">' +
      '<a href="/" class="font-black tracking-tight text-white no-underline">DR.<span style="color:#ff9000">PINGUIN</span></a>' +
      '<div class="flex items-center gap-2 text-[11px] font-black uppercase">' +
      '<a href="/" class="px-2 py-1 rounded border border-neutral-700 text-white no-underline">Home</a>' +
      '<a href="/putarin" class="px-2 py-1 rounded border border-neutral-700 text-white no-underline">Putarin</a>' +
      '<a href="/mix" class="px-2 py-1 rounded border border-neutral-700 text-white no-underline">Mix</a>' +
      '</div></div>';
    document.body.insertBefore(nav, document.body.firstChild);
  }
  function groupSeries(items) {
    var map = {};
    items.forEach(function (v) {
      var n = seriesName(v);
      if (!map[n]) map[n] = [];
      map[n].push(v);
    });
    return map;
  }
  function chips(items) {
    var wrap = document.getElementById("categoryPills");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "categoryPills";
      wrap.className = "flex gap-1.5 overflow-x-auto pb-3 mb-3";
      var grid = document.getElementById("videoGrid");
      if (grid && grid.parentNode) grid.parentNode.insertBefore(wrap, grid);
    }
    var counts = { all: items.length };
    items.forEach(function (v) {
      var k = kindOf(v);
      counts[k] = (counts[k] || 0) + 1;
    });
    var keys = ORDER.filter(function (k) { return counts[k]; });
    Object.keys(counts).forEach(function (k) {
      if (k !== "all" && keys.indexOf(k) < 0 && counts[k]) keys.push(k);
    });
    if (keys.length === 1 && keys[0] === cfg.label) keys = [];
    if (cfg.label === "Putarin" && keys.indexOf("Hentai ENG") < 0) keys.splice(Math.min(3, keys.length), 0, "Hentai ENG");
    var html = '<button type="button" data-cat="all" class="chip px-3 py-1 rounded-full text-[11px] font-bold border ' + (catNow === "all" ? "bg-ph text-black border-ph" : "border-neutral-700") + '">Semua</button>';
    keys.forEach(function (k) {
      html += '<button type="button" data-cat="' + esc(k) + '" class="chip px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ' + (catNow === k ? "bg-ph text-black border-ph" : "border-neutral-700") + '">' + esc(k) + '</button>';
    });
    if (isFolderCat(catNow) && seriesNow) {
      html = '<button type="button" data-cat="' + esc(catNow) + '" data-back="1" class="chip px-3 py-1 rounded-full text-[11px] font-bold border border-neutral-700">← ' + esc(catNow) + '</button>' +
        '<span class="chip px-3 py-1 rounded-full text-[11px] font-bold bg-ph text-black">' + esc(seriesNow) + '</span>';
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-cat]").forEach(function (b) {
      b.onclick = function () {
        var c = b.getAttribute("data-cat") || "all";
        location.hash = href(1, c, "");
      };
    });
  }
  function filtered(items) {
    if (!catNow || catNow === "all") return items;
    return items.filter(function (v) { return kindOf(v) === catNow; });
  }
  function draw(all) {
    ensureNav();
    readHash();
    chips(all);
    var items = filtered(all);
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (!grid) return;
    var mode = "videos";
    var groups = {};
    if (isFolderCat(catNow) && !seriesNow) {
      groups = groupSeries(items);
      mode = "series";
    } else if (isFolderCat(catNow) && seriesNow) {
      items = items.filter(function (v) { return seriesName(v) === seriesNow; });
    }
    if (mode === "series") {
      var names = Object.keys(groups).sort(function (a, b) { return groups[b].length - groups[a].length; });
      if (count) count.textContent = names.length + " series";
      grid.innerHTML = names.map(function (n) { return seriesCard(n, groups[n]); }).join("") || '<p class="text-neutral-500">Belum ada series.</p>';
      if (pager) pager.innerHTML = "";
      grid.querySelectorAll("[data-series]").forEach(function (card) {
        card.onclick = function () {
          location.hash = href(1, catNow, card.getAttribute("data-series") || "");
        };
      });
      return;
    }
    var pages = Math.max(1, Math.ceil(items.length / PER) || 1);
    var p = Math.min(pageNow(), pages);
    var slice = items.slice((p - 1) * PER, p * PER);
    if (count) count.textContent = items.length + " video" + (seriesNow ? " · " + seriesNow : "");
    grid.innerHTML = slice.map(function (v) { return cardHTML(v, seriesNow ? "E" : ""); }).join("") || '<p class="text-neutral-500">Tidak ada video.</p>';
    if (pager) {
      function btn(n, label, on) {
        if (on) return '<span class="min-w-[40px] h-10 px-3 bg-ph text-black font-black rounded flex items-center justify-center">' + label + '</span>';
        return '<a class="min-w-[40px] h-10 px-3 border border-neutral-700 rounded flex items-center justify-center" href="' + href(n, catNow, seriesNow) + '">' + label + '</a>';
      }
      var html = "";
      if (p > 1) html += btn(p - 1, "Prev", false);
      var start = Math.max(1, p - 2), end = Math.min(pages, p + 2);
      if (start > 1) html += btn(1, "1", p === 1);
      if (start > 2) html += '<span class="px-1 text-neutral-500">…</span>';
      for (var i = start; i <= end; i++) html += btn(i, String(i), i === p);
      if (end < pages - 1) html += '<span class="px-1 text-neutral-500">…</span>';
      if (end < pages) html += btn(pages, String(pages), p === pages);
      if (p < pages) html += btn(p + 1, "Next", false);
      pager.innerHTML = html;
    }
    grid.querySelectorAll(".video-card").forEach(function (card, idx) {
      var v = slice[idx];
      card.addEventListener("click", function (e) {
        if (e.target.closest(".card-share")) {
          e.stopPropagation();
          var prev = document.getElementById("shareTitlePreview");
          if (prev) prev.textContent = titleOf(v);
          var sheet = document.getElementById("shareSheet");
          if (sheet) sheet.classList.remove("hidden");
          window.__kdpCurrent = { id: codeOf(v), title: titleOf(v), embed: embedOf(v) };
          return;
        }
        openModal(v);
      });
    });
  }
  fetch(cfg.file + (cfg.file.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (items) { window._gallery = Array.isArray(items) ? items : []; draw(window._gallery); })
    .catch(function () { window._gallery = []; draw([]); });
  window.addEventListener("hashchange", function () { draw(window._gallery || []); });
  document.addEventListener("click", function (e) {
    if (e.target.id === "modalClose" || e.target.id === "modalBackdrop") closeModal();
    if (e.target.id === "shareClose" || e.target.id === "shareBackdrop") {
      var sheet = document.getElementById("shareSheet");
      if (sheet) sheet.classList.add("hidden");
    }
    if (e.target.id === "modalShare") {
      var sheet = document.getElementById("shareSheet");
      var prev = document.getElementById("shareTitlePreview");
      if (prev && window.__kdpCurrent) prev.textContent = window.__kdpCurrent.title || "";
      if (sheet) sheet.classList.remove("hidden");
    }
  });
})();
