# Koleksi Dr. Pinguin Bokep, M.S.B.

Gallery static + admin + API share (`/v/:id`) untuk domain **https://koleksidrpinguin.site**

Repo: https://github.com/fashfdhgacd/koleksi-dr-pinguin.git

## Deploy ke Vercel (akun baru)

1. Import project dari GitHub repo ini.
2. Framework Preset: **Other**
3. Build Command: kosong
4. Output Directory: `.`
5. Root Directory: `.`
6. Deploy.
7. **Wajib:** Settings → Deployment Protection → matikan **Vercel Authentication** untuk Production **dan** Preview.
   Kalau ini nyala, URL `*.vercel.app` cuma login wall (itu yang bikin preview terlihat rusak).
8. Settings → Domains → add `koleksidrpinguin.site` + `www.koleksidrpinguin.site`.
9. Promote deployment ke **Production** (bukan cuma Preview).

Production domain publik = `koleksidrpinguin.site`.
Preview `*-ysdira106-*.vercel.app` akan tetap login-walled kalau Protection belum dimatikan.

## Admin

1. Buka `/admin.html`
2. Password: `Koleksi Dr. Pinguin Bokep, M.S.B`
3. Tab Export / Import → GitHub Token → Simpan ke GitHub
