import fs from 'fs';
const p = 'data/videos.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
function isExa(v) {
  const blob = [
    v.category, v.source, v.embed, v.direct, v.embedUrl,
    Array.isArray(v.tags) ? v.tags.join(' ') : ''
  ].join(' ').toLowerCase();
  return blob.includes('vicek') || blob.includes('exastream') || blob.includes('exa stream');
}
const keep = data.filter((v) => !isExa(v));
const drop = data.length - keep.length;
fs.writeFileSync(p, JSON.stringify(keep, null, 2));
console.log(JSON.stringify({ before: data.length, after: keep.length, removed: drop }));
