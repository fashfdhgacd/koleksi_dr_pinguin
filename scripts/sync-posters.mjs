#!/usr/bin/env node
/**
 * Sync poster otomatis untuk semua video.
 *
 * Sumber poster (urutan prioritas):
 * 1. Putarin API  /api/dev/video/{code}  → field poster
 * 2. DMM cover    (kalau judul punya kode JAV)
 * 3. Scrape og:image / poster= dari halaman embed
 *
 * Usage:
 *   PUTARIN_API_KEY=sk_xxx node scripts/sync-posters.mjs
 *   POSTER_BATCH=100 POSTER_CONCUR=6 node scripts/sync-posters.mjs
 *
 * Env:
 *   PUTARIN_API_KEY  — wajib kalau mau ambil poster Putarin
 *   POSTER_BATCH     — max item yang diproses per run (default 150)
 *   POSTER_CONCUR    — concurrent workers (default 5)
 *   POSTER_FORCE     — 1 = overwrite poster yang sudah ada
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BATCH = Math.max(1, parseInt(process.env.POSTER_BATCH || "150", 10));
const CONCUR = Math.max(1, parseInt(process.env.POSTER_CONCUR || "5", 10));
const FORCE = process.env.POSTER_FORCE === "1";
const API_KEY =
  process.env.PUTARIN_API_KEY ||
  process.env.PUTARIN_KEY ||
  process.env.LULU_KEY ||
  "";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function loadJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function keyOf(v) {
  const u = String((v && (v.embed || v.direct || v.id || "")) || "");
  try {
    const url = new URL(u);
    return String(
      url.searchParams.get("id") ||
        url.pathname.split("/").filter(Boolean).pop() ||
        ""
    ).replace(/\.(mp4|mov|html)$/i, "");
  } catch {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov|html)$/i, "");
  }
}

/** Deteksi JAV/Hentai — aturan lengkap */
function isJav(title = "") {
  const t = String(title || "").trim();
  if (!t) return false;
  const u = t.toUpperCase();

  if (/\b([A-Z]{2,8})[-_]?\d{2,5}\b/.test(u)) return true;
  if (
    /\b(FC2|HEYZO|CARIB|CARIBBEAN|1PONDO|PACO|TOKYO.?HOT|KIN8|GACHI|AVOP|MUGEN|HEYDOUGA|PRESTIGE|SOD|MOODYZ|IDEA.?POCKET|E-BODY|FITCH|OPPAI|WANZ|ATTACKERS|S1\b|FALENO|MADONNA)\b/.test(
      u
    )
  )
    return true;
  if (/\b(JAV|HENTAI|UNCENSORED|CENSORED|AV JEPANG|JEPANG AV|JAPAN AV)\b/.test(u))
    return true;
  if (
    /\b(EPS?|EPISODE)\s*\d{1,3}\b/i.test(t) &&
    /[a-z].*[a-z]/i.test(t) &&
    !/\b(bokep|indo|hijab|jilbab|tante|viral)\b/i.test(t)
  )
    return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (
    words.length >= 4 &&
    !/\b(bokep|indo|hijab|jilbab|tante|janda|viral|live|abg|sma|colmek|doggy|gangbang|istri|suami|kosan|hotel)\b/i.test(
      t
    ) &&
    /\b(wa|no|ni|to|ga|wo|de|desu|chan|kun|san|sama|sensei|onee|imouto|ane|otoko|onna|ecchi)\b/i.test(
      t
    )
  )
    return true;
  return false;
}

function javDmmCovers(title) {
  const m = String(title || "")
    .toUpperCase()
    .match(/\b([A-Z]{2,8})[-_]?(\d{2,5})\b/);
  if (!m) return [];
  const maker = m[1].toLowerCase();
  const n3 = m[2].padStart(3, "0");
  const n5 = m[2].padStart(5, "0");
  const keys = [maker + n5, "1" + maker + n5, maker + n3, "h_" + maker + n5];
  const out = [];
  for (const k of keys) {
    out.push(`https://pics.dmm.co.jp/digital/video/${k}/${k}pl.jpg`);
    out.push(`https://pics.dmm.co.jp/digital/video/${k}/${k}ps.jpg`);
  }
  return out;
}

