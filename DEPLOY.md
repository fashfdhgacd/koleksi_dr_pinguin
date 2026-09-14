# Deploy — production pass

## Apa yang berubah
- Tailwind CDN dan Font Awesome CDN dihapus. CSS produksi ada di `/css/app.css`.
- Homepage baru: 1 H1, hero 1 poster (tanpa iframe), search di header, grid poster lazy, filter kategori, `?page=` + muat 24 lagi.
- Halaman tonton `/v/:id` dengan poster dulu, meta, chip, related 16, bagikan, kembali, laporkan, JSON-LD, OG.
- Legal: `/privasi` `/syarat` `/dmca` `/kontak`.
- Age gate cookie + localStorage 30 hari; Keluar → Google.
- Header keamanan di `vercel.json`.
- Item ABG / siswa / SMA / sekolah / underage keluar dari home, search, related, sitemap-v. Daftar: `NOTES.md`. JSON katalog tidak dihapus.
- Analytics: hanya Vercel Insights.

## URL
- Produksi: https://koleksidrpinguin.com/
- Repo: https://github.com/fashfdhgacd/koleksi-dr-pinguin
- Branch kerja: `repair/web-production-pass`

## Sisa risiko
- Durasi hampir selalu kosong — badge durasi disembunyikan.
- Poster hoster pihak ketiga bisa gagal; fallback `/api/thumb`.
- Embed pihak ketiga bisa mati.
- CSP ketat: hoster baru harus ditambah di `vercel.json`.

## Jika push terhalang
```bash
git checkout repair/web-production-pass
git push -u origin repair/web-production-pass
```
Jangan force-push. Jangan commit `.env`.
