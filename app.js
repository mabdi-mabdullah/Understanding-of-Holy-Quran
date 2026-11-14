/**
 * Quranic Arabic Study Companion — Application Logic
 * High-performance, diacritic-tolerant search across 2,030 Grand Master Base Words,
 * 83 Grammar Rules across Units 1 to 5, and authentic Tajweed modules.
 * Restored Beta App Design with full gestures, modals, theme persistence, and bilingual controls.
 * Zero emojis across all modules.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // Data References
  // -------------------------------------------------------------
  const wordsCollection = (typeof WORDS_DATA !== 'undefined') ? WORDS_DATA :
    ((typeof DICTIONARY_WORDS !== 'undefined') ? DICTIONARY_WORDS : []);

  const rulesCollection = (typeof RULES_DATA !== 'undefined') ? RULES_DATA :
    ((typeof GRAMMAR_RULES !== 'undefined') ? GRAMMAR_RULES : []);

  const tajweedCollection = (typeof TAJWEED_DATA !== 'undefined') ? TAJWEED_DATA : [];

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  let activeTab = 'words'; // Default: 'words' | 'tajweed' | 'rules' | 'ayahs'
  let activeLetter = 'ALL';
  let activeRuleUnit = '1'; // Default: Unit 1
  let activeRuleIndex = 0; // Local index within current unit rules
  let rulesDisplayMode = 'all'; // 'all' (Brief Overview grid) | 'island' (one rule at a time)
  let singleLangMode = 'UR'; // 'UR' (default) | 'EN' for Tajweed & Rules
  let searchQuery = '';

  // Tab navigation sequence (Strictly: Tajweed -> Words -> Rules -> Translations)
  const TAB_ORDER = ['tajweed', 'words', 'rules', 'ayahs'];

  // -------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------
  // Tab Navigation Buttons & Views
  const tabTajweedBtn = document.getElementById('tabTajweedBtn');
  const tabWordsBtn = document.getElementById('tabWordsBtn');
  const tabRulesBtn = document.getElementById('tabRulesBtn');
  const tabAyahsBtn = document.getElementById('tabAyahsBtn');

  const viewTajweed = document.getElementById('viewTajweed');
  const viewWords = document.getElementById('viewWords');
  const viewRules = document.getElementById('viewRules');
  const viewAyahs = document.getElementById('viewAyahs');

  // Tajweed View Elements
  const tajweedList = document.getElementById('tajweedList');

  // Words View Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const alphabetBar = document.getElementById('alphabetBar');
  const dictionaryList = document.getElementById('dictionaryList');

  // Rules View Elements
  const ruleFilterRow = document.getElementById('ruleFilterRow');
  const ruleUnitLabel = document.getElementById('ruleUnitLabel');
  const ruleUnitSelect = document.getElementById('ruleUnitSelect');
  const ruleSelectLabel = document.getElementById('ruleSelectLabel');
  const ruleSelect = document.getElementById('ruleSelect');
  const rulesList = document.getElementById('rulesList');

  // Ayahs (Translations) View Elements
  const ayahsList = document.getElementById('ayahsList');

  // Header & Global Controls
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const langSwitcher = document.getElementById('langSwitcher');
  const toggleUrduBtn = document.getElementById('toggleUrduBtn');
  const toggleEnglishBtn = document.getElementById('toggleEnglishBtn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // Course Outline Modal Elements
  const outlineToggleBtn = document.getElementById('outlineToggleBtn');
  const outlineModal = document.getElementById('outlineModal');
  const outlineCloseBtn = document.getElementById('outlineCloseBtn');

  // Arabic Alphabet list for the Words filter bar
  const ARABIC_ALPHABET = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
    'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'
  ];

  // -------------------------------------------------------------
  // 1. Text Normalization Helpers & Scroll Utility
  // -------------------------------------------------------------
  function normalizeEnglish(str) {
    if (!str) return '';
    return str
      .replace(/[āâäĀÂÄ]/g, 'a')
      .replace(/[īîïĪÎÏ]/g, 'i')
      .replace(/[ūûüŪÛÜ]/g, 'u')
      .replace(/[ṣŝṢŜ]/g, 's')
      .replace(/[ḍḌ]/g, 'd')
      .replace(/[ṭṬ]/g, 't')
      .replace(/[ẓẒ]/g, 'z')
      .replace(/[ḥḤ]/g, 'h')
      .toLowerCase()
      .replace(/[\u2018\u2019'`]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  function normalizeArabic(str) {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u065F\u0670\u0653\u06D6-\u06ED]/g, '')
      .replace(/[\u0625\u0623\u0622\u0671\u0621]/g, 'ا')
      .replace(/\u06A9/g, '\u0643')
      .replace(/[\u06CC\u0649]/g, '\u064A')
      .replace(/[\u06C1\u0629]/g, '\u0647')
      .replace(/[\s\-\–\—\.\,\;\:\•\/\(\)\[\]\{\}]/g, '')
      .trim();
  }

  function scrollToTopIfScrolled() {
    if (window.scrollY > 40) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  // -------------------------------------------------------------
  // 2. Main Tabs Navigation (Tajweed -> Words -> Rules -> Translations)
  // -------------------------------------------------------------
  function initTabs() {
    if (tabTajweedBtn) {
      tabTajweedBtn.addEventListener('click', () => switchTab('tajweed'));
    }
    if (tabWordsBtn) {
      tabWordsBtn.addEventListener('click', () => switchTab('words'));
    }
    if (tabRulesBtn) {
      tabRulesBtn.addEventListener('click', () => switchTab('rules'));
    }
    if (tabAyahsBtn) {
      tabAyahsBtn.addEventListener('click', () => switchTab('ayahs'));
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    const isTajweed = tab === 'tajweed';
    const isWords = tab === 'words';
    const isRules = tab === 'rules';
    const isAyahs = tab === 'ayahs';

    if (tabTajweedBtn) {
      tabTajweedBtn.classList.toggle('active', isTajweed);
      tabTajweedBtn.setAttribute('aria-selected', isTajweed ? 'true' : 'false');
    }
    if (tabWordsBtn) {
      tabWordsBtn.classList.toggle('active', isWords);
      tabWordsBtn.setAttribute('aria-selected', isWords ? 'true' : 'false');
    }
    if (tabRulesBtn) {
      tabRulesBtn.classList.toggle('active', isRules);
      tabRulesBtn.setAttribute('aria-selected', isRules ? 'true' : 'false');
    }
    if (tabAyahsBtn) {
      tabAyahsBtn.classList.toggle('active', isAyahs);
      tabAyahsBtn.setAttribute('aria-selected', isAyahs ? 'true' : 'false');
    }

    if (viewTajweed) {
      viewTajweed.style.display = isTajweed ? 'block' : 'none';
    }
    if (viewWords) {
      viewWords.style.display = isWords ? 'block' : 'none';
    }
    if (viewRules) {
      viewRules.style.display = isRules ? 'block' : 'none';
    }
    if (viewAyahs) {
      viewAyahs.style.display = isAyahs ? 'block' : 'none';
    }

    updateToggleButtonsUI();
    scrollToTopIfScrolled();

    if (isTajweed) {
      renderTajweed();
    } else if (isWords) {
      renderWords();
    } else if (isRules) {
      renderRules();
    } else if (isAyahs) {
      renderAyahs();
    }
  }

  // -------------------------------------------------------------
  // 3. Alphabet Bar (Words View)
  // -------------------------------------------------------------
  function initAlphabetBar() {
    if (!alphabetBar) return;
    alphabetBar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'letter-btn all-btn active';
    allBtn.textContent = 'All';
    allBtn.setAttribute('data-letter', 'ALL');
    allBtn.addEventListener('click', () => setLetterFilter('ALL'));
    alphabetBar.appendChild(allBtn);

    const letterCounts = {};
    wordsCollection.forEach(w => {
      if (w.letter) {
        letterCounts[w.letter] = (letterCounts[w.letter] || 0) + 1;
      }
    });

    ARABIC_ALPHABET.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'letter-btn';
      btn.textContent = letter;
      btn.setAttribute('data-letter', letter);
      const count = letterCounts[letter] || 0;
      btn.title = `${letter} (${count} words)`;
      
      if (count === 0) {
        btn.style.opacity = '0.35';
        btn.style.cursor = 'default';
      } else {
        btn.addEventListener('click', () => setLetterFilter(letter));
      }

      alphabetBar.appendChild(btn);
    });
  }

  function setLetterFilter(letter) {
    activeLetter = letter;
    document.querySelectorAll('.letter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-letter') === letter);
    });
    scrollToTopIfScrolled();
    renderWords();
  }

  // -------------------------------------------------------------
  // 4. Tab-Contextual Language Toggles
  // -------------------------------------------------------------
  function updateToggleButtonsUI() {
    const isUr = singleLangMode === 'UR';

    // Language switcher visibility: Hidden on Words tab (always bilingual), visible on Tajweed, Rules, and Translations
    if (langSwitcher) {
      langSwitcher.style.display = activeTab === 'words' ? 'none' : 'inline-flex';
    }

    if (toggleUrduBtn) toggleUrduBtn.classList.toggle('active', isUr);
    if (toggleEnglishBtn) toggleEnglishBtn.classList.toggle('active', !isUr);

    // Localize Filter Row Labels
    if (ruleUnitLabel) ruleUnitLabel.textContent = isUr ? 'یونٹ' : 'Unit';
    if (ruleSelectLabel) ruleSelectLabel.textContent = isUr ? 'قاعدہ' : 'Rule';

    // Localize Direction for Filter Rows
    if (ruleFilterRow) ruleFilterRow.setAttribute('dir', isUr ? 'rtl' : 'ltr');

    // Localize Unit dropdown options
    if (ruleUnitSelect) {
      Array.from(ruleUnitSelect.options).forEach(opt => {
        const uVal = opt.value;
        opt.textContent = isUr ? `\u200Fیونٹ ${uVal}` : `Unit ${uVal}`;
      });
    }

    populateRuleSelect();
  }

  function initLanguageToggles() {
    const savedSingleMode = localStorage.getItem('mq_single_lang_mode') || 'UR';
    singleLangMode = savedSingleMode;
    updateToggleButtonsUI();

    if (toggleUrduBtn) {
      toggleUrduBtn.addEventListener('click', () => {
        singleLangMode = 'UR';
        localStorage.setItem('mq_single_lang_mode', singleLangMode);
        updateToggleButtonsUI();
        if (activeTab === 'rules') {
          renderRules();
        } else if (activeTab === 'tajweed') {
          renderTajweed();
        }
      });
    }

    if (toggleEnglishBtn) {
      toggleEnglishBtn.addEventListener('click', () => {
        singleLangMode = 'EN';
        localStorage.setItem('mq_single_lang_mode', singleLangMode);
        updateToggleButtonsUI();
        if (activeTab === 'rules') {
          renderRules();
        } else if (activeTab === 'tajweed') {
          renderTajweed();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // 5. Universal Filtering Engine (Words)
  // -------------------------------------------------------------
  function getFilteredWords() {
    if (!wordsCollection || wordsCollection.length === 0) return [];
    const rawQuery = searchQuery.trim();
    const normEnQuery = normalizeEnglish(rawQuery);
    const normArQuery = normalizeArabic(rawQuery);

    if (rawQuery.length === 0) {
      return wordsCollection.filter(w => {
        if (activeLetter !== 'ALL' && w.letter !== activeLetter) return false;
        return true;
      });
    }

    // Bidirectional Al- prefix handling
    let normArQueryWithoutAl = '';
    if (normArQuery.startsWith('ال')) {
      normArQueryWithoutAl = normArQuery.slice(2);
    }
    let normEnQueryWithoutAl = '';
    if (normEnQuery.startsWith('al')) {
      normEnQueryWithoutAl = normEnQuery.slice(2);
    }

    const scoredMatches = [];

    wordsCollection.forEach(w => {
      let score = 0;

      // Decompose Arabic word variants
      const normWordFull = normalizeArabic(w.ar);
      let normWordWithoutAl = '';
      if (normWordFull.startsWith('ال')) {
        normWordWithoutAl = normWordFull.slice(2);
      }

      const parts = w.ar.split(/[(\/]/);
      const normWordPrimary = normalizeArabic(parts[0]);
      const normWordParen = parts.length > 1 ? normalizeArabic(parts[1]) : '';

      // Decompose Transliteration variants
      const normTrFull = normalizeEnglish(w.tr);
      let normTrWithoutAl = '';
      if (normTrFull.startsWith('al')) {
        normTrWithoutAl = normTrFull.slice(2);
      }

      const trParts = (w.tr || '').split(/[(\/]/);
      const normTrPrimary = normalizeEnglish(trParts[0]);
      let normTrPrimaryWithoutAl = '';
      if (normTrPrimary.startsWith('al')) {
        normTrPrimaryWithoutAl = normTrPrimary.slice(2);
      }
      const normTrParen = trParts.length > 1 ? normalizeEnglish(trParts[1]) : '';

      // Exact match on Arabic or Transliteration (Score: 1000)
      const exactAr = normArQuery.length > 0 && (
        normWordPrimary === normArQuery ||
        (normWordParen && normWordParen === normArQuery) ||
        normWordFull === normArQuery ||
        (normArQueryWithoutAl && normWordFull === normArQueryWithoutAl) ||
        (normWordWithoutAl && normArQuery === normWordWithoutAl)
      );

      const exactTr = normEnQuery.length > 0 && (
        normTrPrimary === normEnQuery ||
        (normTrParen && normTrParen === normEnQuery) ||
        normTrFull === normEnQuery ||
        (normEnQueryWithoutAl && (normTrFull === normEnQueryWithoutAl || normTrPrimary === normEnQueryWithoutAl)) ||
        (normTrWithoutAl && normEnQuery === normTrWithoutAl) ||
        (normTrPrimaryWithoutAl && normEnQuery === normTrPrimaryWithoutAl)
      );

      // Prefix match on Arabic or Transliteration (Score: 500)
      const startsAr = normArQuery.length > 0 && (
        normWordPrimary.startsWith(normArQuery) ||
        (normWordParen && normWordParen.startsWith(normArQuery)) ||
        normWordFull.startsWith(normArQuery) ||
        (normArQueryWithoutAl && normWordFull.startsWith(normArQueryWithoutAl)) ||
        (normWordWithoutAl && normWordWithoutAl.startsWith(normArQuery))
      );

      const startsTr = normEnQuery.length > 0 && (
        normTrPrimary.startsWith(normEnQuery) ||
        (normTrParen && normTrParen.startsWith(normEnQuery)) ||
        normTrFull.startsWith(normEnQuery) ||
        (normEnQueryWithoutAl && (normTrFull.startsWith(normEnQueryWithoutAl) || normTrPrimary.startsWith(normEnQueryWithoutAl))) ||
        (normTrWithoutAl && normTrWithoutAl.startsWith(normEnQuery)) ||
        (normTrPrimaryWithoutAl && normTrPrimaryWithoutAl.startsWith(normEnQuery))
      );

      // Substring match on Arabic or Transliteration (Score: 250)
      const containsAr = normArQuery.length > 0 && (
        normWordFull.includes(normArQuery) ||
        normWordPrimary.includes(normArQuery) ||
        (normWordParen && normWordParen.includes(normArQuery)) ||
        (normArQueryWithoutAl && normWordFull.includes(normArQueryWithoutAl))
      );

      const containsTr = normEnQuery.length > 0 && (
        normTrFull.includes(normEnQuery) ||
        normTrPrimary.includes(normEnQuery) ||
        (normTrParen && normTrParen.includes(normEnQuery)) ||
        (normEnQueryWithoutAl && (normTrFull.includes(normEnQueryWithoutAl) || normTrPrimary.includes(normEnQueryWithoutAl)))
      );

      if (exactAr || exactTr) {
        score = 1000;
      } else if (startsAr || startsTr) {
        score = 500;
      } else if (containsAr || containsTr) {
        score = 250;
      } else {
        // Meaning matches (Score: 10)
        const containsEnMeaning = normEnQuery.length >= 3 && w.cleanEn && 
          w.cleanEn.split(/\s+/).some(token => token === normEnQuery || token.startsWith(normEnQuery));
        const normUr = normalizeArabic(w.ur);
        const containsUrMeaning = normArQuery.length >= 3 && 
          normUr.split(/\s+/).some(token => token === normArQuery || token.startsWith(normArQuery));

        if (containsEnMeaning || containsUrMeaning) {
          score = 10;
        }
      }

      if (score > 0) {
        scoredMatches.push({ word: w, score });
      }
    });

    scoredMatches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.word.idx - b.word.idx;
    });

    return scoredMatches.map(item => item.word);
  }

  // -------------------------------------------------------------
  // 6. Render Words Dictionary List
  // -------------------------------------------------------------
  function renderWords() {
    if (!dictionaryList) return;
    const filteredWords = getFilteredWords();

    if (filteredWords.length === 0) {
      dictionaryList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-text">No words found</div>
          <div class="empty-state-hint">Try searching without diacritics / اعراب (e.g. متقون, الله) or transliteration (taqwa, lillah).</div>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    filteredWords.forEach(w => {
      const card = document.createElement('article');

      let posClass = 'is-noun';
      let badgeClass = 'badge-noun';
      let badgeText = 'Noun';

      const catStr = w.cat || '';
      if (catStr.includes('حَرْف') || catStr.toLowerCase().includes('part')) {
        posClass = 'is-part';
        badgeClass = 'badge-part';
        badgeText = 'Particle';
      } else if (catStr.includes('عَلَم') || catStr.toLowerCase().includes('prop')) {
        posClass = 'is-prop';
        badgeClass = 'badge-prop';
        badgeText = 'Proper Noun';
      } else if (catStr.includes('فِعْل') || catStr.toLowerCase().includes('verb')) {
        posClass = 'is-verb';
        badgeClass = 'badge-verb';
        badgeText = 'Verb';
      } else if (catStr.includes('صِفَة') || catStr.toLowerCase().includes('adj')) {
        posClass = 'is-adj';
        badgeClass = 'badge-adj';
        badgeText = 'Adjective';
      } else if (catStr.includes('اسْم') || catStr.toLowerCase().includes('noun')) {
        posClass = 'is-noun';
        badgeClass = 'badge-noun';
        badgeText = 'Noun';
      }

      card.className = `dict-card ${posClass}`;

      const meaningsHtml = `
        <div class="meaning-urdu" dir="rtl">${w.ur}</div>
        <div class="meaning-en">${w.en || ''}</div>
      `;

      const formattedIdx = String(w.idx).padStart(4, '0');

      card.innerHTML = `
        <div class="card-blend-top">
          <div class="card-blend-right">
            <span class="card-idx">${formattedIdx}</span>
            <div class="card-arabic" dir="rtl" title="${w.ar}">${w.ar}</div>
          </div>
          <div class="card-blend-left">
            <span class="card-tr">${w.tr || ''}</span>
            <span class="card-badge ${badgeClass}">${badgeText}</span>
          </div>
        </div>
        <div class="card-meanings-row">
          ${meaningsHtml}
        </div>
      `;

      fragment.appendChild(card);
    });

    dictionaryList.innerHTML = '';
    dictionaryList.appendChild(fragment);
  }

  // -------------------------------------------------------------
  // 7. Multi-Unit Grammar Rules Reference (Units 1 to 5)
  // -------------------------------------------------------------
  function getRulesForCurrentUnit() {
    const unitNum = parseInt(activeRuleUnit, 10);
    return rulesCollection.filter(r => r.unit === unitNum);
  }

  function populateRuleSelect() {
    if (!ruleSelect) return;
    const isUr = singleLangMode === 'UR';
    const unitRules = getRulesForCurrentUnit();
    ruleSelect.innerHTML = '';

    // "All Rules" option (Brief Overview)
    const allOpt = document.createElement('option');
    allOpt.value = 'ALL';
    allOpt.textContent = isUr ? 
      `\u200Fتمام قواعد یونٹ ${activeRuleUnit} (مختصر خلاصہ)` : 
      `All Unit ${activeRuleUnit} Rules (Brief Overview)`;
    ruleSelect.appendChild(allOpt);

    // Individual Rule Options
    unitRules.forEach((r, idx) => {
      const opt = document.createElement('option');
      opt.value = idx.toString();
      const opText = r.operator || '';
      const opTrText = r.operatorTr ? `(${r.operatorTr})` : '';
      if (isUr) {
        opt.textContent = `\u200Fقاعدہ ${idx + 1} (${opText}) • ${r.titleUr}`;
      } else {
        opt.textContent = `Rule ${idx + 1}: ${opText} ${opTrText} — ${r.titleEn}`;
      }
      ruleSelect.appendChild(opt);
    });

    if (rulesDisplayMode === 'all') {
      ruleSelect.value = 'ALL';
    } else {
      if (activeRuleIndex >= unitRules.length) activeRuleIndex = 0;
      ruleSelect.value = activeRuleIndex.toString();
    }
  }

  function initRuleFilters() {
    if (ruleUnitSelect) {
      ruleUnitSelect.value = activeRuleUnit;
      ruleUnitSelect.addEventListener('change', () => {
        activeRuleUnit = ruleUnitSelect.value;
        activeRuleIndex = 0;
        rulesDisplayMode = 'all';
        populateRuleSelect();
        scrollToTopIfScrolled();
        renderRules();
      });
    }

    if (ruleSelect) {
      ruleSelect.addEventListener('change', () => {
        const val = ruleSelect.value;
        if (val === 'ALL') {
          rulesDisplayMode = 'all';
        } else {
          rulesDisplayMode = 'island';
          activeRuleIndex = parseInt(val, 10);
        }
        scrollToTopIfScrolled();
        renderRules();
      });
    }

    populateRuleSelect();
  }

  function renderRules() {
    if (!rulesList) return;
    const isUr = singleLangMode === 'UR';
    const unitRules = getRulesForCurrentUnit();
    const totalRules = unitRules.length;

    if (totalRules === 0) {
      rulesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-text">No rules available for Unit ${activeRuleUnit}</div>
        </div>
      `;
      return;
    }

    if (activeRuleIndex < 0) activeRuleIndex = 0;
    if (activeRuleIndex >= totalRules) activeRuleIndex = totalRules - 1;

    // Synchronize top dropdown
    if (ruleSelect) {
      ruleSelect.value = rulesDisplayMode === 'all' ? 'ALL' : activeRuleIndex.toString();
    }

    const unitTitle = isUr ? 
      (unitRules[0].unitTitleUr || `یونٹ ${activeRuleUnit}`) : 
      (unitRules[0].unitTitleEn || `Unit ${activeRuleUnit}`);

    // Build Single Rule Section (Island Stepper)
    function buildRuleSection(r, idx, isSingleView) {
      const secNum = idx + 1;
      const titleBadge = isUr ? r.titleUr : r.titleEn;
      const effectBadge = isUr ? (r.caseEffectUr || '') : (r.caseEffectEn || '');
      const formulaLabel = isUr ? 'قاعدہ / کلیہ:' : 'Formula / Pattern:';
      const meaningText = isUr ? (r.primaryMeaningUr || '') : (r.primaryMeaningEn || '');
      const expText = isUr ? (r.explanationUr || '') : (r.explanationEn || '');
      const ruleNumBadge = isUr ? `\u200Fقاعدہ ${secNum}` : `Rule ${secNum}`;
      const opText = r.operator || '';
      const opTrText = r.operatorTr ? `(${r.operatorTr})` : '';

      // Sub-rules block
      let subRulesHtml = '';
      if (r.subRules && r.subRules.length > 0) {
        const subTitle = isUr ? 'اہم ذیلی قواعد و مشقی نکات:' : 'Key Sub-rules & Drill Patterns:';
        subRulesHtml = `
          <div class="doc-subrules-block">
            <span class="doc-subrules-label">${subTitle}</span>
            <ul class="doc-subrules-list">
              ${r.subRules.map(sr => `
                <li class="doc-subrule-item">
                  <strong class="doc-subrule-title">${isUr ? sr.titleUr : sr.titleEn}:</strong>
                  <span class="doc-subrule-text">${isUr ? sr.textUr : sr.textEn}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      // Quranic Examples block
      let examplesHtml = '';
      if (r.examples && r.examples.length > 0) {
        const exTitle = isUr ? 'قرآنی تطبیقات و شواہد:' : 'Quranic Applications & Evidence:';
        examplesHtml = `
          <div class="doc-examples-block">
            <span class="doc-examples-label">${exTitle}</span>
            <div class="doc-examples-flow">
              ${r.examples.map(ex => `
                <div class="doc-example-row">
                  <span class="doc-ex-ar font-ar" dir="rtl" lang="ar">${ex.ar}</span>
                  <span class="doc-ex-sep">—</span>
                  <span class="doc-ex-note">${isUr ? ex.ur : ex.en}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      // Island Footer with Previous / Next Stepper
      let footerHtml = '';
      if (isSingleView) {
        const prevDisabled = idx === 0 ? 'disabled' : '';
        const nextDisabled = idx === totalRules - 1 ? 'disabled' : '';
        const prevText = isUr ? 'پچھلا قاعدہ →' : '← Previous Rule';
        const nextText = isUr ? '← اگلا قاعدہ' : 'Next Rule →';
        const counterText = isUr ? `\u200Fقاعدہ ${secNum} از ${totalRules}` : `Rule ${secNum} of ${totalRules}`;

        footerHtml = `
          <footer class="rule-island-footer">
            <button id="rulePrevBtn" class="rule-nav-action-btn btn-nav-prev" ${prevDisabled} title="${isUr ? 'پچھلا قاعدہ' : 'Previous Rule'}">
              ${prevText}
            </button>
            <span class="rule-counter-badge">${counterText}</span>
            <button id="ruleNextBtn" class="rule-nav-action-btn btn-nav-next" ${nextDisabled} title="${isUr ? 'اگلا قاعدہ' : 'Next Rule'}">
              ${nextText}
            </button>
          </footer>
        `;
      }

      return `
        <section class="doc-section rule-card-island" id="rule-sec-${secNum}">
          <header class="doc-section-header">
            <div class="doc-sec-title-wrap">
              <span class="rule-island-num-badge">${ruleNumBadge}</span>
              <span class="doc-rule-operator font-ar" dir="rtl" lang="ar">${opText}</span>
              <span class="doc-rule-op-tr" dir="ltr">${opTrText}</span>
              <h2 class="doc-rule-title-text">${titleBadge}</h2>
            </div>
          </header>

          <div class="doc-section-body">
            <div class="doc-formula-banner">
              <span class="doc-formula-label"><strong>${formulaLabel}</strong></span>
              <span class="doc-formula-code font-ar" dir="rtl" lang="ar">${r.formula || ''}</span>
            </div>

            <div class="doc-rule-meta-prose">
              <div class="doc-meta-line"><strong>${isUr ? 'اعرابی اثر:' : 'Grammatical Effect (I\'rab):'}</strong> <span class="doc-effect-val">${effectBadge}</span></div>
              <div class="doc-meta-line"><strong>${isUr ? 'بنیادی مفہوم:' : 'Primary Meaning:'}</strong> <span>${meaningText}</span></div>
            </div>

            <div class="doc-explanation-prose">
              ${expText}
            </div>

            ${subRulesHtml}
            ${examplesHtml}
            ${footerHtml}
          </div>
        </section>
      `;
    }

    // Build Brief Overview Card (Grid mode)
    function buildRuleOverviewCard(r, idx) {
      const secNum = idx + 1;
      const title = isUr ? r.titleUr : r.titleEn;
      const effect = isUr ? (r.caseEffectUr || '') : (r.caseEffectEn || '');
      const meaning = isUr ? (r.primaryMeaningUr || '') : (r.primaryMeaningEn || '');
      const effectLabel = isUr ? 'اعرابی اثر:' : 'Grammatical Effect:';
      const meaningLabel = isUr ? 'بنیادی مفہوم:' : 'Primary Meaning:';
      const viewRuleBtnText = isUr ? 'مکمل تفصیل ←' : 'Full Details →';
      const opText = r.operator || '';
      const opTrText = r.operatorTr ? `(${r.operatorTr})` : '';
      const primaryExample = r.examples && r.examples.length > 0 ? r.examples[0] : null;

      let exampleHtml = '';
      if (primaryExample) {
        exampleHtml = `
          <div class="overview-ex-row">
            <span class="overview-ex-ar font-ar" dir="rtl">${primaryExample.ar}</span>
            <span class="overview-ex-sep">—</span>
            <span class="overview-ex-note">${isUr ? primaryExample.ur : primaryExample.en}</span>
          </div>
        `;
      }

      return `
        <article class="rule-overview-card" data-rule-idx="${idx}" title="${isUr ? 'اس قاعدے کی مکمل تفصیل دیکھیں' : 'View full rule details'}">
          <header class="rule-overview-header">
            <div class="rule-overview-title-group">
              <span class="rule-overview-idx">${secNum}</span>
              <span class="rule-overview-op font-ar" dir="rtl">${opText}</span>
              <span class="rule-overview-tr" dir="ltr">${opTrText}</span>
              <h3 class="rule-overview-title">${title}</h3>
            </div>
            <button class="rule-overview-jump-btn" data-rule-idx="${idx}">
              ${viewRuleBtnText}
            </button>
          </header>

          <div class="rule-overview-formula font-ar" dir="rtl">
            ${r.formula || ''}
          </div>

          <div class="rule-overview-meta-row">
            <div class="rule-overview-meta-item">
              <span class="meta-label"><strong>${effectLabel}</strong></span>
              <span class="meta-val">${effect}</span>
            </div>
            <div class="rule-overview-meta-item">
              <span class="meta-label"><strong>${meaningLabel}</strong></span>
              <span class="meta-val">${meaning}</span>
            </div>
          </div>

          ${exampleHtml}
        </article>
      `;
    }

    let contentHtml = '';
    if (rulesDisplayMode === 'island') {
      contentHtml = buildRuleSection(unitRules[activeRuleIndex], activeRuleIndex, true);
    } else {
      contentHtml = `
        <div class="rules-overview-lead">
          <p class="rules-overview-intro">
            ${isUr 
              ? `یونٹ ${activeRuleUnit} کے تمام ${totalRules} قواعد کا جامع خلاصہ۔ تفصیلی وضاحت اور امثلہ کے لیے کسی بھی قاعدے پر کلک کریں۔` 
              : `A concise high-yield overview of all ${totalRules} rules in Unit ${activeRuleUnit}. Click any rule card to view its full breakdown.`
            }
          </p>
        </div>
        <div class="rules-overview-grid">
          ${unitRules.map((r, idx) => buildRuleOverviewCard(r, idx)).join('')}
        </div>
      `;
    }

    rulesList.innerHTML = `
      <article class="doc-sheet ${isUr ? 'doc-rtl' : 'doc-ltr'}" dir="${isUr ? 'rtl' : 'ltr'}">
        <header class="doc-header simple-doc-header">
          <h1 class="doc-title">${unitTitle}</h1>
        </header>
        <div class="doc-content-flow">
          ${contentHtml}
        </div>
      </article>
    `;

    attachRuleNavListeners(unitRules);
  }

  function attachRuleNavListeners(unitRules) {
    if (!rulesList) return;

    // Island view Next & Prev buttons
    const prevBtn = document.getElementById('rulePrevBtn');
    const nextBtn = document.getElementById('ruleNextBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (activeRuleIndex > 0) {
          activeRuleIndex--;
          rulesDisplayMode = 'island';
          if (ruleSelect) ruleSelect.value = activeRuleIndex.toString();
          renderRules();
          scrollToTopIfScrolled();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (activeRuleIndex < unitRules.length - 1) {
          activeRuleIndex++;
          rulesDisplayMode = 'island';
          if (ruleSelect) ruleSelect.value = activeRuleIndex.toString();
          renderRules();
          scrollToTopIfScrolled();
        }
      });
    }

    // Overview cards jump buttons
    const overviewCards = rulesList.querySelectorAll('.rule-overview-card');
    overviewCards.forEach(card => {
      card.addEventListener('click', () => {
        const targetIdx = parseInt(card.getAttribute('data-rule-idx'), 10);
        if (!isNaN(targetIdx)) {
          activeRuleIndex = targetIdx;
          rulesDisplayMode = 'island';
          if (ruleSelect) ruleSelect.value = activeRuleIndex.toString();
          renderRules();
          scrollToTopIfScrolled();
        }
      });
    });
  }

  // -------------------------------------------------------------
  // 8. Render Tajweed (Single Continuous Document Flow)
  // -------------------------------------------------------------
  function renderTajweed() {
    if (!tajweedList || tajweedCollection.length === 0) return;
    const isUr = singleLangMode === 'UR';
    const docTitle = isUr ? 'علمِ تجوید: بنیادی قواعد و مخارج' : 'Tajweed: Core Rules & Articulation Points';

    const sectionsHtml = tajweedCollection.map((item, idx) => {
      const secNum = idx + 1;
      const title = isUr ? item.titleUr : item.titleEn;
      const topic = isUr ? item.topicUr : item.topicEn;
      const points = isUr ? item.pointsUr : item.pointsEn;
      
      let topicHtml = topic ? `<div class="doc-topic"><p>${topic}</p></div>` : '';

      let pointsHtml = '';
      if (points && points.length > 0) {
        if (item.isOrdered) {
          pointsHtml = `
            <ol class="doc-ordered-list">
              ${points.map(pt => `<li class="doc-ordered-item">${pt}</li>`).join('')}
            </ol>
          `;
        } else {
          pointsHtml = `
            <ul class="doc-points-list">
              ${points.map(pt => `<li class="doc-point-item">${pt}</li>`).join('')}
            </ul>
          `;
        }
      }

      let examplesHtml = '';
      if (item.examples && item.examples.length > 0) {
        const exTitle = isUr ? 'قرآنی امثلہ و تطبیق:' : 'Quranic Examples & Practice:';
        examplesHtml = `
          <div class="doc-examples-block">
            <span class="doc-examples-label">${exTitle}</span>
            <div class="doc-examples-flow">
              ${item.examples.map(ex => {
                const note = isUr ? (ex.noteUr || ex.noteEn || '') : (ex.noteEn || ex.noteUr || '');
                return `
                  <div class="doc-example-row">
                    <span class="doc-ex-ar font-ar" dir="rtl" lang="ar">${ex.ar}</span>
                    <span class="doc-ex-sep">—</span>
                    <span class="doc-ex-note">${note}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      return `
        <section class="doc-section" id="tajweed-sec-${secNum}">
          <header class="doc-section-header">
            <h2 class="doc-sec-title">${title}</h2>
          </header>
          <div class="doc-section-body">
            ${topicHtml}
            ${pointsHtml}
            ${examplesHtml}
          </div>
        </section>
      `;
    }).join('<hr class="doc-divider">');

    tajweedList.innerHTML = `
      <article class="doc-sheet ${isUr ? 'doc-rtl' : 'doc-ltr'}" dir="${isUr ? 'rtl' : 'ltr'}">
        <header class="doc-header simple-doc-header">
          <h1 class="doc-title">${docTitle}</h1>
        </header>
        <div class="doc-content-flow">
          ${sectionsHtml}
        </div>
      </article>
    `;
  }

  // -------------------------------------------------------------
  // 9. Translations View (Under Construction State)
  // -------------------------------------------------------------
  function renderAyahs() {
    if (!ayahsList) return;
    const isUr = singleLangMode === 'UR';

    const titleText = isUr ? 'قرآنی آیات اور تراجم' : 'Quranic Verse Translations & Slices';
    const headingText = isUr ? 'یہ ماڈیول تیاری کے مراحل میں ہے' : 'Translations Module Under Development';
    const descText = isUr ? 
      'قرآنی آیات اور الفاظ کے تراجم کا مستند اندراج اور تصدیق کا عمل جاری ہے۔ جلد ہی تمام درسی اسباق کے لفظی و بامحاورہ تراجم یہاں دستیاب ہوں گے۔' : 
      'This module is currently being compiled and verified against authentic curriculum sources. Sliced phrase breakdowns and verified translations will be released here.';
    const badgeText = isUr ? 'زیرِ تعمیر' : 'Under Construction';

    ayahsList.innerHTML = `
      <article class="doc-sheet ${isUr ? 'doc-rtl' : 'doc-ltr'}" dir="${isUr ? 'rtl' : 'ltr'}">
        <header class="doc-header simple-doc-header">
          <h1 class="doc-title">${titleText}</h1>
        </header>
        <div class="empty-state">
          <span class="under-construction-badge">${badgeText}</span>
          <div class="empty-state-text">${headingText}</div>
          <div class="empty-state-hint">${descText}</div>
        </div>
      </article>
    `;
  }

  // -------------------------------------------------------------
  // 10. Search Event Handling (Words View)
  // -------------------------------------------------------------
  function initSearchEvents() {
    if (!searchInput) return;
    let debounceTimer;

    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = val.length > 0 ? 'inline-flex' : 'none';
      }

      if (val.length > 0 && activeLetter !== 'ALL') {
        activeLetter = 'ALL';
        document.querySelectorAll('.letter-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-letter') === 'ALL');
        });
      }

      scrollToTopIfScrolled();

      debounceTimer = setTimeout(() => {
        searchQuery = val;
        renderWords();
      }, 80);
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        scrollToTopIfScrolled();
        renderWords();
      });
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (outlineModal && outlineModal.classList.contains('open')) {
          closeOutlineModal();
          return;
        }
        if (document.activeElement === searchInput) {
          searchInput.value = '';
          searchQuery = '';
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          searchInput.blur();
          scrollToTopIfScrolled();
          renderWords();
        }
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && outlineModal && !outlineModal.classList.contains('open')) {
        e.preventDefault();
        if (activeTab === 'words') {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  // -------------------------------------------------------------
  // 11. Course Outline Modal Handlers
  // -------------------------------------------------------------
  function openOutlineModal() {
    if (!outlineModal) return;
    outlineModal.classList.add('open');
    outlineModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeOutlineModal() {
    if (!outlineModal) return;
    outlineModal.classList.remove('open');
    outlineModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initOutlineModal() {
    if (outlineToggleBtn) {
      outlineToggleBtn.addEventListener('click', openOutlineModal);
    }
    if (outlineCloseBtn) {
      outlineCloseBtn.addEventListener('click', closeOutlineModal);
    }
    if (outlineModal) {
      outlineModal.addEventListener('click', e => {
        if (e.target === outlineModal) {
          closeOutlineModal();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // 12. Theme Toggle (Dark / Light)
  // -------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem('mq_theme') || 'light';
    applyTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('mq_theme', next);
      });
    }
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeToggleBtn) themeToggleBtn.textContent = 'Light';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeToggleBtn) themeToggleBtn.textContent = 'Dark';
    }
  }

  // -------------------------------------------------------------
  // 13. Floating Back to Top Button
  // -------------------------------------------------------------
  function initBackToTop() {
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // -------------------------------------------------------------
  // 14. Mobile Swipe Gestures
  // -------------------------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  function initSwipeGestures() {
    const mainContainer = document.querySelector('.container') || document.body;

    mainContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('#alphabetBar') || e.target.closest('.modal-backdrop') || e.target.closest('.filter-select')) {
        return;
      }
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    mainContainer.addEventListener('touchend', (e) => {
      if (e.target.closest('#alphabetBar') || e.target.closest('.modal-backdrop') || e.target.closest('.filter-select')) {
        return;
      }
      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Swipe left -> Next tab
        if (currentIndex < TAB_ORDER.length - 1) {
          switchTab(TAB_ORDER[currentIndex + 1]);
        }
      } else {
        // Swipe right -> Previous tab
        if (currentIndex > 0) {
          switchTab(TAB_ORDER[currentIndex - 1]);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 15. Bootstrap Application
  // -------------------------------------------------------------
  function init() {
    initTheme();
    initLanguageToggles();
    initTabs();
    initSwipeGestures();
    initAlphabetBar();
    initRuleFilters();
    initSearchEvents();
    initOutlineModal();
    initBackToTop();
    renderWords(); // Defaults directly to Words view
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
