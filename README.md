# ClearSnap 📸

A 100% on-device Android app to scan your photo gallery, group images by age,
and bulk-delete old screenshots, WhatsApp forwards, and promo images.

**No API. No internet. No Expo account. No tokens. Just GitHub.**

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
