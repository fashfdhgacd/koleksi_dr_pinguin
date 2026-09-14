(function () {
  if (window.__kdpHome) return;
  window.__kdpHome = true;
  var PER = 24;
  var list = [];
  var cat = "all";

  function codeOf(v) {
    var u = String((v && (v.embed || v.direct || v.embedUrl)) || "");
    var m = u.match(/[?&]id=([A-Za-z0-9_-]+)/) || u.match(/\/(?:e|v|d)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : String((v && v.id) || "");
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || "").replace("/d/", "/e/");
  }
  function titleOf(v) {
    return String((v && v.title) || "Video")
      .replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "")
      .replace(/koleksidrpinguin\.com/ig, "")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function inferCat(v) {
    var raw = embedOf(v);
    var t = titleOf(v);
    var c = String((v && (v.category || v.folder)) || "").trim();
    if (c && !/^(putarin|campur|mix|pilihan|lainnya)$/i.test(c)) return c;
    if (/hentai/i.test(t + " " + c)) return "Hentai ENG";
    if (/\bai\b|ai\s*\d/i.test(t)) return "AI";
    if (/anime/i.test(t)) return "Anime";
    if (/\b(film|movie)\b|\(20\d\d\)/i.test(t)) return "Film";
    if (/s\d{1,2}\s*e\d{1,3}|episode\s*\d+/i.test(t)) return "Series";
    if (/lulu/i.test(raw)) return "Lulu";
    if (/streamtape|strcloud/i.test(raw)) return "Streamtape";
    if (/putarin|puterin|\bjav\b|[a-z]{2,6}-\d{3}/i.test(raw + " " + t)) return "JAV";
    return c || "Umum";
  }
  function posterOf(v) {
    var id = codeOf(v);
    var raw = embedOf(v);
    if (/indoav/i.test(raw) && id) return "/api/thumb?h=indoav&id=" + encodeURIComponent(id);
    if (/userbokep/i.test(raw) && id) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(id);
    if (/putarin|puterin/i.test(raw) && id) return "/api/poster?id=" + encodeURIComponent(id);
    if (/lulu/i.test(raw) && id) return "/p/" + encodeURIComponent(id) + ".jpg";
    if (/streamtape|strcloud/i.test(raw) && id) return "/api/thumb?h=streamtape&id=" + encodeURIComponent(id);
    return "/api/thumb?h=x&id=" + encodeURIComponent(id);
  }
  function pageNow() {
    var n = parseInt((location.search.match(/[?&]page=(\d+)/) || location.hash.match(/p(\d+)/) || [])[1] || "1", 10);
    return n > 0 ? n : 1;
  }
  function filtered() {
    if (!cat || cat === "all") return list;
    var want = String(cat).toLowerCase().replace(/-/g, " ");
    return list.filter(function (v) {
      var k = inferCat(v).toLowerCase();
      if (want === "jav") return k === "jav" || /putarin|puterin/i.test(embedOf(v));
      return k === want || k.replace(/\s+/g, "-") === String(cat).toLowerCase();
    });
  }
  function cardHTML(v) {
    var id = codeOf(v);
    var t = titleOf(v).replace(/[<>]/g, "");
    var c = inferCat(v);
    var src = posterOf(v);
    return '<a class="video-card block no-underline text-white" href="/v/' + encodeURIComponent(id) + '">' +
      '<div class="relative aspect-video bg-ink-900 rounded overflow-hidden border border-ink-700">' +
      '<img src="' + src + '" alt="' + t.replace(/"/g, "") + ' 18+" width="640" height="360" loading="lazy" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#161616" onerror="this.onerror=null;this.src=\'/logo.png\'">' +
      '<span class="absolute left-2 bottom-2 text-[10px] font-black uppercase bg-black/70 text-ph px-1.5 py-0.5 rounded">' + c + "</span>" +
      "</div>" +
      '<h3 class="mt-2 text-xs sm:text-sm font-bold leading-snug line-clamp-2">' + t + "</h3></a>";
  }
  function draw() {
    var items = filtered();
    var pages = Math.max(1, Math.ceil(items.length / PER));
    var p = Math.min(pageNow(), pages);
    var slice = items.slice((p - 1) * PER, p * PER);
    var grid = document.getElementById("videoGrid");
    var count = document.getElementById("videoCount");
    var pager = document.getElementById("pagination");
    if (count) count.textContent = items.length + " video";
    if (grid) {
      grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4";
      grid.innerHTML = slice.map(cardHTML).join("") || "<p class='text-neutral-400'>Tidak ada video.</p>";
    }
    if (pager) {
      var html = "";
      var qs = cat && cat !== "all" ? ("?cat=" + encodeURIComponent(cat) + "&") : "?";
      if (p > 1) html += '<a class="px-3 py-1 rounded bg-ink-800 text-xs" href="' + qs + "page=" + (p - 1) + '">Prev</a>';
      var a = Math.max(1, p - 2), b = Math.min(pages, p + 2);
      for (var i = a; i <= b; i++) {
        html += '<a class="px-3 py-1 rounded text-xs ' + (i === p ? "bg-ph text-black font-black" : "bg-ink-800") + '" href="' + qs + "page=" + i + '">' + i + "</a>";
      }
      if (p < pages) html += '<a class="px-3 py-1 rounded bg-ink-800 text-xs" href="' + qs + "page=" + (p + 1) + '">Next</a>';
      pager.innerHTML = html;
    }
  }
  function chips() {
    var wrap = document.getElementById("categoryPills");
    if (!wrap) return;
    wrap.className = "flex gap-1.5 overflow-x-auto pb-3 mb-3";
    var counts = {};
    list.forEach(function (v) {
      var k = inferCat(v);
      counts[k] = (counts[k] || 0) + 1;
    });
    var prefer = ["JAV", "Hentai ENG", "Series", "Film", "AI", "Anime", "Lulu", "Streamtape", "Amatir", "Jilbab", "STW", "Viral", "Colmek", "Tobrut", "Live", "Chindo", "Doggy", "Outdoor", "Bule", "Threesome", "Toilet", "Umum"];
    var keys = prefer.filter(function (k) { return counts[k]; });
    Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).forEach(function (k) {
      if (keys.indexOf(k) < 0) keys.push(k);
    });
    function chip(label, slug, on) {
      return '<a class="shrink-0 px-3 py-1 rounded text-[11px] font-black uppercase tracking-wide no-underline ' +
        (on ? "bg-ph text-black" : "bg-ink-800 text-neutral-300") + '" href="' +
        (slug === "all" ? "/" : "/?cat=" + encodeURIComponent(slug)) + '">' + label + "</a>";
    }
    wrap.innerHTML = chip("Semua", "all", cat === "all") + keys.map(function (k) {
      var slug = k.toLowerCase().replace(/\s+/g, "-");
      return chip(k, slug, cat === slug || cat === k.toLowerCase());
    }).join("");
  }
  function hero() {
    var v = (filtered()[0] || list[0]);
    if (!v) return;
    var slides = document.getElementById("heroSlides");
    if (slides) {
      slides.innerHTML = '<a href="/v/' + encodeURIComponent(codeOf(v)) + '" class="absolute inset-0 block">' +
        '<img src="' + posterOf(v) + '" alt="" style="width:100%;height:100%;object-fit:cover;background:#111">' +
        '<span class="absolute inset-0 flex items-center justify-center"><span class="w-14 h-14 rounded-full bg-ph text-black flex items-center justify-center text-xl font-black">▶</span></span></a>';
    }
    var ht = document.getElementById("heroTitle");
    var hm = document.getElementById("heroMeta");
    var hp = document.getElementById("heroPlay");
    if (ht) ht.textContent = titleOf(v);
    if (hm) hm.textContent = inferCat(v) + " · 18+";
    if (hp) {
      hp.onclick = function () { location.href = "/v/" + encodeURIComponent(codeOf(v)); };
    }
    var trend = document.getElementById("trendingGrid");
    if (trend && list.length) {
      trend.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4";
      trend.innerHTML = list.slice(8, 16).map(cardHTML).join("");
    }
  }

  var qs = new URLSearchParams(location.search);
  if (qs.get("cat")) cat = qs.get("cat");
  var hm = location.hash.match(/[?&#]c=([^&]+)/);
  if (hm) cat = decodeURIComponent(hm[1]);

  Promise.all([
    fetch("/data/videos.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/putarin.json").then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch("/data/campur.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (pack) {
    function ok(v) {
      return !!codeOf(v) && !/videy/i.test(embedOf(v));
    }
    list = [].concat(pack[0] || [], pack[1] || [], pack[2] || []).filter(ok);
    window.videoList = list;
    chips();
    hero();
    draw();
  });
})();
