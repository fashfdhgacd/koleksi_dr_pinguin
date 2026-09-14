window.kdpPickRelated = function (lists, current, n) {
  n = n || 8;
  function clean(s) {
    return String(s || '').replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, '').replace(/koleksidrpinguin\.com/ig, '').replace(/\s+/g, ' ').trim();
  }
  function series(s) {
    var t = clean(s).toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\b(s\d{1,2}\s*e\d{1,3}|episode\s*\d+|eps?\.?\s*\d+|part\s*\d+|20\d{2})\b/g, ' ')
      .replace(/\b[a-z]{2,6}-?\d{2,5}\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    var words = t.split(' ').filter(Boolean);
    if (words.length >= 3) return words.slice(0, 4).join(' ');
    return t || clean(s).toLowerCase().slice(0, 24);
  }
  function idOf(v) {
    var u = String((v && (v.embed || v.direct || v.embedUrl)) || '');
    try {
      var url = new URL(u, 'https://x');
      return (url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || '').replace(/\.(mp4|mov)$/i, '');
    } catch (e) {
      return u.split('/').pop() || '';
    }
  }
  function posterOf(v) {
    return String((v && (v.poster || v.thumb || v.thumbnail)) || '');
  }
  var seenId = {};
  var seenSeries = {};
  var seenPoster = {};
  var seenTitle = {};
  var curId = String((current && current.id) || '').toLowerCase();
  var curSeries = series((current && current.title) || '');
  if (curId) seenId[curId] = 1;
  if (curSeries) seenSeries[curSeries] = 1;
  try {
    var recent = JSON.parse(sessionStorage.getItem('kdp_rel_recent') || '[]');
    recent.slice(-30).forEach(function (id) { if (id) seenId[String(id).toLowerCase()] = 1; });
  } catch (e) {}
  var pool = [];
  (lists || []).forEach(function (list) {
    (list || []).forEach(function (v) { pool.push(v); });
  });
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  var out = [];
  for (var k = 0; k < pool.length && out.length < n; k++) {
    var v = pool[k];
    var title = clean(v && v.title);
    var id = idOf(v).toLowerCase();
    var sk = series(title);
    var poster = posterOf(v);
    var tkey = title.toLowerCase();
    if (!title || !id || seenId[id] || seenTitle[tkey] || (sk && seenSeries[sk]) || (poster && seenPoster[poster])) continue;
    seenId[id] = 1;
    seenTitle[tkey] = 1;
    if (sk) seenSeries[sk] = 1;
    if (poster) seenPoster[poster] = 1;
    out.push(v);
  }
  try {
    var ids = out.map(idOf);
    var prev = JSON.parse(sessionStorage.getItem('kdp_rel_recent') || '[]');
    sessionStorage.setItem('kdp_rel_recent', JSON.stringify(prev.concat(ids).slice(-40)));
  } catch (e) {}
  return out;
};
