const OWNER = "fashfdhgacd";
const REPO = "koleksi-dr-pinguin";
const FILE = "data/latest-posters.json";
async function scrape(host, id) {
  const allow = {
    indoav: "https://tv1.indoav.app/e/",
    userbokep: "https://tv1.userbokep.com/e/"
  };
  const base = allow[String(host || "").toLowerCase()];
  if (!base || !id) return "";
  const r = await fetch(base + id, { headers: { "user-agent": "Mozilla/5.0", accept: "text/html" } });
  if (!r.ok) return "";
  const html = await r.text();
  const m = html.match(/poster="(https:\/\/[^"\s]+)"/i);
  return m ? m[1] : "";
}
async function saveMap(id, url) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || !id || !url) return false;
  const api = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + FILE;
  const cur = await fetch(api, { headers: { Authorization: "Bearer " + token, "User-Agent": "kdp" } });
  const j = await cur.json();
  let map = {};
  if (j.content) {
    try { map = JSON.parse(Buffer.from(j.content, "base64").toString("utf8")); } catch (_) {}
  }
  if (map[id] === url) return true;
  map[id] = url;
  const body = {
    message: "auto-fix poster " + id,
    content: Buffer.from(JSON.stringify(map, null, 2) + "\n").toString("base64"),
    sha: j.sha,
    branch: "main"
  };
  const put = await fetch(api, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token, "User-Agent": "kdp", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return put.ok;
}
module.exports = async function handler(req, res) {
  try {
    const q = req.query || {};
    const id = String(q.id || "").replace(/[^A-Za-z0-9_-]/g, "");
    const host = String(q.h || "").toLowerCase();
    const url = await scrape(host, id);
    if (!url) {
      res.status(404).json({ ok: false });
      return;
    }
    saveMap(id, url).catch(function () {});
    res.writeHead(302, { Location: url, "Cache-Control": "public, max-age=60" });
    res.end();
  } catch (e) {
    res.status(500).json({ ok: false });
  }
};
