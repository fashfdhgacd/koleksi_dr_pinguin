function esc(s) {
  const map = Object.create(null);
  map["\x26"] = "\x26amp;";
  map["\x3c"] = "\x26lt;";
  map["\x3e"] = "\x26gt;";
  map['"'] = "\x26quot;";
  map["'"] = "\x26#39;";
  return String(s || "").replace(/[&<>"']/g, function (ch) { return map[ch]; });
}
module.exports = esc;
