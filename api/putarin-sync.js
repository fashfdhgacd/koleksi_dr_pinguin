function classify(title) {
  const t = String(title || "").toLowerCase();
  if (/ai\s*-?\s*koleksidrpinguin|koleksidrpinguin\.com|^ai-|ai-/.test(t)) return "AI";
  if (/\bjav\b|jepang|japan|tokyo[- ]?hot|caribbean|1pondo|heyzo|s-cute|prestige|start-\d|meyd-|ssis-|pred-|mide-|ipx-|ipzz-|fc2|uncensored/.test(t)) return "JAV";
  if (/anime|doraemon|gintama|naruto|one piece|demon slayer|jujutsu|bleach|conan|pokemon/.test(t)) return "Anime";
  if (/\b(season|episode|eps?\.?|series)\b/.test(t)) return "Series";
  if (/musik|music|\bmv\b|concert|lagu|song/.test(t)) return "Musik";
  if (/gaming|gameplay|\bgame\b|mobile legends/.test(t)) return "Gaming";
  if (/edukasi|tutorial|belajar|course/.test(t)) return "Edukasi";
  if (/\(20\d\d\)|film|movie/.test(t)) return "Film";
  return "Lainnya";
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = String(process.env.PUTARIN_API_KEY || "").trim();
  const token = String(process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  const owner = process.env.GH_OWNER || "fashfdhgacd";
  const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
  if (!key) return res.status(200).json({ ok: false, needKey: true, hint: "Vercel env PUTARIN_API_KEY + Redeploy" });
  if (!token) return res.status(200).json({ ok: false, error: "GH_TOKEN kosong" });
  try {
    const all = [];
    let page = 1;
    for (;;) {
      const rr = await fetch("https://panel.putarin.com/api/dev/videos?page=" + page, { headers: { "X-API-Key": key } });
      const data = await rr.json();
      const list = data.videos || [];
      if (!list.length) break;
      all.push.apply(all, list);
      const total = data.total || all.length;
      if (all.length >= total || page > 80) break;
      page += 1;
    }
    const mapped = [];
    const seen = new Set();
    for (const v of all) {
      const code = String(v.code || "");
      if (!code || seen.has(code)) continue;
      seen.add(code);
      const title = String(v.title || ("Putarin " + code));
      mapped.push({
        title: title,
        category: "Putarin",
        folder: classify(title),
        source: "Putarin",
        embed: "https://panel.putarin.com/e/" + code,
        direct: "https://panel.putarin.com/v/" + code,
        poster: v.poster || "",
        tags: ["putarin", classify(title).toLowerCase()],
        date: String(v.created_at || "").slice(0, 10)
      });
    }
    const metaRes = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/data/putarin.json?ref=main", {
      headers: { Authorization: "token " + token, "User-Agent": "dr-pinguin-sync", Accept: "application/vnd.github.v3+json" }
    });
    const meta = await metaRes.json();
    let current = [];
    try {
      if (meta.download_url) current = await fetch(meta.download_url).then(function (r) { return r.json(); });
    } catch (_) {}
    const have = new Set(current.map(function (v) { return String(v.embed || "").split("/").pop(); }));
    let added = 0;
    for (let i = mapped.length - 1; i >= 0; i--) {
      const code = String(mapped[i].embed).split("/").pop();
      if (have.has(code)) continue;
      have.add(code);
      current.unshift(mapped[i]);
      added += 1;
    }
    if (added) {
      const body = {
        message: "sync: +" + added + " putarin",
        content: Buffer.from(JSON.stringify(current, null, 2), "utf8").toString("base64"),
        branch: "main"
      };
      if (meta.sha) body.sha = meta.sha;
      const put = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/contents/data/putarin.json", {
        method: "PUT",
        headers: { Authorization: "token " + token, "User-Agent": "dr-pinguin-sync", Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); });
      if (put.message && !put.content) return res.status(200).json({ ok: false, error: put.message, fetched: all.length });
    }
    return res.status(200).json({ ok: true, fetched: all.length, added: added, total: current.length });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
