# Rencana perbaikan Dr. Pinguin

## Aturan
Tidak tambal file acak. Satu jalur dulu, tes, baru fitur baru.

## Jalur yang benar
1. Beranda = gallery + modal nonton.
2. Cover IndoAV/userbokep dari `data/posters.json`.
3. Putarin/Mumu tetap API yang sudah ada.
4. `/v/:id` hanya untuk bagikan, bukan otak gallery.
5. Jangan load file yang 404 (`gallery-full.js`).

## Otomatis yang sudah hidup
- `backfill-posters` tiap jam + berantai setelah commit berhasil.
- `health` tiap 30 menit: beranda, app.js, modal-share.js, videos.json, posters.json, `/v/`.
- Health gagal → issue GitHub label `health` (tidak dobel kalau masih open).

## Kalau web rusak
1. Buka Actions → `health` → log FAIL mana.
2. Jangan Cancel backfill yang sedang commit.
3. `posters.json` harus objek `{ "id": "https://..." }`, bukan teks acak.
4. Gallery inti masih di jsDelivr SHA `64ee4c14`. Overlay: `/js/app.js`, `/js/modal-share.js`, `/js/poster-map.js`.
5. Perbaiki 1 file per commit, cek health hijau.

## Urutan rapih (jangan campur)
1. Cover penuh (backfill).
2. Gallery pakai posters.json, tanpa iframe di kartu.
3. Modal satu layout, grid 2 kolom terkunci.
4. Baru setelah itu rapikan `/v/` atau buang.
