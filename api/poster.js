const fs = require("fs");
const path = require("path");

const PLACEHOLDER = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#141414"/><circle cx="320" cy="180" r="36" fill="#ff9000"/><polygon points="310,164 342,180 310,196" fill="#111"/></svg>'
);

function dead(u) {
  return !u || /embedan\.com|cdnhlsplayer\.lat|logo\.png$/i.test(String(u));
}

function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.id || "")) || "");
  try {
    const url = new URL(u);
    return String(url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "").replace(/\.(mp4|mov)$/i, "");
  } catch (_) {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}

function readList(name) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8"));
    return Array.isArray(d) ? d : [];
  } catch (_) {
    return [];
  }
}

function findVideo(id) {
  const needle = String(id || "").toLowerCase();
  const lists = ["putarin.json", "videos.json", "campur.json"];
  for (const name of lists) {
    const hit = readList(name).find(function (v) { return keyOf(v).toLowerCase() === needle; });
    if (hit) return hit;
  }
  return null;
}

function javCovers(title) {
  const m = String(title || "").toUpperCase().match(/\b([A-Z]{2,7})-?(\d{3,4})\b/);
  if (!m) return [];
  const maker = m[1].toLowerCase();
  const n3 = m[2].padStart(3, "0");
  const n5 = m[2].padStart(5, "0");
  const keys = [maker + n5, "1" + maker + n5, maker + n3, "h_" + maker + n5];
  const out = [];
  keys.forEach(function (k) {
    out.push("https://pics.dmm.co.jp/digital/video/" + k + "/" + k + "pl.jpg");
    out.push("https://pics.dmm.co.jp/digital/video/" + k + "/" + k + "ps.jpg");
  });
  return out;
}

async function scrapeImages(id) {
  const pages = [
    "https://puterin.biz/v/" + id,
    "https://putarin.xyz/e/" + id,
    "https://panel.putarin.com/e/" + id
  ];
  const found = [];
  for (const url of pages) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow" });
      if (!r.ok) continue;
      const html = await r.text();
      const pats = [
        /property=["']og:image["']\s+content=["']([^"']+)["']/i,
        /content=["']([^"']+)["']\s+property=["']og:image["']/i,
        /poster=["'](https:\/\/[^"']+)["']/i
      ];
      pats.forEach(function (p) {
        const m = html.match(p);
        if (m && m[1] && !dead(m[1])) found.push(m[1]);
      });
    } catch (_) {}
  }
  return found;
}

async function sendImage(res, url) {
  if (dead(url)) return false;
  const ctrl = new AbortController();
  const t = setTimeout(function () { ctrl.abort(); }, 6000);
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0", accept: "image/*" },
      redirect: "follow",
      signal: ctrl.signal
    });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return false;
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!/^image\//i.test(ct) && !/jpeg|jpg|png|webp|gif/i.test(ct)) return false;
    res.setHeader("Content-Type", ct.split(";")[0]);
    res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=2592000");
    res.status(200).end(buf);
    return true;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(t);
  }
}

module.exports = async function handler(req, res) {
  try {
    const id = String((req.query && req.query.id) || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (id) {
      const video = findVideo(id);
      const title = video && video.title ? video.title : "";
      const localPoster = video && (video.poster || video.thumb || video.thumbnail);
      const candidates = []
        .concat(javCovers(title))
        .concat(dead(localPoster) ? [] : [localPoster])
        .concat(await scrapeImages(id));
      for (let i = 0; i < candidates.length; i++) {
        if (await sendImage(res, candidates[i])) return;
      }
    }
  } catch (_) {}
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).end(PLACEHOLDER);
};
