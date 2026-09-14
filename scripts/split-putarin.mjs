import fs from 'fs';
const src = 'data/videos.json';
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
function isPut(v) {
  const blob = [v.category, v.source, v.embed, v.direct, v.embedUrl].join(' ').toLowerCase();
  return blob.includes('putarin') || blob.includes('puterin');
}
const put = data.filter(isPut);
const keep = data.filter((v) => !isPut(v));
const oldPut = fs.existsSync('data/putarin.json') ? JSON.parse(fs.readFileSync('data/putarin.json', 'utf8')) : [];
const seen = new Set(put.map((v) => String(v.embed || v.direct || '')));
for (const v of oldPut) {
  const k = String(v.embed || v.direct || '');
  if (k && !seen.has(k)) { put.push(v); seen.add(k); }
}
fs.writeFileSync(src, JSON.stringify(keep, null, 2));
fs.writeFileSync('data/putarin.json', JSON.stringify(put, null, 2));
console.log(JSON.stringify({ videos: keep.length, putarin: put.length }));
