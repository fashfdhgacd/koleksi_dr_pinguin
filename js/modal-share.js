(function () {
  if (window.__modalShare) return;
  window.__modalShare = true;
  var mixList = [], vidList = [], putList = [];
  var loaded = false;
  var switching = false;
  var recLock = [];
  var fromRec = false;
  function blocked(v) {
    var raw = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    if (/videy|mumu\.watch|mumustream/i.test(raw)) return true;
    if (/putarin|puterin/i.test(raw)) {
      var folder = String((v && v.folder) || (v && v.category) || '').toLowerCase();
      var title = String((v && v.title) || '');
      if (folder === 'series' || /s\d{1,2}\s*e\d{1,3}/i.test(title) || /episode\s*\d+/i.test(title)) return true;
    }
    return false;
  }
  function loadLists(cb) {
    if (loaded) { if (cb) cb(); return; }
    loaded = true;
    Promise.all([
      fetch('/data/videos.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
      fetch('/data/putarin.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
      fetch('/data/campur.json').then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (arr) {
      vidList = (arr[0] || []).filter(function (v) { return !blocked(v); });
      putList = (arr[1] || []).filter(function (v) { return !blocked(v); });
      mixList = (arr[2] || []).filter(function (v) { return !blocked(v); });
      if (cb) cb();
    });
  }
  if (!document.getElementById('hubModalCss')) {
    var css = document.createElement('style');
    css.id = 'hubModalCss';
    css.textContent = [
      '#videoModal{background:#0b0d12!important}',
      '#videoModal:not(.hidden){display:block!important;overflow-y:auto!important}',
      '#modalBackdrop{background:#0b0d12!important;opacity:1!important}',
      '#videoModal .player-shell{display:block!important;width:min(1180px,100%)!important;margin:0 auto!important;height:auto!important;min-height:100dvh!important;max-height:none!important;padding:0 12px 36px!important;background:transparent!important;overflow:visible!important}',
      '#videoModal .player-topbar{position:sticky!important;top:0!important;z-index:5!important;height:52px!important;margin:0 -12px 14px!important;padding:0 12px!important;background:#0b0d12!important;border-bottom:1px solid #232838!important}',
      '#hubGrid{display:grid;grid-template-columns:1fr;gap:16px}',
      '@media(min-width:960px){#hubGrid{grid-template-columns:minmax(0,1fr) 300px;gap:20px}}',
      '#videoModal .player-stage{display:block!important;padding:0!important;height:auto!important;background:transparent!important}',
      '#videoModal .player-frame{position:relative!important;width:100%!important;aspect-ratio:16/9!important;height:auto!important;margin:0!important;border-radius:12px!important;border:1px solid #232838!important;overflow:hidden!important;background:#000!important}',
      '#videoModal .player-iframe,#modalIframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important}',
      '#hubLoad{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#000;color:#ff9000;font-size:13px;font-weight:800;z-index:2}',
      '#hubLoad.on{display:flex}',
      '#hubTitle{margin:12px 0 8px;font-size:20px;font-weight:800}',
      '#hubMeta{display:flex;flex-wrap:wrap;gap:6px}',
      '#hubMeta span{height:26px;padding:0 10px;border-radius:999px;background:#1a1f2c;font-size:11px;font-weight:700;display:inline-flex;align-items:center}',
      '#hubActs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}',
      '#hubActs a,#hubActs button{height:36px;padding:0 14px;border-radius:10px;border:1px solid #232838;background:#ff9000;color:#111;font-weight:800;display:inline-flex;align-items:center;text-decoration:none}',
      '#hubActs a.ghost,#hubActs button.ghost{background:#1a1f2c;color:#fff}',
      '#hubRight h2{margin:0 0 10px;font-size:14px;font-weight:800}',
      '#hubRight .vgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '#hubRight .vcard{display:block;background:0;border:0;padding:0;color:#fff;text-align:left;cursor:pointer;width:100%}',
      '#hubRight .vph{position:relative;aspect-ratio:16/9;background:linear-gradient(180deg,#2a1a0a,#111);border-radius:10px;overflow:hidden}',
      '#hubRight .vph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;pointer-events:none}',
      '#hubRight .vcard span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:6px;font-size:12px}',
      '#modalShare{display:none!important}'
    ].join('');
    document.head.appendChild(css);
  }
  function cleanTitle(s) {
    return String(s || 'Video').replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '').replace(/koleksidrpinguin\.com/ig, '').replace(/\s+/g, ' ').trim();
  }
  function seriesKey(s) {
    return cleanTitle(s).replace(/s\d{1,2}\s*e\d{1,3}/ig, '').replace(/episode\s*\d+/ig, '').replace(/part\s*\d+/ig, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function keyFromEmbed(u) {
    if (!u || u === 'about:blank') return '';
    try {
      var url = new URL(u, location.origin);
      return String(url.searchParams.get('id') || (url.pathname.split('/').filter(Boolean).pop() || '')).replace(/\.(mp4|mov)$/i, '');
    } catch (e) { return ''; }
  }
  function embedOf(v) {
    return String((v && (v.embed || v.direct || v.embedUrl)) || '').replace('/d/', '/e/');
  }
  function currentId() {
    var cur = window.__kdpCurrent || {};
    if (cur.id) return String(cur.id);
    var iframe = document.getElementById('modalIframe');
    return keyFromEmbed(iframe && iframe.src);
  }
  function previewHtml(v) {
    var raw = embedOf(v);
    var id = keyFromEmbed(raw);
    var mapped = (window.KDP_POSTERS && id && window.KDP_POSTERS[id]) || '';
    var src = mapped || String((v && (v.poster || v.thumb)) || '');
    if (/mumu\.watch|m-cdn\.video/i.test(raw) && id) src = 'https://m-cdn.video/hls/' + id + '/thumbnail.jpg';
    if (src) return '<img src="' + src.replace(/"/g, '') + '" alt="" loading="lazy">';
    return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ff9000;font-size:18px;font-weight:900">▶</div>';
  }
  function showLoad(on) {
    var el = document.getElementById('hubLoad');
    if (el) el.className = on ? 'on' : '';
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pickBucket(list, currentTitle, used, n) {
    var cur = seriesKey(currentTitle);
    var curId = currentId();
    var pool = shuffle(list || []);
    var out = [];
    for (var i = 0; i < pool.length && out.length < n; i++) {
      var v = pool[i];
      if (blocked(v)) continue;
      var id = keyFromEmbed(embedOf(v));
      if (curId && id && id === curId) continue;
      var title = cleanTitle(v.title);
      var sk = seriesKey(title);
      if (!title || (cur && sk === cur) || (sk && used[sk])) continue;
      if (sk) used[sk] = 1;
      out.push(v);
    }
    return out;
  }
  function nextVideos() {
    var cur = currentId();
    if (recLock.length >= 8) {
      return recLock.filter(function (v) { return keyFromEmbed(embedOf(v)) !== cur; }).slice(0, 8);
    }
    var title = cleanTitle(((document.getElementById('hubTitle') || document.getElementById('modalTitle') || {}).textContent || '').trim());
    var used = {};
    var items = shuffle(pickBucket(vidList, title, used, 4).concat(pickBucket(putList, title, used, 4), pickBucket(mixList, title, used, 4))).slice(0, 12);
    if (items.length) recLock = items;
    return items.filter(function (v) { return keyFromEmbed(embedOf(v)) !== cur; }).slice(0, 8);
  }
  function playVideo(v) {
    fromRec = true;
    if (!v || blocked(v) || switching) return;
    switching = true;
    showLoad(true);
    if (window.kdpPlay) window.kdpPlay(v);
    else {
      var iframe = document.getElementById('modalIframe');
      if (iframe) {
        iframe.src = 'about:blank';
        setTimeout(function () { iframe.src = embedOf(v); }, 30);
      }
    }
    setTimeout(function () { showLoad(false); switching = false; draw(); }, 350);
  }
  function ensureLayout() {
    var shell = document.querySelector('#videoModal .player-shell');
    var stage = shell && shell.querySelector('.player-stage');
    var frame = stage && stage.querySelector('.player-frame');
    if (!shell || !stage || !frame) return null;
    if (!document.getElementById('hubLoad')) {
      var load = document.createElement('div');
      load.id = 'hubLoad';
      load.textContent = 'Memuat...';
      frame.appendChild(load);
    }
    var grid = document.getElementById('hubGrid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'hubGrid';
      var left = document.createElement('div');
      left.id = 'hubLeft';
      var right = document.createElement('div');
      right.id = 'hubRight';
      stage.parentNode.insertBefore(grid, stage);
      grid.appendChild(left);
      grid.appendChild(right);
      left.appendChild(stage);
      var title = document.createElement('h1');
      title.id = 'hubTitle';
      var meta = document.createElement('div');
      meta.id = 'hubMeta';
      var acts = document.createElement('div');
      acts.id = 'hubActs';
      left.appendChild(title);
      left.appendChild(meta);
      left.appendChild(acts);
    }
    return grid;
  }
  function draw() {
    if (!ensureLayout()) return;
    var title = cleanTitle(((document.getElementById('modalTitle') || {}).textContent || '').trim());
    var cat = ((document.getElementById('modalMeta') || {}).textContent || '').trim() || 'Video';
    var ht = document.getElementById('hubTitle');
    var hm = document.getElementById('hubMeta');
    var ha = document.getElementById('hubActs');
    var hr = document.getElementById('hubRight');
    var cur = window.__kdpCurrent || {};
    var src = cur.embed || ((document.getElementById('modalOpenExternal') || {}).href) || '#';
    if (ht) ht.textContent = title;
    if (hm) hm.innerHTML = '<span>' + cat + '</span><span>18+</span>';
    if (ha) {
      ha.innerHTML = '<button type="button" class="pri" id="hubShare">Bagikan</button>' +
        '<a class="ghost" id="hubSource" href="' + String(src).replace(/"/g, '') + '" target="_blank" rel="noopener">Putar di sumber</a>';
      var b = document.getElementById('hubShare');
      if (b) b.onclick = function () {
        var sheet = document.getElementById('shareSheet');
        if (sheet) { sheet.classList.remove('hidden'); sheet.setAttribute('aria-hidden', 'false'); }
      };
    }
    var items = nextVideos();
    if (hr) {
      hr.innerHTML = '<h2>Rekomendasi</h2><div class="vgrid">' +
        items.map(function (v, i) {
          return '<button type="button" class="vcard" data-i="' + i + '"><div class="vph">' + previewHtml(v) + '</div><span>' + cleanTitle(v.title) + '</span></button>';
        }).join('') + '</div>';
      hr.querySelectorAll('.vcard').forEach(function (btn) {
        btn.onclick = function () { playVideo(items[parseInt(btn.getAttribute('data-i'), 10)]); };
      });
    }
  }
  window.__kdpDrawRecs = draw;
  function hook() {
    var modal = document.getElementById('videoModal');
    if (!modal || modal.__hubObs) return;
    modal.__hubObs = true;
    new MutationObserver(function () {
      if (modal.classList.contains('hidden')) { fromRec = false; return; }
      loadLists(function () {
        if (!fromRec) recLock = [];
        setTimeout(draw, 40);
      });
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
  document.addEventListener('click', function (e) {
    if (e.target.closest('.vcard')) { fromRec = true; return; }
    if (e.target.closest('.video-card, #videoGrid article, #trendingGrid article, #heroPlay')) {
      fromRec = false;
      recLock = [];
    }
  }, true);
})();
