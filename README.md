# Quranic Arabic Companion — Production Web Application

A unified, interactive study companion for Quranic Arabic covering Units 1 through 5. It integrates a comprehensive vocabulary dictionary, structured grammar rules with case formulas, and authorized Tajweed principles.

---

## Architecture & Layout

```
App/
├── index.html                 # Main interface (tri-tab layout: Tajweed, Rules, Words)
├── styles.css                 # Responsive stylesheet with tri-script typography
├── app.js                     # Core application logic, live search, and reactive views
└── data/
    ├── words_data.js          # Master vocabulary catalog (1,401 verified base-lemma entries)
    ├── rules_data.js          # Master grammar rules dataset (31 comprehensive rules)
    └── tajweed_data.js        # Authorized Tajweed curriculum dataset (12 sections)
```

---

## Core Modules & Features

### 1. Vocabulary Dictionary (Words Tab — Default Active View)
- **Scope:** 1,401 deduplicated, curated base-lemma vocabulary entries extracted across Units 1 to 5, including lesson vocabulary tables and Quranic ayah occurrences, with zero drill fragments or invalid tashkeel.
- **Search Engine:** High-performance, diacritic-tolerant universal live search across Arabic text, transliteration, English meanings, and Urdu translations.
- **Alphabetical Filter:** Quick filter bar covering the complete Arabic alphabet (`أ` through `ي` plus `All`).
- **Card Design:** 
  - Vocalized Arabic heading with dedicated grammatical category badges (`اسْمٌ`, `عَلَمٌ`, `صِفَةٌ`, `ضَمِيرٌ`, `اسْمُ إِشَارَة`, `اسْمُ مَوْصُول`, `ظَرْفٌ`).
  - Academic transliteration and English definition.
  - Urdu translation in authentic Nastaliq calligraphy (`Gulzar`).
  - One-click copy for Arabic text with toast confirmation.
- **Language Display:** Permanently bilingual word cards rendering authentic Urdu Nastaliq (`Gulzar`) and English meanings side-by-side with a refined divider line.

### 2. Grammar Rules Module (Rules Tab)
- **Scope:** 31 comprehensive grammatical rules covering the full pedagogical progression of Units 1 through 5.
- **Rule Structure:**
  - Operator badge, transliteration, and classical grammatical designation (*Dawr al-I'rāb*).
  - Syntactic formula pattern box (`الصيغة النحوية`).
  - Case effect (*I'rāb* impact: Nominative, Accusative, Genitive).
  - Primary meaning and in-depth explanations in both Urdu and English.
  - Lesson sub-rules capturing nuances, phonetic shifts, conjunctions, and compound structures.
  - Curated Quranic and pedagogical examples with parallel translations.
- **Navigation Modes:** Island view (focused single-rule mode with Previous/Next controls) and Full Document view.

### 3. Tajweed Module (Tajweed Tab)
- **Scope:** Authorized foundational Tajweed curriculum covering 12 distinct sections.
- **Topics:** Definition & necessity of Tajweed, articulation points (*Makhārij*), rules of Nūn Sākin & Tanwīn (*Iẓhār*, *Idghām*, *Iqlāb*, *Ikhfā'*), rules of Mīm Sākin, *Ghunnah*, *Qalqalah*, *Madd*, and heavy/light articulation of Lām and Rā.
- **Bilingual Interface:** Dedicated Urdu and English view modes.

---

## Typography Standards
- **Arabic Text:** Amiri (`font-family: 'Amiri', serif`)
- **Urdu Text:** Gulzar (`font-family: 'Gulzar', serif`)
- **English / UI:** Inter (`font-family: 'Inter', sans-serif`)
