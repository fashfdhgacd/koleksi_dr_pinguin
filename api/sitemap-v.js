const fs = require("fs");
const path = require("path");
const kdp = require("../lib/kdp");

function readLocal(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8"));
  } catch (_) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "koleksidrpinguin.com").split(",")[0];
    const origin = "https://" + host.replace(/^www\./, "");
    let list = readLocal("videos.json");
    let posters = readLocal("posters.json") || {};
    if (!Array.isArray(list)) {
      const owner = process.env.GH_OWNER || "fashfdhgacd";
      const repo = process.env.GH_REPO || "koleksi-dr-pinguin";
      const base = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/main/data/";
      const [vr, pr] = await Promise.all([fetch(base + "videos.json"), fetch(base + "posters.json")]);
      if (!vr.ok) throw new Error("videos.json " + vr.status);
      list = await vr.json();
      posters = pr.ok ? await pr.json() : {};
    }
    const urls = [];
    const seen = new Set();
    (Array.isArray(list) ? list : []).forEach(function (v) {
      if (/videy/i.test(kdp.rawOf(v))) return;
      const id = kdp.keyOf(v);
      if (!id || seen.has(id)) return;
      seen.add(id);
      const title = kdp.cleanTitle(v.title || id);
      let thumb = kdp.posterOf(v, posters);
      if (!thumb || /logo\.png/i.test(String(thumb))) thumb = origin + "/og-card.svg";
      if (thumb.indexOf("http") !== 0) thumb = origin + thumb;
      const lm = String(v.date || "").slice(0, 10) || "2026-09-01";
      urls.push({ loc: origin + "/v/" + encodeURIComponent(id), lastmod: lm, thumb: thumb, title: title, embed: kdp.embedOf(v) });
    });
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=1800");
    let xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    xml += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\">\n";
    urls.forEach(function (u) {
      xml += "<url><loc>" + kdp.esc(u.loc) + "</loc>";
      if (u.lastmod) xml += "<lastmod>" + kdp.esc(u.lastmod) + "</lastmod>";
      xml += "<video:video>";
      xml += "<video:thumbnail_loc>" + kdp.esc(u.thumb) + "</video:thumbnail_loc>";
      xml += "<video:title>" + kdp.esc(u.title).slice(0, 100) + "</video:title>";
      xml += "<video:description>" + kdp.esc(u.title).slice(0, 200) + " 18+</video:description>";
      if (u.embed) xml += "<video:player_loc allow_embed=\"yes\">" + kdp.esc(u.embed) + "</video:player_loc>";
      xml += "<video:family_friendly>no</video:family_friendly>";
      xml += "</video:video></url>\n";
    });
    xml += "</urlset>";
    return res.status(200).send(xml);
  } catch (e) {
    console.error(e);
    res.status(500).send("sitemap error");
  }
};
