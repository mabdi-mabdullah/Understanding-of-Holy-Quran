# Production Companion App — Standalone Deployment Guide

This directory (`App/`) is architected as a completely decoupled, zero-build, static web application ready for immediate standalone deployment to any static web hosting provider (such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, AWS S3 / CloudFront, Firebase Hosting, or any standard Apache / Nginx web server).

---

## 1. Directory Structure

```
App/
├── index.html                 # Main entry point with responsive layout & accessible semantics
├── styles.css                 # Clean CSS with tri-script typography (Amiri, Gulzar, Inter)
├── app.js                     # Modular frontend application logic, state, and event bindings
├── README.md                  # App features and architecture documentation
├── DEPLOYMENT.md              # Standalone deployment instructions
└── data/
    ├── rules_data.js          # Master Grammar Rules dataset (60 verified rules: Units 1–4)
    ├── tajweed_data.js        # Authorized Tajweed Curriculum dataset (12 complete topics)
    ├── words_data.js          # Master Vocabulary catalog (1,401 base-lemma entries)
    └── translations_data.js   # Quranic Ayah translation and drill dataset
```

---

## 2. Key Architectural Characteristics

1. **Zero Build Step Required:**
   - Pure vanilla HTML5, CSS3, and ES6 JavaScript.
   - No `npm`, `node_modules`, `webpack`, `vite`, or compiler pipelines required.
   - Simply serve the root `App/` directory.

2. **Decoupled Data Architecture:**
   - All datasets in `App/data/` load as global browser script assets (`window.GRAMMAR_RULES`, `window.TAJWEED_DATA`, `window.LEXICON_DATA`).
   - Also export as CommonJS (`module.exports`) for automated testing and CI verification.
   - Completely independent from the parent repository's markdown curriculum files.

3. **Relative Path Integrity:**
   - All asset links (CSS, scripts, data files) use strict relative paths (e.g. `styles.css`, `data/rules_data.js`).
   - Runs identically from a domain root (`https://companion.example.com/`) or a subdirectory (`https://example.com/quranic-app/`).

4. **Zero Cross-Origin Blocking (CORS Free):**
   - Because data files are included via `<script src="...">` tags, the app can run on standard `file://` protocols, local offline environments, or production CDNs without triggering CORS errors.

---

## 3. Quick Deployment Options

### Option A: Netlify Drop / Netlify CLI
- **Drag-and-Drop:** Drag the entire `App` folder directly into [Netlify Drop](https://app.netlify.com/drop).
- **CLI:** Run `npx netlify-cli deploy --dir=App --prod`.

### Option B: Vercel
- **CLI:** From within the `App` directory, run `npx vercel --prod`.
- Or set the root directory in the Vercel project settings to `App`.

### Option C: GitHub Pages
- Option 1: Push the contents of `App/` to a dedicated `gh-pages` branch.
- Option 2: Place `App` inside a dedicated standalone repository and enable GitHub Pages on root `/`.

### Option D: Cloudflare Pages
- Connect the Git repository and set the **Build output directory** to `App`.
- Leave the **Build command** empty.

---

## 4. Current Curriculum State in Deployment

- **Grammar Rules Tab:**
  - **Unit 1:** 19 rules active
  - **Unit 2:** 13 rules active
  - **Unit 3:** 10 rules active
  - **Unit 4:** 18 rules active
  - **Unit 5:** Dynamically displays "Under Construction" badge
  - **Total Active Rules:** 60 Rules
- **Tajweed Tab:**
  - 12 authorized topics active (Makharij, Noon Sakin & Tanween, Meem Sakin, Madd, Ghunnah, Qalqalah, Lam of Jalalah, Raa, Summary, Drills)
- **Words Tab:**
  - 1,401 curated vocabulary items with Arabic, transliteration, English, and Urdu Nastaliq
