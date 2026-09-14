const TITLE_RE = /\b(abg|siswa|siswi|sma|smk|\bsd\b|\bsmp\b|underage|sekolah|bocil|pelajar|anak\s+sekolah|seragam\s+sekolah)\b/i;
const ANAK_RE = /\banak\b/i;
const ADULT_ANAK_OK = /\banak\s+(istri|buah|kandung|tiri)\b/i;
const BAD_CAT = /^(abg)$/i;
const FILE_EXT = /\.(mp4|mov|mkv|avi|wmv|webm)$/i;

function blobOf(v) {
  return [
    v && v.title,
    v && v.category,
    v && v.folder,
    Array.isArray(v && v.tags) ? v.tags.join(" ") : ""
  ].join(" ");
}

function isUnsafe(v) {
  const cat = String((v && (v.category || v.folder)) || "").trim();
  if (BAD_CAT.test(cat)) return true;
  const blob = blobOf(v);
  if (TITLE_RE.test(blob)) return true;
  if (ANAK_RE.test(blob) && !ADULT_ANAK_OK.test(blob)) return true;
  return false;
}

function rawOf(v) {
  return String((v && (v.embed || v.direct || v.embedUrl)) || "");
}

function keyOf(v) {
  const u = rawOf(v) || String((v && v.id) || "");
  try {
    const url = new URL(u, "https://koleksidrpinguin.com");
    return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(FILE_EXT, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(FILE_EXT, "");
  }
}

function cleanTitle(s) {
  let t = String(s || "Video")
    .replace(/\(Koleksi[^)]*Pinguin[^)]*\)/ig, "")
    .replace(/koleksidrpinguin\.com/ig, "")
    .replace(/koleksi\s+dr\.?\s*pinguin[^)\]]*/ig, "")
    .replace(FILE_EXT, "")
    .replace(/\b(campur xxx|xxx+|m\.?s\.?b\.?)\b/ig, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!t) return "Video";
  t = t.replace(/\b([A-Za-zÀ-ÿ][^\s]*)/g, function (word) {
    const low = word.toLowerCase();
    if (/^(di|ke|dari|yang|dan|atau|sama|dengan|untuk|pada|ini|itu|yg|the|of|a|an)$/i.test(low)) return low;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function hostOf(v) {
  const u = rawOf(v);
  if (/indoav/i.test(u)) return "indoav";
  if (/userbokep/i.test(u)) return "userbokep";
  if (/putarin|puterin/i.test(u)) return "putarin";
  if (/lulu/i.test(u)) return "lulu";
  if (/streamtape|strcloud/i.test(u)) return "streamtape";
  if (/mumu|m-cdn\.video/i.test(u)) return "mumu";
  return "embed";
}

function hostLabel(v) {
  const h = typeof v === "string" ? v : hostOf(v);
  const map = {
    indoav: "IndoAV",
    userbokep: "UserBokep",
    putarin: "Putarin",
    lulu: "Lulu",
    streamtape: "Streamtape",
    mumu: "Mumu",
    embed: "Embed"
  };
  return map[h] || "Embed";
}

function isDeadPoster(u) {
  return !u || /logo\.png$|embedan\.com|cdnhlsplayer\.lat|placehold|1x1|data:image\/gif/i.test(String(u));
}

function posterOf(v, posters) {
  const id = keyOf(v);
  const host = hostOf(v);
  if (host === "indoav" && id) return "/api/thumb?h=indoav&id=" + encodeURIComponent(id);
  if (host === "userbokep" && id) return "/api/thumb?h=userbokep&id=" + encodeURIComponent(id);
  if (host === "putarin" && id) return "/api/poster?id=" + encodeURIComponent(id);
  const ready = v && (v.poster || v.thumb || v.thumbnail);
  if (!isDeadPoster(ready)) return ready;
  if (posters && !isDeadPoster(posters[id])) return posters[id];
  if (host === "lulu" && id) return "/p/" + encodeURIComponent(id) + ".jpg";
  if (host === "streamtape" && id) return "/api/thumb?h=streamtape&id=" + encodeURIComponent(id);
  if (host === "mumu" && id) return "https://m-cdn.video/hls/" + id + "/thumbnail.jpg";
  if (id) return "/api/thumb?h=x&id=" + encodeURIComponent(id);
  return "/og-card.svg";
}

function qualityOf(v) {
  const t = String((v && (v.title || v.quality)) || "");
  if (/\b(4k|2160p)\b/i.test(t)) return "4K";
  if (/\b(1080p|1080)\b/i.test(t)) return "1080p";
  if (/\b(720p|720)\b/i.test(t)) return "720p";
  if (/\b(480p|480)\b/i.test(t)) return "480p";
  return "";
}

function durationOf(v) {
  const d = v && (v.duration || v.length || v.dur);
  if (!d) return "";
  if (typeof d === "number" && d > 0) {
    const m = Math.floor(d / 60);
    const s = Math.floor(d % 60);
    return m + ":" + String(s).padStart(2, "0");
  }
  const str = String(d);
  if (/^0?0:00$/.test(str) || str === "0") return "";
  return str;
}

function slugCat(s) {
  return String(s || "umum").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "umum";
}

function categoryOf(v) {
  const c = String((v && (v.category || v.folder)) || "Umum").trim() || "Umum";
  if (BAD_CAT.test(c)) return "Umum";
  return c;
}

function embedOf(v) {
  return rawOf(v).replace("/d/", "/e/");
}

function seriesKey(s) {
  return cleanTitle(s)
    .toLowerCase()
    .replace(/s\d{1,2}\s*e\d{1,3}/ig, " ")
    .replace(/episode\s*\d+/ig, " ")
    .replace(/part\s*\d+/ig, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
  });
}

function isoDuration(v) {
  const d = durationOf(v);
  if (!d) return "";
  const m = String(d).match(/^(\d+):(\d{2})$/);
  if (!m) return "";
  return "PT" + Number(m[1]) + "M" + Number(m[2]) + "S";
}

const MAIN_CATS = [
  "Amatir", "Jilbab", "STW", "Viral", "Colmek", "Tobrut",
  "Live", "Chindo", "Doggy", "Outdoor", "Bule", "Threesome",
  "Perselingkuhan", "Toilet", "Umum"
];

module.exports = {
  TITLE_RE,
  isUnsafe,
  rawOf,
  keyOf,
  cleanTitle,
  hostOf,
  hostLabel,
  posterOf,
  qualityOf,
  durationOf,
  slugCat,
  categoryOf,
  embedOf,
  seriesKey,
  esc,
  isoDuration,
  MAIN_CATS
};
