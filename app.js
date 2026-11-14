/**
 * Quranic Arabic Companion - Application Logic
 * High-performance, diacritic-tolerant search across 800+ base vocabulary words, 31 grammar rules, and Tajweed
 * Tab arrangement: 1. Tajweed, 2. Rules, 3. Words (Words tab active on load)
 * Strict tri-script typography: Amiri (Arabic), Gulzar (Urdu), Inter (English)
 * Permanent bilingual view on Words tab: Urdu meaning on top, English translation below
 * Zero emojis, zero external institution or author mentions
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // State
  // -------------------------------------------------------------
  let activeTab = 'rules'; // 'rules' (pushed Units 1 & 2) | 'words' | 'tajweed' | 'ayahs'
  let activeLetter = 'ALL';
  let singleLangMode = 'UR'; // Rules, Tajweed & Translations mode: 'UR' | 'EN'
  let searchQuery = '';
  let activeRuleUnit = 1; // 1 to 5 (Unit-scoped rules architecture)
  let activeRuleId = 'ALL'; // 'ALL' (all rules in active unit) | specific rule ID
  let rulesDisplayMode = 'all'; // 'all' (continuous unit document) | 'lesson' (single rule)
  let activeAyahUnit = '2'; // '1' to '5' (Default '2')
  let activeAyahLesson = '1'; // '1' to max lessons for active unit

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const urduNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  function toUrduDigits(n) {
    return String(n).replace(/[0-9]/g, d => urduNumerals[parseInt(d, 10)]);
  }

  const UNIT_LESSON_COUNTS = {
    '1': 19,
    '2': 13,
    '3': 10,
    '4': 18,
    '5': 23
  };

  function getMaxLessonsForUnit(unit) {
    return UNIT_LESSON_COUNTS[unit.toString()] || 13;
  }

  // -------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------
  const tabTajweedBtn = document.getElementById('tabTajweedBtn');
  const tabRulesBtn = document.getElementById('tabRulesBtn');
  const tabWordsBtn = document.getElementById('tabWordsBtn');
  const tabAyahsBtn = document.getElementById('tabAyahsBtn');
  
  const viewTajweed = document.getElementById('viewTajweed');
  const viewRules = document.getElementById('viewRules');
  const viewWords = document.getElementById('viewWords');
  const viewAyahs = document.getElementById('viewAyahs');
  
  const tajweedList = document.getElementById('tajweedList');
  const rulesList = document.getElementById('rulesList');
  const ruleUnitBar = document.getElementById('ruleUnitBar');
  const ruleSelect = document.getElementById('ruleSelect');
  const ruleCountDisplay = document.getElementById('ruleCountDisplay');
  const ruleFilterRow = document.getElementById('ruleFilterRow');
  const ruleSelectLabel = document.getElementById('ruleSelectLabel');

  // Translations Elements
  const ayahsList = document.getElementById('ayahsList');
  const ayahUnitSelect = document.getElementById('ayahUnitSelect');
  const ayahLessonSelect = document.getElementById('ayahLessonSelect');
  const ayahUnitLabel = document.getElementById('ayahUnitLabel');
  const ayahLessonLabel = document.getElementById('ayahLessonLabel');
  const ayahFilterRow = document.getElementById('ayahFilterRow');

  // Words View Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const alphabetBar = document.getElementById('alphabetBar');
  const dictionaryList = document.getElementById('dictionaryList');
  const wordCountDisplay = document.getElementById('wordCount');

  // Header Controls
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const langSwitcher = document.getElementById('langSwitcher');
  const toggleUrduBtn = document.getElementById('toggleUrduBtn');
  const toggleEnglishBtn = document.getElementById('toggleEnglishBtn');
  
  // Modal Elements
  const outlineToggleBtn = document.getElementById('outlineToggleBtn');
  const outlineModal = document.getElementById('outlineModal');
  const outlineCloseBtn = document.getElementById('outlineCloseBtn');
  
  const backToTopBtn = document.getElementById('backToTopBtn');

  // Arabic Alphabet list for Words filter bar
  const ARABIC_ALPHABET = [
    'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 
    'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 
    'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  ];

  // -------------------------------------------------------------
  // 1. Normalization Helpers
  // -------------------------------------------------------------
  function normalizeArabic(str) {
    if (!str) return '';
    return str
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // strip tashkeel
      .replace(/[إأآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .trim();
  }

  function normalizeEnglish(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[āáàâä]/g, 'a')
      .replace(/[īíìîï]/g, 'i')
      .replace(/[ūúùûü]/g, 'u')
      .replace(/[ḍḏ]/g, 'd')
      .replace(/[ṭ]/g, 't')
      .replace(/[ṣ]/g, 's')
      .replace(/[ẓ]/g, 'z')
      .replace(/[ḥ]/g, 'h')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  // -------------------------------------------------------------
  // 2. Tab Navigation
  // -------------------------------------------------------------
  function switchTab(newTab) {
    activeTab = newTab;

    // Button states
    if (tabTajweedBtn) tabTajweedBtn.classList.toggle('active', activeTab === 'tajweed');
    if (tabRulesBtn) tabRulesBtn.classList.toggle('active', activeTab === 'rules');
    if (tabWordsBtn) tabWordsBtn.classList.toggle('active', activeTab === 'words');
    if (tabAyahsBtn) tabAyahsBtn.classList.toggle('active', activeTab === 'ayahs');

    if (tabTajweedBtn) tabTajweedBtn.setAttribute('aria-selected', activeTab === 'tajweed');
    if (tabRulesBtn) tabRulesBtn.setAttribute('aria-selected', activeTab === 'rules');
    if (tabWordsBtn) tabWordsBtn.setAttribute('aria-selected', activeTab === 'words');
    if (tabAyahsBtn) tabAyahsBtn.setAttribute('aria-selected', activeTab === 'ayahs');

    // View panels
    if (viewTajweed) viewTajweed.style.display = activeTab === 'tajweed' ? 'block' : 'none';
    if (viewRules) viewRules.style.display = activeTab === 'rules' ? 'block' : 'none';
    if (viewWords) viewWords.style.display = activeTab === 'words' ? 'block' : 'none';
    if (viewAyahs) viewAyahs.style.display = activeTab === 'ayahs' ? 'block' : 'none';

    // Language switcher visibility: Hidden on Words (permanently bilingual), visible on Translations, Rules and Tajweed
    if (langSwitcher) {
      langSwitcher.style.display = activeTab === 'words' ? 'none' : 'inline-flex';
    }

    // Render corresponding view
    if (activeTab === 'words') {
      renderWords();
    } else if (activeTab === 'rules') {
      populateRuleSelect();
      renderRules();
    } else if (activeTab === 'tajweed') {
      renderTajweed();
    } else if (activeTab === 'ayahs') {
      populateAyahLessonsForUnit(activeAyahUnit);
      renderAyahs();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // -------------------------------------------------------------
  // 3. Course Outline Modal Handlers
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

  // -------------------------------------------------------------
  // 4. Words Tab Logic
  // -------------------------------------------------------------
  function buildAlphabetBar() {
    if (!alphabetBar) return;
    alphabetBar.innerHTML = '';

    // 'ALL' pill
    const allBtn = document.createElement('button');
    allBtn.className = `alpha-pill ${activeLetter === 'ALL' ? 'active' : ''}`;
    allBtn.textContent = 'All';
    allBtn.setAttribute('aria-label', 'Show all letters');
    allBtn.addEventListener('click', () => {
      activeLetter = 'ALL';
      document.querySelectorAll('.alpha-pill').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      renderWords();
    });
    alphabetBar.appendChild(allBtn);

    // Letter pills
    ARABIC_ALPHABET.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = `alpha-pill ${activeLetter === letter ? 'active' : ''}`;
      btn.textContent = letter;
      btn.setAttribute('aria-label', `Filter by letter ${letter}`);
      btn.addEventListener('click', () => {
        activeLetter = letter;
        document.querySelectorAll('.alpha-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderWords();
      });
      alphabetBar.appendChild(btn);
    });
  }

  function getWordsCollection() {
    if (typeof WORDS_DATA !== 'undefined' && Array.isArray(WORDS_DATA)) return WORDS_DATA;
    if (typeof DICTIONARY_WORDS !== 'undefined' && Array.isArray(DICTIONARY_WORDS)) return DICTIONARY_WORDS;
    if (typeof window !== 'undefined') {
      if (window.WORDS_DATA && Array.isArray(window.WORDS_DATA)) return window.WORDS_DATA;
      if (window.DICTIONARY_WORDS && Array.isArray(window.DICTIONARY_WORDS)) return window.DICTIONARY_WORDS;
    }
    return [];
  }

  function getRulesCollection() {
    if (typeof RULES_DATA !== 'undefined' && Array.isArray(RULES_DATA)) return RULES_DATA;
    if (typeof window !== 'undefined' && window.RULES_DATA && Array.isArray(window.RULES_DATA)) return window.RULES_DATA;
    if (typeof GRAMMAR_RULES !== 'undefined' && Array.isArray(GRAMMAR_RULES)) return GRAMMAR_RULES;
    if (typeof window !== 'undefined' && window.GRAMMAR_RULES && Array.isArray(window.GRAMMAR_RULES)) return window.GRAMMAR_RULES;
    return [];
  }

  function getTajweedCollection() {
    if (typeof TAJWEED_DATA !== 'undefined' && Array.isArray(TAJWEED_DATA)) return TAJWEED_DATA;
    if (typeof window !== 'undefined' && window.TAJWEED_DATA && Array.isArray(window.TAJWEED_DATA)) return window.TAJWEED_DATA;
    return [];
  }

  function getTranslationsCollection() {
    if (typeof TRANSLATIONS_DATA !== 'undefined' && Array.isArray(TRANSLATIONS_DATA)) return TRANSLATIONS_DATA;
    if (typeof QURANIC_AYAHS !== 'undefined' && Array.isArray(QURANIC_AYAHS)) return QURANIC_AYAHS;
    if (typeof window !== 'undefined') {
      if (window.TRANSLATIONS_DATA && Array.isArray(window.TRANSLATIONS_DATA)) return window.TRANSLATIONS_DATA;
      if (window.QURANIC_AYAHS && Array.isArray(window.QURANIC_AYAHS)) return window.QURANIC_AYAHS;
    }
    return [];
  }

  function filterWords() {
    const allWords = getWordsCollection();
    if (!allWords || allWords.length === 0) return [];

    let filtered = allWords;

    // Filter by Alphabet Letter
    if (activeLetter !== 'ALL') {
      filtered = filtered.filter(w => {
        if (!w.letter) return false;
        if (activeLetter === 'أ') {
          return w.letter === 'أ' || (w.cleanAr && w.cleanAr.startsWith('ا'));
        }
        const lNorm = (w.letter || '').replace(/[\u0640]/g, '');
        const aNorm = activeLetter.replace(/[\u0640]/g, '');
        return lNorm === aNorm;
      });
    }

    // Filter by Universal Search Query
    if (searchQuery) {
      const qNormAr = normalizeArabic(searchQuery);
      const qNormEn = normalizeEnglish(searchQuery);
      const qLower = searchQuery.toLowerCase().trim();

      filtered = filtered.filter(w => {
        // Arabic exact & diacritic-tolerant match
        if (w.ar && w.ar.includes(searchQuery)) return true;
        if (w.cleanAr && w.cleanAr.includes(qNormAr)) return true;

        // Transliteration match
        if (w.cleanTr && w.cleanTr.includes(qNormEn)) return true;
        if (w.tr && w.tr.toLowerCase().includes(qLower)) return true;

        // English translation match
        if (w.cleanEn && w.cleanEn.includes(qNormEn)) return true;
        if (w.en && w.en.toLowerCase().includes(qLower)) return true;

        // Urdu translation match
        if (w.ur && w.ur.includes(searchQuery)) return true;

        return false;
      });
    }

    return filtered;
  }

  function renderWords() {
    if (!dictionaryList) return;

    const words = filterWords();
    const count = words.length;

    if (wordCountDisplay) {
      if (searchQuery) {
        wordCountDisplay.textContent = `Found ${count} word${count === 1 ? '' : 's'}`;
      } else if (activeLetter !== 'ALL') {
        wordCountDisplay.textContent = `${count} word${count === 1 ? '' : 's'} under letter ${activeLetter}`;
      } else {
        wordCountDisplay.textContent = `All ${count} Vocabulary Words`;
      }
    }

    if (words.length === 0) {
      const allWords = getWordsCollection();
      if (!allWords || allWords.length === 0) {
        dictionaryList.innerHTML = `
          <div class="empty-state">
            <div class="under-construction-badge">Under Construction</div>
            <div class="empty-state-text">Under Construction</div>
            <div class="empty-state-hint">Vocabulary lexicon dataset is currently under construction.</div>
          </div>
        `;
        return;
      }
      dictionaryList.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">No matching words found</p>
          <p class="empty-sub">Try searching without diacritics or browse by alphabetical letter.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    words.forEach(w => {
      const card = document.createElement('article');

      let posClass = 'is-noun';
      let badgeClass = 'badge-noun';
      let badgeText = 'Noun';

      if (w.cat.includes('حَرْف')) {
        posClass = 'is-part';
        badgeClass = 'badge-part';
        badgeText = 'Particle';
      } else if (w.cat.includes('عَلَم')) {
        posClass = 'is-prop';
        badgeClass = 'badge-prop';
        badgeText = 'Proper Noun';
      } else if (w.cat.includes('فِعْل')) {
        posClass = 'is-verb';
        badgeClass = 'badge-verb';
        badgeText = 'Verb';
      } else if (w.cat.includes('صِفَة')) {
        posClass = 'is-adj';
        badgeClass = 'badge-adj';
        badgeText = 'Adjective';
      } else if (w.cat.includes('ظَرْف')) {
        posClass = 'is-part';
        badgeClass = 'badge-part';
        badgeText = 'Adverb';
      } else if (w.cat.includes('ضَمِير')) {
        posClass = 'is-noun';
        badgeClass = 'badge-noun';
        badgeText = 'Pronoun';
      } else {
        posClass = 'is-noun';
        badgeClass = 'badge-noun';
        badgeText = 'Noun';
      }

      card.className = `dict-card ${posClass}`;
      card.setAttribute('tabindex', '0');

      const formattedIdx = String(w.idx).padStart(3, '0');

      card.innerHTML = `
        <div class="card-blend-top">
          <div class="card-blend-right">
            <span class="card-idx">${formattedIdx}</span>
            <div class="card-arabic" dir="rtl" title="${w.ar}">${w.ar}</div>
          </div>
          <div class="card-blend-left">
            <span class="card-tr">${w.tr}</span>
            <span class="card-badge ${badgeClass}">${badgeText}</span>
          </div>
        </div>
        <div class="card-meanings-row">
          <div class="meaning-urdu" dir="rtl">${w.ur}</div>
          <div class="meaning-en">${w.en || ''}</div>
        </div>
      `;

      fragment.appendChild(card);
    });

    dictionaryList.innerHTML = '';
    dictionaryList.appendChild(fragment);
  }

  // -------------------------------------------------------------
  // 4b. Translations (Ayahs & Slices Practice) Logic
  // -------------------------------------------------------------
  function getFilteredAyahs() {
    const all = getTranslationsCollection();
    if (!all || all.length === 0) return [];
    return all.filter(a => {
      if (a.unit.toString() !== activeAyahUnit) return false;
      if (a.lesson.toString() !== activeAyahLesson) return false;
      return true;
    });
  }

  function createAyahCard(a, idx) {
    const card = document.createElement('article');
    const isSlice = a.isSlice === true;
    const isUr = singleLangMode === 'UR';
    card.className = isSlice ? 'ayah-card slice-card' : 'ayah-card';
    card.setAttribute('dir', isUr ? 'rtl' : 'ltr');

    const sliceDividerHtml = ' <span class="slice-divider">/</span> ';
    let arabicHtml = '';
    let meaningText = '';

    if (a.chunks && a.chunks.length > 0) {
      const arSegments = a.chunks.map((c, cIdx) => 
        `<span class="chunk-seg chunk-${cIdx % 6}">${c.ar}</span>`
      );
      arabicHtml = arSegments.join(isSlice ? sliceDividerHtml : ' ');

      if (singleLangMode === 'UR') {
        const urSegments = a.chunks.map((c, cIdx) => 
          `<span class="chunk-seg chunk-${cIdx % 6}">${c.ur}</span>`
        );
        meaningText = urSegments.join(isSlice ? sliceDividerHtml : ' ');
      } else {
        const enSegments = a.chunks.map((c, cIdx) => 
          `<span class="chunk-seg chunk-${cIdx % 6}">${c.en}</span>`
        );
        meaningText = enSegments.join(isSlice ? sliceDividerHtml : ' ');
      }
    } else {
      arabicHtml = isSlice && a.arabic && a.arabic.includes('/')
        ? a.arabic.split(/\s*\/\s*/).join(sliceDividerHtml)
        : a.arabic;

      if (singleLangMode === 'UR') {
        meaningText = isSlice && a.urdu && a.urdu.includes('/')
          ? a.urdu.split(/\s*\/\s*/).join(sliceDividerHtml)
          : (a.urdu || '');
      } else {
        meaningText = isSlice && a.en && a.en.includes('/')
          ? a.en.split(/\s*\/\s*/).join(sliceDividerHtml)
          : (a.en || '');
      }
    }

    let meaningsHtml = '';
    let meaningsBoxClass = 'ayah-meanings';

    if (singleLangMode === 'UR') {
      meaningsHtml = `<div class="meaning-urdu" dir="rtl">${meaningText}</div>`;
    } else {
      meaningsBoxClass += ' single-en';
      meaningsHtml = `<div class="meaning-en">${meaningText}</div>`;
    }

    // Zero pill labels per user specification: clean presentation
    card.innerHTML = `
      <div class="ayah-arabic font-ar" dir="rtl" lang="ar">
        ${arabicHtml}
      </div>
      <div class="${meaningsBoxClass}">
        ${meaningsHtml}
      </div>
    `;

    return card;
  }

  function renderAyahs() {
    if (!ayahsList) return;
    const isUr = singleLangMode === 'UR';
    const allTranslations = getTranslationsCollection();
    if (!allTranslations || allTranslations.length === 0) {
      ayahsList.innerHTML = `
        <div class="empty-state">
          <div class="under-construction-badge">Under Construction</div>
          <div class="empty-state-text">Under Construction</div>
          <div class="empty-state-hint">${isUr ? 'قرآنی ترجمہ و تمرین کا ڈیٹا فی الحال زیرِ تدوین ہے' : 'Translations and practice verses dataset is currently under construction.'}</div>
        </div>
      `;
      return;
    }
    const filtered = getFilteredAyahs();

    if (filtered.length === 0) {
      ayahsList.innerHTML = `
        <div class="empty-state">
          <div class="under-construction-badge">Under Construction</div>
          <div class="empty-state-text">Under Construction</div>
          <div class="empty-state-hint">${isUr ? 'اس سبق کی قرآنی آیات زیرِ تدوین ہیں' : 'Practice verses for this lesson are currently under construction.'}</div>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    // Appended in the EXACT array order from dataset (preserves textbook sequence!)
    filtered.forEach((a, idx) => {
      fragment.appendChild(createAyahCard(a, idx));
    });

    // Lesson Next / Previous Navigation Footer
    const totalLessons = getMaxLessonsForUnit(activeAyahUnit);
    const curLessonNum = parseInt(activeAyahLesson, 10);
    const prevDisabled = curLessonNum <= 1 ? 'disabled' : '';
    const nextDisabled = curLessonNum >= totalLessons ? 'disabled' : '';

    const prevText = isUr ? 'پچھلا سبق →' : '← Previous Lesson';
    const nextText = isUr ? '← اگلا سبق' : 'Next Lesson →';
    const counterText = isUr 
      ? `\u200Fسبق ${toUrduDigits(curLessonNum)} از ${toUrduDigits(totalLessons)}` 
      : `Lesson ${curLessonNum} of ${totalLessons}`;

    const footer = document.createElement('footer');
    footer.className = `ayah-lesson-footer ${isUr ? 'doc-rtl' : 'doc-ltr'}`;
    footer.setAttribute('dir', isUr ? 'rtl' : 'ltr');
    footer.innerHTML = `
      <button id="ayahPrevLessonBtn" class="ayah-nav-action-btn btn-nav-prev" ${prevDisabled} title="${isUr ? 'پچھلا سبق' : 'Previous Lesson'}">
        ${prevText}
      </button>
      <span class="ayah-counter-badge">${counterText}</span>
      <button id="ayahNextLessonBtn" class="ayah-nav-action-btn btn-nav-next" ${nextDisabled} title="${isUr ? 'اگلا سبق' : 'Next Lesson'}">
        ${nextText}
      </button>
    `;

    fragment.appendChild(footer);

    ayahsList.innerHTML = '';
    ayahsList.appendChild(fragment);

    // Attach footer event listeners
    const prevBtn = document.getElementById('ayahPrevLessonBtn');
    const nextBtn = document.getElementById('ayahNextLessonBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (curLessonNum > 1) {
          activeAyahLesson = (curLessonNum - 1).toString();
          if (ayahLessonSelect) ayahLessonSelect.value = activeAyahLesson;
          renderAyahs();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (curLessonNum < totalLessons) {
          activeAyahLesson = (curLessonNum + 1).toString();
          if (ayahLessonSelect) ayahLessonSelect.value = activeAyahLesson;
          renderAyahs();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  function populateAyahLessonsForUnit(unit) {
    if (!ayahLessonSelect) return;
    const isUr = singleLangMode === 'UR';
    const totalLessons = getMaxLessonsForUnit(unit);
    const previousVal = ayahLessonSelect.value;
    ayahLessonSelect.innerHTML = '';

    for (let i = 1; i <= totalLessons; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.textContent = isUr ? `\u200Fسبق ${toUrduDigits(i)}` : `Lesson ${i}`;
      ayahLessonSelect.appendChild(opt);
    }

    if (previousVal && parseInt(previousVal, 10) <= totalLessons) {
      ayahLessonSelect.value = previousVal;
      activeAyahLesson = previousVal;
    } else {
      ayahLessonSelect.value = '1';
      activeAyahLesson = '1';
    }
  }

  // -------------------------------------------------------------
  // 5. Grammar Rules Tab Logic (Unit-Scoped Architecture)
  // -------------------------------------------------------------
  function populateRuleSelect() {
    if (!ruleSelect) return;
    const allRules = getRulesCollection();
    if (!allRules || allRules.length === 0) return;
    const isUr = singleLangMode === 'UR';
    const unitRules = allRules.filter(r => r.unit === activeRuleUnit);

    // Update Unit Pills active state and bilingual labels
    if (ruleUnitBar) {
      const pills = ruleUnitBar.querySelectorAll('.rule-unit-pill');
      pills.forEach(pill => {
        const uNum = parseInt(pill.getAttribute('data-unit'), 10);
        const isActive = uNum === activeRuleUnit;
        pill.classList.toggle('active', isActive);
        pill.setAttribute('aria-selected', isActive ? 'true' : 'false');

        const uRules = allRules.filter(r => r.unit === uNum);
        const titleSpan = pill.querySelector('.unit-pill-title');
        const badgeSpan = pill.querySelector('.rule-unit-badge');
        if (titleSpan) {
          titleSpan.textContent = isUr ? `یونٹ ${toUrduDigits(uNum)}` : `Unit ${uNum}`;
          if (isUr) titleSpan.classList.add('font-urdu');
          else titleSpan.classList.remove('font-urdu');
        }
        if (badgeSpan) {
          badgeSpan.textContent = isUr ? toUrduDigits(uRules.length) : uRules.length.toString();
        }
      });
    }

    // Populate ruleSelect options scoped strictly to active unit
    const allLabel = isUr 
      ? `تمام قواعد یونٹ ${toUrduDigits(activeRuleUnit)} (${toUrduDigits(unitRules.length)})`
      : `All Unit ${activeRuleUnit} Rules (${unitRules.length} Rules)`;
    
    ruleSelect.innerHTML = `<option value="ALL">${allLabel}</option>`;

    unitRules.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      const lessonLabel = isUr
        ? `سبق ${toUrduDigits(r.lesson)}: ${r.operator} — ${r.titleUr}`
        : `Lesson ${r.lesson}: ${r.operatorTr} — ${r.titleEn}`;
      opt.textContent = lessonLabel;
      ruleSelect.appendChild(opt);
    });

    ruleSelect.value = rulesDisplayMode === 'all' ? 'ALL' : activeRuleId;

    if (ruleCountDisplay) {
      ruleCountDisplay.textContent = isUr 
        ? `${toUrduDigits(unitRules.length)} قواعد (یونٹ ${toUrduDigits(activeRuleUnit)})`
        : `${unitRules.length} Rules (Unit ${activeRuleUnit})`;
    }
  }

  function renderRules() {
    if (!rulesList) return;
    const allRules = getRulesCollection();
    const isUr = singleLangMode === 'UR';
    if (!allRules || allRules.length === 0) {
      rulesList.innerHTML = `
        <div class="empty-state">
          <div class="under-construction-badge">Under Construction</div>
          <div class="empty-state-text">Under Construction</div>
          <div class="empty-state-hint">${isUr ? 'قواعد کا ڈیٹا فی الحال زیرِ تدوین ہے' : 'Grammar rules dataset is currently under construction.'}</div>
        </div>
      `;
      return;
    }
    const unitRules = allRules.filter(r => r.unit === activeRuleUnit);
    if (!unitRules || unitRules.length === 0) {
      const unitLabel = isUr ? `یونٹ ${toUrduDigits(activeRuleUnit)}` : `Unit ${activeRuleUnit}`;
      rulesList.innerHTML = `
        <div class="empty-state">
          <div class="under-construction-badge">Under Construction</div>
          <div class="empty-state-text">Under Construction</div>
          <div class="empty-state-hint">${isUr ? `${unitLabel} کے قواعد فی الحال زیرِ تدوین ہیں` : `${unitLabel} grammar rules are currently under construction.`}</div>
        </div>
      `;
      return;
    }

    if (ruleSelect) {
      ruleSelect.value = rulesDisplayMode === 'all' ? 'ALL' : activeRuleId;
    }

    function buildRuleCard(r, idxInUnit, isIsland, totalInUnit) {
      const title = isUr ? r.titleUr : r.titleEn;
      const effect = isUr ? r.caseEffectUr : r.caseEffectEn;
      const exp = isUr ? r.explanationUr : r.explanationEn;
      const formulaLabel = isUr ? 'نحوی قاعدہ / ساخت:' : 'Syntactic Formula / Pattern:';
      const meaningLabel = isUr ? 'بنیادی مفہوم:' : 'Primary Meaning:';
      const meaningText = isUr ? r.primaryMeaningUr : r.primaryMeaningEn;

      // Sub-rules
      let subRulesHtml = '';
      if (r.subRules && r.subRules.length > 0) {
        const subTitle = isUr ? 'اہم ذیلی قواعد اور نحوی نکات:' : 'Lesson Sub-Rules & Syntactic Points:';
        const subCards = r.subRules.map(sr => `
          <div class="subrule-card ${isUr ? 'is-urdu' : 'is-english'}" dir="${isUr ? 'rtl' : 'ltr'}">
            <h4 class="subrule-title ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">${isUr ? sr.titleUr : sr.titleEn}</h4>
            <p class="subrule-text ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">${isUr ? sr.textUr : sr.textEn}</p>
          </div>
        `).join('');

        subRulesHtml = `
          <div class="rule-subrules-wrapper">
            <div class="section-label ${isUr ? 'font-urdu' : ''}">${subTitle}</div>
            <div class="subrules-grid">${subCards}</div>
          </div>
        `;
      }

      // Examples
      let examplesHtml = '';
      if (r.examples && r.examples.length > 0) {
        const exTitle = isUr ? 'قرآنی و نحوی مثالیں:' : 'Quranic & Pedagogical Examples:';
        const rows = r.examples.map(ex => `
          <div class="example-row ${isUr ? 'is-urdu' : 'is-english'}" dir="${isUr ? 'rtl' : 'ltr'}">
            <div class="example-ar" dir="rtl" lang="ar">${ex.ar}</div>
            <div class="example-trans ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">
              ${isUr ? ex.ur : ex.en}
            </div>
          </div>
        `).join('');

        examplesHtml = `
          <div class="rule-examples-wrapper">
            <div class="section-label ${isUr ? 'font-urdu' : ''}">${exTitle}</div>
            <div class="examples-list">${rows}</div>
          </div>
        `;
      }

      // Island view controls
      let islandNavHtml = '';
      if (isIsland) {
        islandNavHtml = `
          <div class="island-nav-bar">
            <button class="island-nav-btn prev-rule-btn" ${idxInUnit === 0 ? 'disabled' : ''}>${isUr ? 'پچھلا سبق' : 'Previous Lesson'}</button>
            <button class="island-nav-btn view-all-unit-btn">${isUr ? 'یونٹ کے تمام قواعد دیکھیں' : 'View All Unit Rules'}</button>
            <button class="island-nav-btn next-rule-btn" ${idxInUnit === totalInUnit - 1 ? 'disabled' : ''}>${isUr ? 'اگلا سبق' : 'Next Lesson'}</button>
          </div>
        `;
      }

      const lessonBadgeText = isUr ? `سبق ${toUrduDigits(r.lesson)}` : `Lesson ${r.lesson}`;
      const unitBadgeText = isUr ? `یونٹ ${toUrduDigits(r.unit)}` : `Unit ${r.unit}`;

      return `
        <article class="rule-master-card ${isUr ? 'is-urdu' : 'is-english'}" id="rule-${r.id}" dir="${isUr ? 'rtl' : 'ltr'}">
          <header class="rule-card-header">
            <div class="rule-header-left">
              <span class="rule-lesson-pill">${unitBadgeText} · ${lessonBadgeText}</span>
              <span class="rule-id-badge">${r.id}</span>
              <span class="rule-op-badge" dir="rtl" lang="ar">${Array.isArray(r.operator) ? r.operator.join(' ') : r.operator}</span>
              <span class="rule-op-tr">${r.operatorTr}</span>
            </div>
            <div class="rule-header-right">
              <span class="rule-role-tag">${r.arabicRole || ''}</span>
            </div>
          </header>

          <h2 class="rule-main-title ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">
            ${title}
          </h2>

          <div class="rule-specs-grid">
            <div class="spec-card formula-card">
              <span class="spec-label ${isUr ? 'font-urdu' : ''}">${formulaLabel}</span>
              <div class="spec-value formula-text" dir="rtl" lang="ar">${r.formula}</div>
            </div>
            <div class="spec-card effect-card">
              <span class="spec-label ${isUr ? 'font-urdu' : ''}">${isUr ? 'اعرابی اثر:' : 'Case Effect (I\'rab):'}</span>
              <div class="spec-value ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">${effect}</div>
            </div>
          </div>

          <div class="rule-meaning-box ${isUr ? 'is-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">
            <span class="meaning-label ${isUr ? 'font-urdu' : ''}">${meaningLabel}</span>
            <span class="meaning-content ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">${meaningText}</span>
          </div>

          <div class="rule-explanation-box ${isUr ? 'is-urdu' : ''}">
            <p class="rule-exp-text ${isUr ? 'font-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">
              ${exp}
            </p>
          </div>

          ${subRulesHtml}
          ${examplesHtml}
          ${islandNavHtml}
        </article>
      `;
    }

    if (rulesDisplayMode === 'all' || activeRuleId === 'ALL') {
      const uSample = unitRules[0];
      const lessonNums = unitRules.map(r => r.lesson);
      const minL = Math.min(...lessonNums);
      const maxL = Math.max(...lessonNums);
      const rangeText = isUr 
        ? `اسباق ${toUrduDigits(minL)} تا ${toUrduDigits(maxL)} · کل ${toUrduDigits(unitRules.length)} قواعد`
        : `Lessons ${minL}–${maxL} · ${unitRules.length} Rules`;
      
      const unitHeaderHtml = `
        <div class="rules-unit-header-card ${isUr ? 'is-urdu' : ''}" dir="${isUr ? 'rtl' : 'ltr'}">
          <div class="rules-unit-header-top">
            <span class="rules-unit-badge-pill">${isUr ? `یونٹ ${toUrduDigits(activeRuleUnit)}` : `Unit ${activeRuleUnit}`}</span>
            <span class="rules-unit-count-meta">${rangeText}</span>
          </div>
          ${isUr 
            ? `<h2 class="rules-unit-title-ur">${uSample.unitTitleUr}</h2><h3 class="rules-unit-title-en">${uSample.unitTitleEn}</h3>`
            : `<h2 class="rules-unit-title-en">${uSample.unitTitleEn}</h2><h3 class="rules-unit-title-ur">${uSample.unitTitleUr}</h3>`
          }
        </div>
      `;

      const cardsHtml = unitRules.map((r, i) => buildRuleCard(r, i, false, unitRules.length)).join('');
      rulesList.innerHTML = `<div class="rules-all-container">${unitHeaderHtml}${cardsHtml}</div>`;
    } else {
      let activeIdx = unitRules.findIndex(r => r.id === activeRuleId);
      if (activeIdx < 0) {
        activeIdx = 0;
        activeRuleId = unitRules[0].id;
      }
      const activeRule = unitRules[activeIdx];
      rulesList.innerHTML = buildRuleCard(activeRule, activeIdx, true, unitRules.length);

      // Attach Island Navigation listeners
      const prevBtn = rulesList.querySelector('.prev-rule-btn');
      const nextBtn = rulesList.querySelector('.next-rule-btn');
      const viewAllBtn = rulesList.querySelector('.view-all-unit-btn');

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (activeIdx > 0) {
            activeRuleId = unitRules[activeIdx - 1].id;
            rulesDisplayMode = 'lesson';
            populateRuleSelect();
            renderRules();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (activeIdx < unitRules.length - 1) {
            activeRuleId = unitRules[activeIdx + 1].id;
            rulesDisplayMode = 'lesson';
            populateRuleSelect();
            renderRules();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      }

      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
          activeRuleId = 'ALL';
          rulesDisplayMode = 'all';
          populateRuleSelect();
          renderRules();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 6. Tajweed Tab Logic
  // -------------------------------------------------------------
  function renderTajweed() {
    if (!tajweedList) return;
    const tajweedItems = getTajweedCollection();
    const isUr = singleLangMode === 'UR';
    if (!tajweedItems || tajweedItems.length === 0) {
      tajweedList.innerHTML = `
        <div class="empty-state">
          <div class="under-construction-badge">Under Construction</div>
          <div class="empty-state-text">Under Construction</div>
          <div class="empty-state-hint">${isUr ? 'تجوید کا ماڈیول فی الحال زیرِ تدوین ہے' : 'Tajweed module is currently under construction.'}</div>
        </div>
      `;
      return;
    }

    const docTitle = isUr ? 'علمِ تجوید: بنیادی قواعد و مخارج' : 'Tajweed: Core Rules & Articulation Points';

    const sectionsHtml = tajweedItems.map((item, idx) => {
      const secNum = idx + 1;
      const title = isUr ? item.titleUr : item.titleEn;
      const topic = isUr ? item.topicUr : item.topicEn;
      const points = isUr ? (item.pointsUr || []) : (item.pointsEn || []);
      
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
                const note = isUr ? (ex.noteUr || ex.ur || '') : (ex.noteEn || ex.en || '');
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
      <div class="continuous-doc-wrapper">
        <article class="doc-sheet ${isUr ? 'doc-rtl' : 'doc-ltr'}" dir="${isUr ? 'rtl' : 'ltr'}">
          <header class="doc-header">
            <span class="doc-header-tag">${isUr ? 'تجوید کا نصاب' : 'Tajweed Curriculum'}</span>
            <h1 class="doc-title">${docTitle}</h1>
            <p class="doc-subtitle">${isUr ? 'قرآن فہمی کے لیے تجوید کے بنیادی احکام کا جامع خلاصہ' : 'Comprehensive summary of fundamental tajweed rules for Quranic comprehension'}</p>
            <div class="doc-meta-strip">
              <span>${isUr ? 'مستند قواعد' : 'Authorized Rules'}</span>
              <span>•</span>
              <span>${isUr ? 'جامع امثلہ' : 'Practical Quranic Examples'}</span>
              <span>•</span>
              <span>${isUr ? `${toUrduDigits(tajweedItems.length)} ابواب` : `${tajweedItems.length} Core Sections`}</span>
            </div>
          </header>
          <div class="doc-content-flow">
            ${sectionsHtml}
          </div>
        </article>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // 7. Global Event Bindings
  // -------------------------------------------------------------
  function bindEvents() {
    // Tab Clicks
    if (tabTajweedBtn) tabTajweedBtn.addEventListener('click', () => switchTab('tajweed'));
    if (tabRulesBtn) tabRulesBtn.addEventListener('click', () => switchTab('rules'));
    if (tabWordsBtn) tabWordsBtn.addEventListener('click', () => switchTab('words'));
    if (tabAyahsBtn) tabAyahsBtn.addEventListener('click', () => switchTab('ayahs'));

    // Translations Filters (Unit > Lesson strictly, no "All" filter)
    if (ayahUnitSelect) {
      ayahUnitSelect.addEventListener('change', () => {
        activeAyahUnit = ayahUnitSelect.value;
        activeAyahLesson = '1';
        populateAyahLessonsForUnit(activeAyahUnit);
        renderAyahs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (ayahLessonSelect) {
      ayahLessonSelect.addEventListener('change', () => {
        activeAyahLesson = ayahLessonSelect.value;
        renderAyahs();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Search Box
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
        }
        renderWords();
      });

      // Quick shortcut [/]
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (outlineModal && outlineModal.classList.contains('open')) {
            closeOutlineModal();
            return;
          }
          if (document.activeElement === searchInput) {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.style.display = 'none';
            searchInput.blur();
            renderWords();
          }
        } else if (e.key === '/' && document.activeElement !== searchInput && (!outlineModal || !outlineModal.classList.contains('open'))) {
          e.preventDefault();
          if (activeTab !== 'words') switchTab('words');
          searchInput.focus();
          searchInput.select();
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        renderWords();
        searchInput.focus();
      });
    }

    // Rules, Tajweed & Translations Language Toggles
    if (toggleUrduBtn) {
      toggleUrduBtn.addEventListener('click', () => {
        singleLangMode = 'UR';
        toggleUrduBtn.classList.add('active');
        toggleEnglishBtn.classList.remove('active');

        // Localize Translations Labels and Selectors
        if (ayahUnitLabel) ayahUnitLabel.textContent = 'یونٹ';
        if (ayahLessonLabel) ayahLessonLabel.textContent = 'سبق';
        if (ayahFilterRow) ayahFilterRow.setAttribute('dir', 'rtl');
        if (ayahUnitSelect) {
          Array.from(ayahUnitSelect.options).forEach(opt => {
            opt.textContent = `\u200Fیونٹ ${toUrduDigits(opt.value)}`;
          });
        }
        // Localize Rules Controls
        if (ruleSelectLabel) ruleSelectLabel.textContent = 'سبق منتخب کریں:';
        if (ruleFilterRow) ruleFilterRow.setAttribute('dir', 'rtl');

        populateAyahLessonsForUnit(activeAyahUnit);
        populateRuleSelect();

        if (activeTab === 'rules') renderRules();
        if (activeTab === 'tajweed') renderTajweed();
        if (activeTab === 'ayahs') renderAyahs();
      });
    }

    if (toggleEnglishBtn) {
      toggleEnglishBtn.addEventListener('click', () => {
        singleLangMode = 'EN';
        toggleEnglishBtn.classList.add('active');
        toggleUrduBtn.classList.remove('active');

        // Localize Translations Labels and Selectors
        if (ayahUnitLabel) ayahUnitLabel.textContent = 'Unit';
        if (ayahLessonLabel) ayahLessonLabel.textContent = 'Lesson';
        if (ayahFilterRow) ayahFilterRow.setAttribute('dir', 'ltr');
        if (ayahUnitSelect) {
          Array.from(ayahUnitSelect.options).forEach(opt => {
            opt.textContent = `Unit ${opt.value}`;
          });
        }
        // Localize Rules Controls
        if (ruleSelectLabel) ruleSelectLabel.textContent = 'Select Lesson:';
        if (ruleFilterRow) ruleFilterRow.setAttribute('dir', 'ltr');

        populateAyahLessonsForUnit(activeAyahUnit);
        populateRuleSelect();

        if (activeTab === 'rules') renderRules();
        if (activeTab === 'tajweed') renderTajweed();
        if (activeTab === 'ayahs') renderAyahs();
      });
    }

    // Outline Modal Clicks
    if (outlineToggleBtn) outlineToggleBtn.addEventListener('click', openOutlineModal);
    if (outlineCloseBtn) outlineCloseBtn.addEventListener('click', closeOutlineModal);
    if (outlineModal) {
      outlineModal.addEventListener('click', (e) => {
        if (e.target === outlineModal) {
          closeOutlineModal();
        }
      });
    }

    // Unit Pills Navigation
    if (ruleUnitBar) {
      ruleUnitBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.rule-unit-pill');
        if (!pill) return;
        const newUnit = parseInt(pill.getAttribute('data-unit'), 10);
        if (newUnit && newUnit !== activeRuleUnit) {
          activeRuleUnit = newUnit;
          activeRuleId = 'ALL';
          rulesDisplayMode = 'all';
          populateRuleSelect();
          renderRules();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Rules Select Dropdown (Unit-Scoped)
    if (ruleSelect) {
      ruleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'ALL') {
          rulesDisplayMode = 'all';
          activeRuleId = 'ALL';
        } else {
          rulesDisplayMode = 'lesson';
          activeRuleId = val;
        }
        renderRules();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Theme Toggle
    if (themeToggleBtn) {
      const savedTheme = localStorage.getItem('companionTheme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = 'Light';
      }

      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
          document.documentElement.removeAttribute('data-theme');
          themeToggleBtn.textContent = 'Dark';
          localStorage.setItem('companionTheme', 'light');
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          themeToggleBtn.textContent = 'Light';
          localStorage.setItem('companionTheme', 'dark');
        }
      });
    }

    // Back to Top Button
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      });

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // -------------------------------------------------------------
  // 8. Initialization
  // -------------------------------------------------------------
  function init() {
    if (singleLangMode === 'UR') {
      if (ruleSelectLabel) ruleSelectLabel.textContent = 'سبق منتخب کریں:';
      if (ruleFilterRow) ruleFilterRow.setAttribute('dir', 'rtl');
      if (ayahUnitLabel) ayahUnitLabel.textContent = 'یونٹ';
      if (ayahLessonLabel) ayahLessonLabel.textContent = 'سبق';
      if (ayahFilterRow) ayahFilterRow.setAttribute('dir', 'rtl');
    }
    buildAlphabetBar();
    populateRuleSelect();
    populateAyahLessonsForUnit(activeAyahUnit);
    renderRules();
    renderTajweed();
    renderAyahs();
    bindEvents();

    // Default startup state: Rules Tab active with pushed Unit 1 & 2 rules
    switchTab('rules');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