async function fetchOk(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || 10000);
  try {
    const r = await fetch(url, {
      ...opts,
      headers: { "User-Agent": UA, ...(opts.headers || {}) },
      signal: ctrl.signal,
      redirect: "follow",
    });
    return r;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function headImageOk(url) {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (/embedan\.com|cdnhlsplayer|logo\.png$/i.test(url)) return false;
  const r = await fetchOk(url, {
    method: "HEAD",
    timeout: 6000,
    headers: { Accept: "image/*" },
  });
  if (!r || !r.ok) return false;
  const ct = r.headers.get("content-type") || "";
  if (ct && !/^image\//i.test(ct) && !/octet-stream/i.test(ct)) return false;
  return true;
}

/** Putarin API → poster field */
async function posterFromPutarinApi(code) {
  if (!API_KEY || !code) return "";
  const r = await fetchOk(
    `https://panel.putarin.com/api/dev/video/${encodeURIComponent(code)}`,
    {
      timeout: 10000,
      headers: { "X-API-Key": API_KEY, Accept: "application/json" },
    }
  );
  if (!r || !r.ok) return "";
  try {
    const d = await r.json();
    const p = d?.video?.poster || d?.poster || "";
    if (p && (await headImageOk(p))) return p;
  } catch {}
  return "";
}

/** Scrape og:image / poster= dari halaman embed */
async function posterFromScrape(embed) {
  if (!embed) return "";
  const r = await fetchOk(embed, {
    timeout: 12000,
    headers: { Accept: "text/html" },
  });
  if (!r || !r.ok) return "";
  try {
    const html = await r.text();
    const pats = [
      /property=["']og:image["']\s+content=["'](https?:\/\/[^"']+)["']/i,
      /content=["'](https?:\/\/[^"']+)["']\s+property=["']og:image["']/i,
      /poster=["'](https?:\/\/[^"'\s]+)["']/i,
      /"thumbnailUrl"\s*:\s*"(https?:\/\/[^"\s]+)"/i,
      /"poster"\s*:\s*"(https?:\/\/[^"\s]+)"/i,
    ];
    for (const p of pats) {
      const m = html.match(p);
      if (m && m[1] && (await headImageOk(m[1]))) return m[1];
    }
  } catch {}
  return "";
}

/** Coba semua kandidat DMM */
async function posterFromDmm(title) {
  for (const url of javDmmCovers(title)) {
    if (await headImageOk(url)) return url;
  }
  return "";
}

async function resolvePoster(item) {
  const { id, title, embed, source } = item;

  // 1. Putarin API
  if (/putarin|puterin/i.test(String(source) + String(embed))) {
    const p = await posterFromPutarinApi(id);
    if (p) return { url: p, via: "putarin-api" };
  }

  // 2. DMM (JAV code)
  if (isJav(title)) {
    const p = await posterFromDmm(title);
    if (p) return { url: p, via: "dmm" };
  }

  // 3. Scrape halaman
  const scraped = await posterFromScrape(embed);
  if (scraped) return { url: scraped, via: "scrape" };

  return { url: "", via: "" };
}

// ─── main ───────────────────────────────────────────────
const lists = [
  ...loadJson("data/videos.json", []),
  ...loadJson("data/putarin.json", []),
  ...loadJson("data/campur.json", []),
];

const posters = loadJson("data/posters.json", {});
if (typeof posters !== "object" || Array.isArray(posters)) {
  console.error("data/posters.json harus object { id: url }");
  process.exit(1);
}

let javCount = 0;
const queue = [];
const seen = new Set();

for (const v of lists) {
  const id = keyOf(v);
  if (!id || seen.has(id)) continue;
  seen.add(id);

  const title = String(v.title || "");
  if (isJav(title)) javCount++;

  if (!FORCE && posters[id]) continue;

  const embed = String(v.embed || v.direct || "");
  if (!embed) continue;

  queue.push({
    id,
    title,
    embed: embed.replace(/\/d\//, "/e/"),
    source: String(v.source || ""),
  });
}

const take = queue.slice(0, BATCH);
console.log(`Need posters: ${queue.length}`);
if (!API_KEY) {
  console.log("(PUTARIN_API_KEY kosong — skip Putarin API)");
}

let ok = 0;
let fail = 0;
let idx = 0;

async function worker() {
  while (idx < take.length) {
    const i = idx++;
    const item = take[i];
    try {
      const res = await resolvePoster(item);
      if (res.url) {
        posters[item.id] = res.url;
        ok++;
        console.log(`OK  ${item.id}  via=${res.via}`);
      } else {
        fail++;
        console.log(`FAIL ${item.id}`);
      }
    } catch (e) {
      fail++;
      console.log(`FAIL ${item.id}  ${e.message || e}`);
    }
  }
}

await Promise.all(
  Array.from({ length: Math.min(CONCUR, Math.max(1, take.length)) }, () =>
    worker()
  )
);

writeFileSync("data/posters.json", JSON.stringify(posters, null, 2) + "\n");

console.log(
  `Done ok= ${ok} fail= ${fail} posters= ${Object.keys(posters).length} jav= ${javCount}`
);
