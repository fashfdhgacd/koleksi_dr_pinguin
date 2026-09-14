# Backup otomatis katalog

Sumber data: `data/videos.json`, `data/mumu.json`, `data/putarin.json`.

## Yang jalan sendiri

Workflow `.github/workflows/backup-catalog.yml`:

- setiap hari jam 00.00 WIB
- setiap kali file `data/*.json` di-push
- tombol manual: Actions → **Backup katalog** → Run workflow

Hasil:

1. Folder `backup/latest/` di repo (copy file terakhir yang valid)
2. Artifact GitHub, simpan 90 hari (Actions → run → Artifacts)

Git history `data/videos.json` juga backup. Restore file dari commit lama seperti kemarin (commit `9228dc53`).

## Pulihkan dari backup/latest

```
cp backup/latest/videos.json data/videos.json
cp backup/latest/mumu.json data/mumu.json
cp backup/latest/putarin.json data/putarin.json
git add data && git commit -m "restore dari backup/latest" && git push
```

Atau di GitHub: buka `backup/latest/videos.json` → raw → upload ke `data/`.

## Jangan

Jangan commit `videos.json` yang isinya < 100 item. Bot sudah menolak upload kalau file utama mengecil mendadak.
