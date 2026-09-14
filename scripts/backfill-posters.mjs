import { readFileSync, writeFileSync } from "node:fs";

const BATCH = Math.max(1, parseInt(process.env.POSTER_BATCH || "200", 10));
const CONCUR = Math.max(1, parseInt(process.env.POSTER_CONCUR || "4", 10));
const UA = "Mozilla/5.0 (compatible; DrPinguinPoster/1.0)";

function keyOf(v) {
  const u = String((v && (v.embed || v.direct || "")) || "");
  try {
    const url = new URL(u);
    return String(url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop() || "").replace(/\.(mp4|mov)$/i, "");
  } catch {
    return String(u.split("/").pop() || "").replace(/\.(mp4|mov)$/i, "");
  }
}

function loadJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function posterFrom(embed) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(embed, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: ctrl.signal
    });
    if (!r.ok) return "";
    const html = await r.text();
    const m = html.match(/poster="(https:\/\/[^"\s]+)\"/i);
    return m ? m[1] : "";
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

const videos = loadJson("data/videos.json", []);
const posters = loadJson("data/posters.json", {});
const queue = [];
for (const v of videos) {
  const raw = String(v.embed || v.direct || "");
  if (!/indoav|userbokep/i.test(raw)) continue;
  const id = keyOf(v);
  if (!id || posters[id]) continue;
  queue.push({ id, embed: raw.replace("/d/", "/e/") });
}

const take = queue.slice(0, BATCH);
console.log("missing", queue.length, "batch", take.length);

let i = 0;
async function worker() {
  while (i < take.length) {
    const item = take[i++];
    const url = await posterFrom(item.embed);
    if (url) {
      posters[item.id] = url;
      console.log("ok", item.id);
    } else {
      console.log("skip", item.id);
    }
  }
}

await Promise.all(Array.from({ length: Math.min(CONCUR, take.length) }, () => worker()));
writeFileSync("data/posters.json", JSON.stringify(posters, null, 2) + "\n");
console.log("saved", Object.keys(posters).length);
