module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  const key = String(process.env.PUTARIN_API_KEY || "").trim();
  if (!key) {
    return res.status(200).json({ ok: false, needKey: true, hint: "Isi PUTARIN_API_KEY di Vercel, jangan kirim key ke chat." });
  }
  try {
    const days = Math.min(365, Math.max(1, parseInt(String((req.query && req.query.days) || "30"), 10) || 30));
    const me = await fetch("https://panel.putarin.com/api/dev/me", { headers: { "X-API-Key": key } }).then(function (r) { return r.json(); });
    const stats = await fetch("https://panel.putarin.com/api/dev/stats?days=" + days, { headers: { "X-API-Key": key } }).then(function (r) { return r.json(); });
    return res.status(200).json({ ok: true, me: me, stats: stats });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
};
