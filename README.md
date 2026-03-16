# ClearSnap 📸

A 100% on-device Android app to scan your photo gallery, group images by age,
and bulk-delete old screenshots, WhatsApp forwards, and promo images.

**No API. No internet. No Expo account. No tokens. Just GitHub.**

---

## How to get your APK

### Step 1 — Put the project on GitHub
- Go to [github.com](https://github.com) → **New repository** → name it `clearsnap`
- Upload the contents of this folder (drag & drop works in the GitHub web UI)
- Commit to the `main` branch

### Step 2 — Watch it build automatically
- GitHub Actions triggers instantly on every push to `main`
- Go to your repo → **Actions** tab → click the running workflow **"Build Android APK"**
- Wait ~10 minutes for it to finish

### Step 3 — Download your APK
- Once the workflow is green ✅, scroll to the bottom of the run
- Under **Artifacts**, click **ClearSnap-APK** to download a zip
- Unzip it — inside is `app-debug.apk`

### Step 4 — Install on your Android phone
- Send the APK to your phone (USB, WhatsApp, Google Drive, email — anything)
- Tap the file on your phone → Install
- If blocked: **Settings → Apps → Special app access → Install unknown apps** → enable for your browser or file manager

That's it. No accounts, no tokens, no terminal needed.

---

## Trigger a new build manually (without pushing code)
- Go to your repo → **Actions** → **Build Android APK** → **Run workflow** → **Run workflow**

---

## Project Structure

```
ClearSnap/
├── .github/
│   └── workflows/
│       └── build-apk.yml        ← GitHub Actions build config
├── app/
│   ├── _layout.tsx              # Tab navigator
│   ├── index.tsx                # Timeline tab
│   ├── categories.tsx           # Categories tab
│   └── storage.tsx              # Storage tab
├── src/
│   ├── hooks/useGallery.ts      # All gallery state & logic
│   ├── utils/imageAnalyzer.ts   # On-device scan + categorize + delete
│   ├── utils/theme.ts           # Colors & constants
│   ├── screens/                 # 3 full screens
│   └── components/              # ImageGrid, CategoryChips, BottomBar
├── app.json                     # Android config + permissions
└── package.json
```

---

## How categorisation works (no AI, 100% on-device)

| Category      | Filename patterns detected |
|---------------|---------------------------|
| 💬 WhatsApp    | `IMG-YYYYMMDD-WA####`, `WhatsApp Image` |
| 📸 Screenshots | `Screenshot_*`, `Screen_Shot*` |
| 📘 Facebook    | `FB_IMG_*`, `facebook*` |
| 🛒 Promotions  | `promo`, `offer`, `deal`, `sale`, `amazon`, `flipkart`, `swiggy`... |
| 📥 Received    | `received_*`, `forward*`, `shared*` |
| 🖼 Personal    | Everything else |

To add patterns: edit the `RULES` array in `src/utils/imageAnalyzer.ts`, push to `main`, new APK builds automatically.
