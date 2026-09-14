# Env Vercel — bot Telegram

Isi di Vercel → Project `koleksi-dr-pinguin` → Settings → Environment Variables.
Centang Production + Preview. Setelah simpan: Redeploy Production.

Jangan commit file `.env`. Pakai `.env.example` sebagai acuan nama variabel.

| Nama | Wajib | Contoh / isi |
|---|---|---|
| `BOT_TOKEN` | ya | token dari @BotFather |
| `GH_TOKEN` | ya (untuk upload) | PAT utuh: `ghp_...` atau `github_pat_...` |
| `GH_OWNER` | ya | `fashfdhgacd` |
| `GH_REPO` | ya | `koleksi-dr-pinguin` |
| `GH_STATE_REPO` | disarankan | `kdp-bot-state` |
| `GH_PATH` | tidak | `data/videos.json` |
| `GH_BRANCH` | tidak | `main` |
| `TELEGRAM_USER_ID` | ya | `7747474006` |
| `PUBLIC_HOST` | tidak | `https://koleksidrpinguin.com` |

## GH_TOKEN

Fine-grained PAT:
- Resource owner: `fashfdhgacd`
- Repositories: `koleksi-dr-pinguin` dan `kdp-bot-state`
- Repository permissions → Contents: Read and write

Token harus utuh. Potongan jenis `Iv23li...` akan selalu `Bad credentials`.

## Cek

1. https://koleksidrpinguin.com/api/telegram → `hasBot: true`, `hasGh: true`
2. Kirim 1 link Videy ke bot → `+1` atau `skip`, bukan Bad credentials
