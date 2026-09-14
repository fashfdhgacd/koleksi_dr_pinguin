const hookPoster = require("./poster-hook");
function pickEnv(keys) {
  for (const key of keys) {
    const val = process.env[key];
    if (val && String(val).trim()) return String(val).trim();
  }
  return "";
}
function getEnv() {
  return {
    BOT_TOKEN: pickEnv(["BOT_TOKEN", "BOT_TOKENN", "TELEGRAM_BOT_TOKEN"]),
    GH_TOKEN: pickEnv(["GH_TOKEN", "GH_TOKENN", "GITHUB_TOKEN"]),
    GH_OWNER: pickEnv(["GH_OWNER", "GH_OWNERR", "GITHUB_OWNER"]) || "fashfdhgacd",
    GH_REPO: pickEnv(["GH_REPO", "GH_REPOO", "GITHUB_REPO"]) || "koleksi-dr-pinguin",
    GH_PATH: pickEnv(["GH_PATH", "GH_PATHH"]) || "data/videos.json",
    GH_BRANCH: pickEnv(["GH_BRANCH", "GH_BRANCHH"]) || "main",
    TELEGRAM_USER_ID: pickEnv(["TELEGRAM_USER_ID", "TELEGRAM_ADMIN_ID"]) || "7747474006",
    PUBLIC_HOST: pickEnv(["PUBLIC_HOST"]) || "https://koleksidrpinguin.com"
  };
}
const CATS = [
  { key: "all", label: "Semua" },
  { key: "amatir", label: "Amatir" },
  { key: "videy", label: "Videy" },
  { key: "lulu", label: "Lulu" },
  { key: "putarin", label: "Putarin" },
  { key: "jilbab", label: "Jilbab" },
  { key: "abg", label: "ABG" },
  { key: "stw", label: "STW" },
  { key: "viral", label: "Viral" },
  { key: "ai", label: "AI" }
];
const MENU_KEYBOARD = {
  keyboard: [[{ text: "Minta 10" }, { text: "Minta 25" }], [{ text: "Semua" }, { text: "Amatir" }, { text: "Videy" }], [{ text: "Lulu" }, { text: "Putarin" }, { text: "Lagi" }], [{ text: "Jilbab" }, { text: "ABG" }, { text: "AI" }], [{ text: "Menu" }]],
  resize_keyboard: true,
  persistent: true
};
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const env = getEnv();
  if (req.method === "GET") return res.status(200).json({ ok: true, service: "telegram-webhook", ready: Boolean(env.BOT_TOKEN), hasBot: Boolean(env.BOT_TOKEN), hasGh: Boolean(env.GH_TOKEN) });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const update = typeof req.body === "string" ? (function(){try{return JSON.parse(req.body)}catch(e){return {}}}()) : (req.body || {});
  try { await handleUpdate(update, env); return res.status(200).json({ ok: true }); }
  catch (e) { return res.status(200).json({ ok: true, error: String(e.message || e) }); }
};
function isBlockedHost(u) { return /vicek\.id|exastream|mumu\.watch|mumustream/i.test(String(u || "")); }
function isAllowedHost(u) {
  return /videy\.co|indoav\.|userbokep\.com|putarin\.(com|biz|xyz)|puterin\.(com|biz|xyz)|luluvdo\.com|lulustream\.com|luluvid\.com|lulu\.st|streamtape\.com|strcloud/i.test(String(u || ""));
}
function parseShareCount(text, fallback) {
  const m = String(text || "").toLowerCase().match(/\b(5|10|15|20|25|30)\b/);
  return m ? Math.min(30, parseInt(m[1], 10)) : (fallback || 25);
}
function parseShareCat(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("puterin") || t.includes("putarin")) return "putarin";
  if (t.includes("lulu") || t.includes("streamtape") || t.includes("tape")) return "lulu";
  for (const c of CATS) {
    if (c.key === "all") continue;
    if (t === c.key || t === c.label.toLowerCase() || t.includes(c.label.toLowerCase())) return c.key;
  }
  return t.includes("semua") ? "all" : "";
}
function matchCat(v, key) {
  if (!key || key === "all") return true;
  const cat = String(v.category || "").toLowerCase();
  const blob = [v.category, v.source, v.title, (v.tags || []).join(" "), v.embed, v.direct].join(" ").toLowerCase();
  if (key === "putarin") return /putarin|puterin/.test(blob);
  if (key === "lulu") return /lulu|streamtape/.test(blob);
  if (key === "videy") return /videy/.test(blob);
  if (cat === key) return true;
  if (key === "jilbab") return /jilbab|hijab/.test(blob);
  if (key === "abg") return /\babg\b/.test(blob);
  if (key === "stw") return /\bstw\b/.test(blob);
  if (key === "viral") return /viral/.test(blob);
  if (key === "ai") return /\bai\b/.test(blob);
  if (key === "amatir") return cat === "amatir";
  return false;
}
async function handleUpdate(update, env) {
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;
  const text = String(msg.text).trim();
  const chatId = msg.chat.id;
  if (!env.BOT_TOKEN) return;
  const allowed = String(env.TELEGRAM_USER_ID || "").trim();
  const fromId = String((msg.from && msg.from.id) || "");
  if (allowed && fromId && fromId !== allowed && String(chatId) !== allowed) { await reply(env, chatId, "Akses ditolak."); return; }
  const t = text.toLowerCase();
  if (t.startsWith("/start") || t === "menu" || t.startsWith("/menu") || t === "help") {
    await reply(env, chatId, "Minta 10/25 lalu pilih kategori.", MENU_KEYBOARD); return;
  }
  if (isShareCommand(t)) {
    const cat = parseShareCat(text);
    const n = parseShareCount(text, 0);
    const onlyCount = /^(minta|sebar)?\s*(10|25)$/i.test(text.replace(/^\//,"").trim());
    if (onlyCount && !cat) { await reply(env, chatId, "Siap " + (n || 25) + " link. Pilih kategori.", MENU_KEYBOARD); return; }
    await handleShare(env, chatId, { count: n || 0, cat: cat || "" }); return;
  }
  const items = (await parseNamedLinks(text)).filter(function (it) { return !isBlockedHost(it.embed) && !isBlockedHost(it.direct); });
  if (!items.length) { await reply(env, chatId, "Kirim link Lulu / Streamtape / IndoAV.", MENU_KEYBOARD); return; }
  if (!env.GH_TOKEN) { await reply(env, chatId, "Upload butuh GH_TOKEN."); return; }
  try {
    const groups = groupUploads(items);
    const lines = ["Selesai.", "Link diterima: " + items.length];
    for (const g of groups) {
      const r = await mergeAndPush(env, env.GH_REPO, g.path, g.items);
      lines.push(g.path + ": +" + r.added + " skip " + r.skipped);
    }
    try { lines.push("poster +" + await hookPoster(env, items)); } catch (pe) { lines.push("poster: " + String(pe.message || pe)); }
    await reply(env, chatId, lines.join("\n"), MENU_KEYBOARD);
  } catch (e) { await reply(env, chatId, "Gagal simpan: " + String(e.message || e)); }
}
function groupUploads(items) {
  const buckets = { videos: [], putarin: [], campur: [] };
  for (const it of items) {
    const u = String(it.embed || it.direct || "");
    if (/putarin\.|puterin\./i.test(u)) buckets.putarin.push(it);
    else if (/luluvdo|lulustream|luluvid|lulu\.st|streamtape|strcloud/i.test(u)) buckets.campur.push(it);
    else buckets.videos.push(it);
  }
  const out = [];
  if (buckets.videos.length) out.push({ path: "data/videos.json", items: buckets.videos });
  if (buckets.putarin.length) out.push({ path: "data/putarin.json", items: buckets.putarin });
  if (buckets.campur.length) out.push({ path: "data/campur.json", items: buckets.campur });
  return out;
}
function isShareCommand(text) {
  const t = String(text || "").trim().toLowerCase();
  if (/https?:\/\//i.test(t) && !/^\s*\/?(minta|sebar)/.test(t)) return false;
  if (/^\/?(sebar|share|link|minta)/.test(t)) return true;
  if (t === "minta 10" || t === "minta 25" || t === "lagi" || t === "gas" || t === "puterin") return true;
  return CATS.some(function (c) { return t === c.label.toLowerCase() || t === c.key; });
}
function shareKeyFromVideo(v) {
  const u = String(v.embed || v.direct || "");
  try {
    const url = new URL(u);
    return String(url.searchParams.get("id") || (url.pathname.split("/").filter(Boolean).pop() || "")).replace(/\.(mp4|mov|html)$/i, "");
  } catch (_) { return u.slice(-12); }
}
function cleanTitle(t) { return String(t || "Video").replace(/_/g, " ").replace(/\s+/g, " ").trim(); }
async function readJsonList(url) {
  try {
    const rr = await fetch(url, { headers: { "User-Agent": "dr-pinguin-tg-bot" } });
    if (!rr.ok) return [];
    const d = await rr.json();
    return Array.isArray(d) ? d : [];
  } catch (_) { return []; }
}
async function readVideos(env, cat) {
  const base = "https://raw.githubusercontent.com/" + env.GH_OWNER + "/" + env.GH_REPO + "/" + (env.GH_BRANCH || "main") + "/";
  const t = Date.now();
  if (cat === "putarin") return readJsonList(base + "data/putarin.json?t=" + t);
  if (cat === "lulu") return readJsonList(base + "data/campur.json?t=" + t);
  if (cat === "all" || !cat) {
    const lists = await Promise.all([readJsonList(base + "data/videos.json?t=" + t), readJsonList(base + "data/putarin.json?t=" + t), readJsonList(base + "data/campur.json?t=" + t)]);
    return lists[0].concat(lists[1], lists[2]);
  }
  return readJsonList(base + "data/videos.json?t=" + t);
}
async function handleShare(env, chatId, opt) {
  opt = opt || {};
  let n = Math.max(1, Math.min(30, opt.count || 25));
  let cat = opt.cat || "all";
  const videos = await readVideos(env, cat);
  const pool = [];
  for (const v of videos) {
    if (/vicek|exastream|mumu\.watch/i.test(String(v.embed || v.direct || ""))) continue;
    if (!matchCat(v, cat)) continue;
    const key = shareKeyFromVideo(v);
    if (key) pool.push({ key: key, title: cleanTitle(v.title) });
  }
  const catLabel = (CATS.find(function (c) { return c.key === cat; }) || { label: cat }).label;
  if (!pool.length) { await reply(env, chatId, "Kategori " + catLabel + " kosong.", MENU_KEYBOARD); return; }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
  const take = pool.slice(0, n);
  const host = String(env.PUBLIC_HOST || "https://koleksidrpinguin.com").replace(/\/$/, "");
  const lines = take.map(function (x) { return "\u25b6 " + x.title + "\n" + host + "/v/" + x.key; });
  await reply(env, chatId, lines.join("\n\n"), MENU_KEYBOARD);
}
function isFolderLine(t) { return /^[\uD83D\uDCC1\uD83D\uDCC2]/.test(String(t || "").trim()) || /\bhentai\s*eng\b/i.test(String(t || "")); }
async function expandPutarinFolder(url) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "dr-pinguin-tg-bot", accept: "text/html" } });
    if (!r.ok) return [];
    const html = await r.text();
    const ids = [];
    const re = /\/v\/([A-Za-z0-9_-]+)/g;
    let m;
    while ((m = re.exec(html))) {
      if (ids.indexOf(m[1]) < 0) ids.push(m[1]);
    }
    return ids;
  } catch (_) { return []; }
}
async function parseNamedLinks(text) {
  const lines = String(text).split(/\r?\n/); const items = []; let pending = "";
  for (const rawLine of lines) {
    const line = rawLine.trim(); if (!line) continue;
    const m = line.match(/https?:\/\/[^\s<>"']+/i);
    if (m) {
      const url = m[0].replace(/[).,]+$/, "");
      if (/koleksidrpinguin\./i.test(url) || isBlockedHost(url) || !isAllowedHost(url)) continue;
      const folder = /put[ae]rin\.[a-z]+\/f\//i.test(url);
      const hentai = isFolderLine(pending) || /hentai/i.test(pending);
      if (folder) {
        let host = "https://puterin.biz";
        try { host = new URL(url).origin; } catch (_) {}
        const ids = await expandPutarinFolder(url);
        const base = cleanTitle(String(pending || "").replace(/^[\uD83D\uDCC1\uD83D\uDCC2\s]+/, ""));
        if (ids.length) {
          ids.forEach(function (id, i) {
            const ep = "S01E" + String(i + 1).padStart(2, "0");
            const title = (hentai ? "Hentai ENG " : "") + base + " " + ep;
            items.push({ title: title, direct: host + "/v/" + id, embed: host + "/e/" + id, source: "Putarin", category: hentai ? "Hentai ENG" : "Putarin", tags: [hentai ? "hentai" : "putarin", "telegram"], date: new Date().toISOString().slice(0, 10) });
          });
          pending = "";
          continue;
        }
      }
      const it = toItem(url);
      if (pending) it.title = cleanTitle(pending.replace(/^[\uD83D\uDCC1\uD83D\uDCC2\s]+/, ""));
      if (hentai && it.title && !/hentai/i.test(it.title)) it.title = "Hentai ENG " + it.title;
      if (hentai) it.category = "Hentai ENG";
      items.push(it); pending = "";
    } else if (!line.startsWith("/")) pending = line;
  }
  return items;
}
function toItem(url) {
  const low = url.toLowerCase(); let category = "Amatir"; let source = "Telegram"; let direct = url; let embed = url; let id = "";
  if (low.includes("videy.co")) {
    category = "Videy"; source = "Videy";
    const mm = url.match(/[?&]id=([A-Za-z0-9]+)/);
    id = (mm && mm[1]) || "";
    const ext = (id.length === 9 && id.endsWith("2")) ? ".mov" : ".mp4";
    direct = id ? ("https://cdn.videy.co/" + id + ext) : url;
    embed = id ? ("https://videy.co/v/?id=" + id) : url;
  } else if (/putarin\.|puterin\./i.test(low)) {
    category = "Putarin"; source = "Putarin";
    try { const host = new URL(url).origin; id = (url.match(/\/(?:e|v|watch|f)\/([A-Za-z0-9_-]+)/i) || [])[1] || ""; embed = host + "/e/" + id; direct = host + "/v/" + id; } catch (_) {}
  } else if (/luluvdo|lulustream|luluvid|lulu\.st/i.test(low)) {
    category = "Campur"; source = "Lulustream";
    id = ((url.match(/\/(?:e|v|d)\/([A-Za-z0-9]+)/i) || [])[1]) || String(url.split("/").pop() || "").replace(/\.html$/i, "");
    embed = "https://luluvdo.com/e/" + id;
    direct = embed;
  } else if (/streamtape|strcloud/i.test(low)) {
    category = "Campur"; source = "Streamtape";
    id = ((url.match(/\/(?:e|v)\/([A-Za-z0-9]+)/i) || [])[1]) || url.split("/").pop();
    embed = "https://streamtape.com/e/" + id;
    direct = embed;
  } else {
    source = low.includes("userbokep") ? "Userbokep" : "IndoAV";
    embed = url.replace(/\/d\//, "/e/"); direct = embed;
  }
  return { title: id ? (category + " " + id) : category, direct: direct, embed: embed, source: source, category: category, tags: [category.toLowerCase(), "telegram"], date: new Date().toISOString().slice(0, 10) };
}
function videoKey(v) {
  const u = (v.direct || v.embed || "").toLowerCase();
  if (u.includes("id=")) return u.split("id=")[1].split("&")[0];
  return u.split("/").pop().replace(/\.(mp4|mov|html)$/, "");
}
async function loadJsonFile(env, repo, path) {
  const rawUrl = "https://raw.githubusercontent.com/" + env.GH_OWNER + "/" + repo + "/" + (env.GH_BRANCH || "main") + "/" + path + "?t=" + Date.now();
  const rr = await fetch(rawUrl, { headers: { "User-Agent": "dr-pinguin-tg-bot" } });
  if (!rr.ok) {
    if (rr.status === 404) return [];
    throw new Error("gagal baca " + path);
  }
  const data = await rr.json();
  return Array.isArray(data) ? data : [];
}
async function putFileViaGit(env, repo, path, text, message) {
  const owner = env.GH_OWNER;
  const branch = env.GH_BRANCH || "main";
  const ref = await gh(env, "/repos/" + owner + "/" + repo + "/git/ref/heads/" + branch);
  const commitSha = ref.object.sha;
  const commit = await gh(env, "/repos/" + owner + "/" + repo + "/git/commits/" + commitSha);
  const blob = await gh(env, "/repos/" + owner + "/" + repo + "/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content: Buffer.from(text, "utf8").toString("base64"), encoding: "base64" })
  });
  const tree = await gh(env, "/repos/" + owner + "/" + repo + "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: commit.tree.sha, tree: [{ path: path, mode: "100644", type: "blob", sha: blob.sha }] })
  });
  const next = await gh(env, "/repos/" + owner + "/" + repo + "/git/commits", {
    method: "POST",
    body: JSON.stringify({ message: message, tree: tree.sha, parents: [commitSha] })
  });
  await gh(env, "/repos/" + owner + "/" + repo + "/git/refs/heads/" + branch, {
    method: "PATCH",
    body: JSON.stringify({ sha: next.sha })
  });
}
async function mergeAndPush(env, repo, path, items) {
  const videos = await loadJsonFile(env, repo, path);
  if (path === "data/videos.json" && videos.length < 100) throw new Error("videos.json cuma " + videos.length + " item. Abort.");
  const exist = new Set(videos.map(videoKey));
  let added = 0, skipped = 0;
  const fresh = [];
  for (const it of items) {
    const k = videoKey(it);
    if (exist.has(k)) { skipped += 1; continue; }
    exist.add(k); fresh.push(it); added += 1;
  }
  for (let i = fresh.length - 1; i >= 0; i--) videos.unshift(fresh[i]);
  if (!added) return { added: added, skipped: skipped };
  const compact = path === "data/videos.json";
  const text = compact ? JSON.stringify(videos) : (JSON.stringify(videos, null, 2) + "\n");
  await putFileViaGit(env, repo, path, text, "bot: add " + added + " to " + path);
  return { added: added, skipped: skipped };
}
async function gh(env, path, opt) {
  opt = opt || {};
  const res = await fetch("https://api.github.com" + path, {
    method: opt.method || "GET",
    headers: { Authorization: "Bearer " + env.GH_TOKEN, Accept: "application/vnd.github.v3+json", "User-Agent": "dr-pinguin-tg-bot", "Content-Type": "application/json" },
    body: opt.body
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || String(res.status));
  return data;
}
async function reply(env, chatId, text, keyboard) {
  if (!env.BOT_TOKEN) return;
  const payload = { chat_id: chatId, text: text };
  if (keyboard) payload.reply_markup = keyboard;
  await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
