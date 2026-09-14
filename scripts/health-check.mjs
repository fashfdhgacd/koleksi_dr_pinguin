const BASE = process.env.SITE_URL || "https://koleksidrpinguin.com";

async function get(path, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(BASE + path, { signal: ctrl.signal, redirect: "follow" });
    const text = await r.text();
    return { path, status: r.status, type: r.headers.get("content-type") || "", text };
  } finally {
    clearTimeout(t);
  }
}

const checks = [];
function ok(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log((pass ? "OK   " : "FAIL ") + name + " — " + detail);
}

const home = await get("/");
ok("beranda", home.status === 200 && /videoGrid|ageGate|Dr\.\s*Pinguin/i.test(home.text), home.status + " " + home.text.length + "b");

const app = await get("/js/app.js");
ok("app.js", app.status === 200 && app.text.includes("jsdelivr"), app.status + " " + app.text.length + "b");

const modal = await get("/js/modal-share.js");
ok("modal-share.js", modal.status === 200 && modal.text.includes("hubGrid"), modal.status + " " + modal.text.length + "b");

const videos = await get("/data/videos.json");
let vCount = 0;
try {
  const d = JSON.parse(videos.text);
  vCount = Array.isArray(d) ? d.length : 0;
} catch (_) {}
ok("videos.json", videos.status === 200 && vCount > 100, videos.status + " items=" + vCount);

const posters = await get("/data/posters.json");
let pCount = 0;
let pOk = false;
try {
  const d = JSON.parse(posters.text);
  pOk = d && typeof d === "object" && !Array.isArray(d) && d !== "see-file";
  pCount = pOk ? Object.keys(d).length : 0;
} catch (_) {}
ok("posters.json", posters.status === 200 && pOk && pCount >= 6, posters.status + " covers=" + pCount);

const watch = await get("/v/yeOw4gk3f8gw");
ok("halaman /v/", watch.status === 200 && /player|iframe|video/i.test(watch.text), String(watch.status));

const failed = checks.filter((c) => !c.pass);
console.log("result", checks.length - failed.length + "/" + checks.length);
if (failed.length) process.exit(1);
