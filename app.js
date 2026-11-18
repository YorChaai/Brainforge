const STORAGE_KEY = 'brainforge_pro_state_v2';

const DEFAULT_STATE = {
  profile: {
    name: 'Dio',
    defaultLang: 'bilingual',
    defaultPersona: 'bro',
  },
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  skills: {
    memory: 0,
    recall: 0,
    listening: 0,
    speaking: 0,
    logic: 0,
  },
  diagnosticCodes: [],
  completedPlanDays: [],
  customModules: [],
  history: [],
};

const WORD_BANK_ID = [
  'kopi', 'meja', 'buku', 'awan', 'kunci', 'lampu', 'pintu', 'jam',
  'hujan', 'kereta', 'pantai', 'gunung', 'kamera', 'gitar', 'sepatu', 'roti',
  'kertas', 'gelas', 'bintang', 'jendela', 'tas', 'kursi', 'pensil', 'daun',
  'layar', 'kabel', 'jembatan', 'kompas', 'perahu', 'cermin', 'helm', 'rompi',
  'sirine', 'sensor', 'baterai', 'turbin', 'katup', 'tangga', 'loker', 'panel',
];

const WORD_BANK_EN = [
  'coffee', 'table', 'book', 'cloud', 'key', 'lamp', 'door', 'clock',
  'rain', 'train', 'beach', 'mountain', 'camera', 'guitar', 'shoes', 'bread',
  'paper', 'glass', 'star', 'window', 'bag', 'chair', 'pencil', 'leaf',
  'screen', 'bridge', 'compass', 'mirror', 'planet', 'forest', 'helmet', 'gloves',
  'beacon', 'sensor', 'turbine', 'valve', 'ladder', 'locker', 'panel', 'switch',
];

const STOPWORDS_ID_EN = new Set([
  'yang', 'untuk', 'pada', 'dengan', 'dalam', 'adalah', 'tidak', 'bukan', 'atau',
  'dari', 'akan', 'sudah', 'telah', 'dapat', 'bisa', 'karena', 'sebab', 'sehingga',
  'ketika', 'saat', 'jika', 'kalau', 'seperti', 'namun', 'tetapi', 'serta', 'oleh',
  'sebuah', 'suatu', 'para', 'mereka', 'kita', 'kami', 'kamu', 'anda', 'saya',
  'lebih', 'sangat', 'juga', 'hanya', 'masih', 'harus', 'wajib', 'setiap', 'semua',
  'that', 'this', 'with', 'from', 'have', 'will', 'your', 'their', 'about', 'which',
  'when', 'where', 'while', 'into', 'than', 'then', 'them', 'they', 'were', 'been',
]);

let state = loadState();
let activeCategory = 'all';
let currentModule = getAllModules()[0];
let currentLevel = 'Low';
let currentLang = state.profile.defaultLang || 'bilingual';

// Circuits State (4-Step Brain Circuit & 15-Min Speaking Circuit)
const BRAIN_CIRCUIT_IDS = ['memory-span', 'active-recall', 'listening-practice', 'mental-agility'];
const SPEAKING_CIRCUIT_IDS = ['conversation-initiation', 'conversation-continuation', 'speaking-simulation'];
let circuitActive = false;
let circuitMode = 'brain'; // 'brain' | 'speaking'
let circuitIndex = 0;
let circuitTimerInterval = null;
let circuitSecondsLeft = 0;

// DOM Elements
const dashboardView = document.getElementById('dashboard-view');
const workspaceView = document.getElementById('workspace-view');
const moduleGrid = document.getElementById('module-grid');
const historyList = document.getElementById('history-list');
const skillBarsEl = document.getElementById('skill-bars');

const navXp = document.getElementById('nav-xp');
const navStreak = document.getElementById('nav-streak');
const navName = document.getElementById('nav-name');
const navLang = document.getElementById('nav-lang');
const navAvatar = document.getElementById('nav-avatar');
const navRankIcon = document.getElementById('nav-rank-icon');
const navRankName = document.getElementById('nav-rank-name');

const ccRankIcon = document.getElementById('cc-rank-icon');
const ccRankTitle = document.getElementById('cc-rank-title');
const ccXpProgressText = document.getElementById('cc-xp-progress-text');
const ccXpBar = document.getElementById('cc-xp-bar');
const heroGreeting = document.getElementById('hero-greeting');

const circuitBanner = document.getElementById('circuit-banner');
const circuitBannerTitle = document.getElementById('circuit-banner-title');
const circuitBannerSub = document.getElementById('circuit-banner-sub');
const circuitTimerBadge = document.getElementById('circuit-timer-badge');

const wsBadge = document.getElementById('ws-badge');
const wsIcon = document.getElementById('ws-icon');
const wsTitle = document.getElementById('ws-title');
const wsDesc = document.getElementById('ws-desc');
const wsUniqueMechanic = document.getElementById('ws-unique-mechanic');
const tabWeblabBtn = document.getElementById('tab-weblab-btn');
const promptBuilderPanel = document.getElementById('prompt-builder-panel');
const weblabPanel = document.getElementById('weblab-panel');

const levelDescLow = document.getElementById('level-desc-low');
const levelDescMedium = document.getElementById('level-desc-medium');
const levelDescHard = document.getElementById('level-desc-hard');
const personaSelect = document.getElementById('persona-select');
const roundsSelect = document.getElementById('rounds-select');
const interactionSelect = document.getElementById('interaction-select');
const characterFieldGroup = document.getElementById('character-field-group');
const characterInput = document.getElementById('character-input');
const topicFieldLabel = document.getElementById('topic-field-label');
const topicInput = document.getElementById('topic-input');
const topicEditorHint = document.getElementById('topic-editor-hint');
const promptOutput = document.getElementById('prompt-output');
const toastEl = document.getElementById('toast');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      profile: { ...DEFAULT_STATE.profile, ...(parsed.profile || {}) },
      skills: { ...DEFAULT_STATE.skills, ...(parsed.skills || {}) },
      diagnosticCodes: Array.isArray(parsed.diagnosticCodes) ? parsed.diagnosticCodes : [],
      completedPlanDays: Array.isArray(parsed.completedPlanDays) ? parsed.completedPlanDays : [],
      customModules: Array.isArray(parsed.customModules) ? parsed.customModules : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getAllModules() {
  return [...DEFAULT_MODULES, ...(state.customModules || [])];
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2900);
}

function langLabel(lang) {
  if (lang === 'en') return 'English';
  if (lang === 'bilingual') return 'ID & EN';
  return 'Indonesia';
}

function getRankInfo(xp) {
  let current = RANK_TIERS[0];
  let next = RANK_TIERS[1] || null;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (xp >= RANK_TIERS[i].minXp) {
      current = RANK_TIERS[i];
      next = RANK_TIERS[i + 1] || null;
    }
  }
  if (!next) {
    return { current, next: null, percent: 100, text: `${xp} XP (Max Rank Achieved!)` };
  }
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  const percent = Math.min(100, Math.round((into / span) * 100));
  return {
    current,
    next,
    percent,
    text: `${xp} / ${next.minXp} XP menuju ${next.icon} ${next.name}`,
  };
}

function xpForLevel(level) {
  if (level === 'Hard') return 70;
  if (level === 'Medium') return 45;
  return 25;
}

// ==================== RENDER HEADER & DASHBOARD ====================
function renderHeaderAndStats() {
  const name = state.profile.name || 'Guest';
  navName.textContent = name;
  navAvatar.textContent = name.charAt(0).toUpperCase();
  navLang.textContent = langLabel(state.profile.defaultLang);
  navXp.textContent = state.xp;
  navStreak.textContent = state.streak;

  const rankInfo = getRankInfo(state.xp);
  navRankIcon.textContent = rankInfo.current.icon;
  navRankName.textContent = rankInfo.current.name;

  ccRankIcon.textContent = rankInfo.current.icon;
  ccRankTitle.textContent = rankInfo.current.name;
  ccXpProgressText.textContent = rankInfo.text;
  ccXpBar.style.width = `${rankInfo.percent}%`;

  heroGreeting.textContent = `👋 Halo, ${name}! Siap upgrade kapasitas otak & keluwesan bicara hari ini?`;

  // Render 5-Skill Brain Bars
  skillBarsEl.innerHTML = '';
  Object.entries(SKILL_META).forEach(([key, meta]) => {
    const val = state.skills[key] || 0;
    const skillLevel = Math.floor(val / 100) + 1;
    const pct = val % 100;
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.innerHTML = `
      <div class="skill-row-top">
        <span>${meta.icon} ${meta.label}</span>
        <span>Lv.${skillLevel} (${val} pts)</span>
      </div>
      <div class="skill-track">
        <div class="skill-fill" style="width:${pct}%; background:${meta.color}"></div>
      </div>
    `;
    skillBarsEl.appendChild(row);
  });
}

const INTERACTION_BADGE_MAP = {
  'listening-practice': { label: '🎙️ Voice', cls: 'mode-voice' },
  'recall-percakapan': { label: '🎙️ Voice', cls: 'mode-voice' },
  'structured-speaking': { label: '🎙️ Voice', cls: 'mode-voice' },
  'speaking-simulation': { label: '🎙️ Voice', cls: 'mode-voice' },
  'grammar-speaking': { label: '🎙️ Voice', cls: 'mode-voice' },
  'roleplay-mastery': { label: '🎙️ Voice', cls: 'mode-voice' },
  'impromptu-speaking': { label: '🎙️ Voice', cls: 'mode-voice' },
  'memory-span': { label: '🎙️💬 Both (Voice)', cls: 'mode-both-voice' },
  'conversation-initiation': { label: '🎙️💬 Both (Voice)', cls: 'mode-both-voice' },
  'conversation-continuation': { label: '🎙️💬 Both (Voice)', cls: 'mode-both-voice' },
  'active-recall': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'feynman-technique': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'critical-thinking': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'mental-agility': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'problem-solving': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'active-vocabulary': { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' },
  'atomic-fact-extraction': { label: '💬 Text', cls: 'mode-text' },
  'evidence-quote-extraction': { label: '💬 Text', cls: 'mode-text' },
  'modular-transcript-reconstruction': { label: '💬 Text', cls: 'mode-text' },
};

const STAR_PRIORITY_MAP = {
  'memory-span': 5,
  'listening-practice': 5,
  'recall-percakapan': 5,
  'structured-speaking': 5,
  'conversation-initiation': 5,
  'conversation-continuation': 5,
  'speaking-simulation': 5,
  'grammar-speaking': 4,
  'active-vocabulary': 4,
  'impromptu-speaking': 4,
  'active-recall': 4,
  'roleplay-mastery': 3,
  'feynman-technique': 3,
  'problem-solving': 3,
  'critical-thinking': 2,
  'mental-agility': 2,
  'atomic-fact-extraction': 1,
  'evidence-quote-extraction': 1,
  'modular-transcript-reconstruction': 1,
};

const activeStarFilters = new Set();

function getModuleStarPriority(mod) {
  if (STAR_PRIORITY_MAP[mod.id] != null) return STAR_PRIORITY_MAP[mod.id];
  return 3;
}

function getInteractionBadge(mod) {
  if (INTERACTION_BADGE_MAP[mod.id]) return INTERACTION_BADGE_MAP[mod.id];
  return mod.defaultInteraction === 'voice'
    ? { label: '🎙️💬 Both (Voice)', cls: 'mode-both-voice' }
    : { label: '💬🎙️ Both (Text)', cls: 'mode-both-text' };
}

function renderDashboard() {
  const allMods = getAllModules();
  const filtered = allMods.filter((m) => {
    const catMatch =
      activeCategory === 'all'
        ? true
        : activeCategory === 'custom'
        ? Boolean(m.isCustom)
        : m.category === activeCategory;
    const starMatch =
      activeStarFilters.size === 0 || activeStarFilters.has(getModuleStarPriority(m));
    return catMatch && starMatch;
  });

  moduleGrid.innerHTML = '';
  if (!filtered.length) {
    moduleGrid.innerHTML = `
      <div class="history-empty" style="grid-column: 1 / -1;">
        Belum ada modul yang cocok dengan filter ini. Coba pilih <strong>Semua Bintang</strong> atau kategori lain!
      </div>
    `;
  } else {
    filtered.forEach((mod) => {
      const completedCount = state.history.filter((h) => h.moduleId === mod.id).length;
      const skillInfo = SKILL_META[mod.skill] || SKILL_META.logic;
      const badge = getInteractionBadge(mod);
      const stars = getModuleStarPriority(mod);
      const starText = `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'module-card';
      card.innerHTML = `
        <div class="module-card-top">
          <div class="module-icon" style="background: ${mod.color}">${mod.icon}</div>
          <div class="module-tags-col">
            <span class="module-tag">${escapeHtml(mod.tag)}</span>
            <span class="mode-badge ${badge.cls}">${badge.label}</span>
            <span class="star-badge star-${stars}">${starText} (${stars}/5)</span>
          </div>
        </div>
        <div>
          <h3>${escapeHtml(mod.title)}</h3>
          <p>${escapeHtml(mod.description)}</p>
        </div>
        <div class="module-footer">
          <span>${skillInfo.icon} ${completedCount} sesi selesai</span>
          <span>Buka Game →</span>
        </div>
      `;
      card.addEventListener('click', () => openModule(mod.id));
      moduleGrid.appendChild(card);
    });
  }

  renderHistory();
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = `<div class="history-empty">Belum ada sesi tercatat. Pilih salah satu dari 19 game di atas atau mulai Sirkuit Latihan!</div>`;
    return;
  }

  historyList.innerHTML = '';
  state.history.slice(0, 12).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'history-item';
    const levelClass = `badge-${(item.level || 'Low').toLowerCase()}`;
    row.innerHTML = `
      <div class="history-item-left">
        <span style="font-size:18px;">${item.icon || '🧠'}</span>
        <div>
          <strong>${escapeHtml(item.moduleTitle)}</strong> — <span>${escapeHtml(item.topic || 'Latihan Interaktif')}</span>
          <div style="font-size: 11px; color: #64748b;">${item.dateLabel} • ${langLabel(item.lang)}</div>
        </div>
      </div>
      <div class="history-badges">
        <span class="badge ${levelClass}">${item.level}</span>
        <span class="badge badge-xp">+${item.xp} XP</span>
      </div>
    `;
    historyList.appendChild(row);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ==================== WORKSPACE & PROMPT BUILDER ====================
function openModule(moduleId, forcedLevel = null) {
  stopSpeech();
  const allMods = getAllModules();
  const mod = allMods.find((m) => m.id === moduleId) || allMods[0];
  currentModule = mod;
  if (forcedLevel) currentLevel = forcedLevel;
  currentLang = state.profile.defaultLang || 'bilingual';
  personaSelect.value = state.profile.defaultPersona || 'bro';
  if (mod.defaultInteraction) {
    interactionSelect.value = mod.defaultInteraction;
  }

  wsBadge.textContent = mod.tag;
  wsIcon.textContent = mod.icon;
  wsIcon.style.background = mod.color;
  wsTitle.textContent = mod.title;
  wsDesc.textContent = mod.description;

  if (wsUniqueMechanic) {
    wsUniqueMechanic.textContent = `✨ Keunikan Game Ini: ${mod.uniqueMechanic || mod.description}`;
  }

  characterFieldGroup.hidden = !mod.hasCharacterInput;

  levelDescLow.textContent = mod.levelHints?.Low || 'Santai & dasar';
  levelDescMedium.textContent = mod.levelHints?.Medium || 'Menengah & detail';
  levelDescHard.textContent = mod.levelHints?.Hard || 'Cepat & kompleks';

  // Dynamic Topic Label & Placeholder per Game Uniqueness
  if (topicFieldLabel) {
    topicFieldLabel.innerHTML = `4. ${escapeHtml(mod.topicLabel || 'Pilih atau Tulis Topik Latihan')} <span class="optional">(opsional — terkurasi per kategori)</span>`;
  }
  if (topicInput) {
    topicInput.placeholder =
      mod.topicPlaceholder ||
      'Tulis topik atau pilih dari kategori terkurasi di atas...';
  }
  if (topicEditorHint) {
    topicEditorHint.textContent =
      mod.topicMode === 'source'
        ? '🔬 Mode Analisis Teks: Tempel (paste) teks/transkrip sumber yang ingin dibedah, atau pilih topik sampel di atas.'
        : '✍️ Bebas dikosongkan (AI akan memilihkan otomatis) atau pilih dari kategori topik terkurasi di atas.';
  }

  // Web Lab is now supported for all 19 modules + custom modules (via social/universal lab)
  tabWeblabBtn.hidden = false;
  setWorkspaceTab('prompt');

  // Reset & render Curated Category/Subcategory Topic Browser
  activeTopicCatId = 'module-special';
  if (topicSearchInput) topicSearchInput.value = '';
  if (topicBrowserPanel) topicBrowserPanel.hidden = true;
  if (topicBrowserToggle) topicBrowserToggle.classList.remove('open');
  renderTopicBrowser();

  // Circuit Banner
  updateCircuitBannerUI();

  syncConfigButtons();
  updatePrompt();
  initWebLabForModule(mod.webLabType || 'social');

  dashboardView.classList.remove('active');
  workspaceView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateCircuitBannerUI() {
  if (!circuitActive) {
    circuitBanner.hidden = true;
    clearInterval(circuitTimerInterval);
    return;
  }
  const list = circuitMode === 'speaking' ? SPEAKING_CIRCUIT_IDS : BRAIN_CIRCUIT_IDS;
  circuitBanner.hidden = false;
  if (circuitMode === 'speaking') {
    const stepLabels = ['5 Menit Conversation Initiation', '5 Menit Conversation Continuation', '5 Menit Speaking Simulation'];
    circuitBannerTitle.textContent = `🗣️ Latihan Bicara 15 Menit: Tahap ${circuitIndex + 1}/3 — ${stepLabels[circuitIndex] || currentModule.title}`;
    circuitBannerSub.textContent =
      circuitIndex + 1 < list.length
        ? 'Berlatihlah selama 5 menit (di Web Lab atau AI), lalu klik Tahap Berikutnya.'
        : 'Tahap terakhir (Simulasi 2 Arah)! Selesaikan untuk klaim Bonus Speaking +75 XP!';
    if (circuitTimerBadge) circuitTimerBadge.hidden = false;
  } else {
    circuitBannerTitle.textContent = `⚡ Daily Brain Circuit: Tahap ${circuitIndex + 1} dari ${list.length} (${currentModule.title})`;
    circuitBannerSub.textContent =
      circuitIndex + 1 < list.length
        ? 'Selesaikan latihan ini (via Prompt AI atau Web Lab) lalu klik Tahap Berikutnya.'
        : 'Ini tahap terakhir! Selesaikan untuk klaim Bonus Circuit +60 XP!';
    if (circuitTimerBadge) circuitTimerBadge.hidden = true;
  }
}

function startCircuitCountdown(seconds = 300) {
  clearInterval(circuitTimerInterval);
  circuitSecondsLeft = seconds;
  const renderTime = () => {
    if (!circuitTimerBadge) return;
    const m = String(Math.floor(circuitSecondsLeft / 60)).padStart(2, '0');
    const s = String(circuitSecondsLeft % 60).padStart(2, '0');
    circuitTimerBadge.textContent = `⏱️ ${m}:${s}`;
  };
  renderTime();
  circuitTimerInterval = setInterval(() => {
    if (circuitSecondsLeft > 0) {
      circuitSecondsLeft--;
      renderTime();
      if (circuitSecondsLeft === 0) {
        showToast('⏰ Waktu 5 menit untuk tahap ini selesai! Silakan lanjut ke tahap berikutnya.');
      }
    }
  }, 1000);
}

function syncConfigButtons() {
  document.querySelectorAll('#level-selector .level-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.level === currentLevel);
  });
  document.querySelectorAll('#lang-selector .chip-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

function syncTopicEditorUI() {
  if (!topicInput) return;
  const len = topicInput.value.length;
  const charEl = document.getElementById('topic-char-count');
  if (charEl) charEl.textContent = `${len} karakter`;
  const clearBtn = document.getElementById('clear-topic-btn');
  if (clearBtn) {
    clearBtn.hidden = len === 0;
    clearBtn.classList.toggle('is-active', len > 0);
  }
  topicInput.style.height = 'auto';
  topicInput.style.height = `${Math.min(Math.max(topicInput.scrollHeight, 92), 220)}px`;
}

function updatePrompt() {
  syncTopicEditorUI();
  syncCustomSelects();
  promptOutput.value = buildAdvancedPrompt({
    module: currentModule,
    level: currentLevel,
    lang: currentLang,
    topic: topicInput.value,
    userName: state.profile.name,
    personaKey: personaSelect.value,
    rounds: roundsSelect.value,
    interactionMode: interactionSelect.value,
    characterName: characterInput.value,
  });
}

function setWorkspaceTab(mode) {
  document.querySelectorAll('#ws-mode-tabs .mode-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  if (mode === 'weblab') {
    promptBuilderPanel.hidden = true;
    weblabPanel.hidden = false;
    syncWebLabWithWorkspace();
  } else {
    promptBuilderPanel.hidden = false;
    weblabPanel.hidden = true;
  }
}

function recordSession(level, lang, topic, xpEarned, skillKey) {
  const today = getTodayStr();
  if (state.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
    state.lastActiveDate = today;
  }

  const targetSkill = skillKey || currentModule.skill || 'logic';
  state.xp += xpEarned;
  state.skills[targetSkill] = (state.skills[targetSkill] || 0) + xpEarned;

  state.history.unshift({
    moduleId: currentModule.id,
    moduleTitle: currentModule.title,
    icon: currentModule.icon,
    level,
    lang,
    topic: topic || 'Topik Terkurasi',
    xp: xpEarned,
    dateLabel: new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  if (state.history.length > 50) {
    state.history = state.history.slice(0, 50);
  }

  saveState();
  renderHeaderAndStats();
  renderDashboard();
}

// ==================== SPEECH (TTS & MIC STT WITH MALE/FEMALE VOICE PICKER) ====================
const speakPromptBtn = document.getElementById('speak-prompt-btn');
const cancelSpeakBtn = document.getElementById('cancel-speak-btn');

function setSpeakingUiState(isSpeaking) {
  if (speakPromptBtn) {
    speakPromptBtn.textContent = isSpeaking ? '🔊 Sedang Membaca...' : '🔊 Bacakan';
  }
  if (cancelSpeakBtn) {
    cancelSpeakBtn.classList.toggle('is-speaking', isSpeaking);
  }
}

function cleanMarkdownForSpeech(raw) {
  return String(raw || '')
    .replace(/\[!IMPORTANT\]/gi, 'Penting:')
    .replace(/^#+\s*/gm, '')
    .replace(/[-_]{3,}/g, '')
    .replace(/[*_`~>]/g, '')
    .trim();
}

let cachedVoices = [];
function refreshVoices() {
  if ('speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}
if ('speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function pickFemaleVoice(langCode = 'id-ID') {
  if (!cachedVoices.length) refreshVoices();
  const prefix = langCode.toLowerCase().slice(0, 2);
  const langVoices = cachedVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
  const pool = langVoices.length ? langVoices : cachedVoices;

  const femaleHints = [
    'gadis', 'google bahasa indonesia', 'damayanti', 'female', 'perempuan', 'wanita',
    'zira', 'jenny', 'aria', 'sonia', 'natasha', 'samantha', 'victoria', 'karen',
    'google us english', 'google uk english female',
  ];
  const maleHints = ['ardi', 'david', 'mark', 'guy', 'george', 'james', 'richard', 'male', 'pria'];

  for (const hint of femaleHints) {
    const found = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (found) return found;
  }
  const nonMale = pool.find((v) => !maleHints.some((m) => v.name.toLowerCase().includes(m)));
  return nonMale || pool[0] || null;
}

function pickMaleVoice(langCode = 'id-ID') {
  if (!cachedVoices.length) refreshVoices();
  const prefix = langCode.toLowerCase().slice(0, 2);
  const langVoices = cachedVoices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
  const pool = langVoices.length ? langVoices : cachedVoices;

  const maleHints = ['ardi', 'david', 'mark', 'guy', 'george', 'james', 'richard', 'daniel', 'male', 'pria'];
  for (const hint of maleHints) {
    const found = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (found) return found;
  }
  return pool[0] || null;
}

function speakText(text, langCode = 'id-ID', rate = 1.0, pitch = 1.08, gender = 'F') {
  if (!('speechSynthesis' in window)) {
    showToast('Browser ini belum mendukung Text-to-Speech.');
    return;
  }
  window.speechSynthesis.cancel();
  const cleaned = cleanMarkdownForSpeech(text);
  const utter = new SpeechSynthesisUtterance(cleaned);
  utter.lang = langCode;
  const chosenVoice = gender === 'M' ? pickMaleVoice(langCode) : pickFemaleVoice(langCode);
  if (chosenVoice) {
    utter.voice = chosenVoice;
  }
  utter.rate = rate;
  utter.pitch = gender === 'M' ? 0.88 : pitch;
  utter.onstart = () => setSpeakingUiState(true);
  utter.onend = () => setSpeakingUiState(false);
  utter.onerror = () => setSpeakingUiState(false);
  setSpeakingUiState(true);
  window.speechSynthesis.speak(utter);
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  setSpeakingUiState(false);
}

function startMicDictation(targetInputEl, langCode = 'id-ID') {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast('Fitur Mic Speech-to-Text membutuhkan Chrome / Edge / Brave.');
    return;
  }
  const rec = new SpeechRec();
  rec.lang = langCode;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  showToast('🎙️ Silakan bicara sekarang...');
  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    targetInputEl.value = targetInputEl.value
      ? `${targetInputEl.value.trim()} ${transcript}`
      : transcript;
    showToast('✓ Suara berhasil ditangkap!');
  };
  rec.onerror = () => {
    showToast('Tidak dapat menangkap suara. Pastikan izin mikrofon aktif.');
  };
  rec.start();
}

// ==================== INTERACTIVE WEB LABS (ALL 19 MODULES SUPPORTED) ====================
const labMemory = document.getElementById('lab-memory');
const labRecall = document.getElementById('lab-recall');
const labAudio = document.getElementById('lab-audio');
const labMath = document.getElementById('lab-math');
const labSocial = document.getElementById('lab-social');

function initWebLabForModule(webLabType) {
  const isUniversalStudio = !['memory', 'recall', 'listening', 'dialogue', 'math'].includes(webLabType);
  labMemory.hidden = webLabType !== 'memory';
  labRecall.hidden = webLabType !== 'recall';
  labAudio.hidden = !(webLabType === 'listening' || webLabType === 'dialogue');
  labMath.hidden = webLabType !== 'math';
  if (labSocial) labSocial.hidden = !isUniversalStudio;

  syncWebLabWithWorkspace();
}

function syncWebLabWithWorkspace() {
  const type = currentModule.webLabType || 'social';
  // Sync level from workspace
  mgLevel = currentLevel;
  arLevel = currentLevel;
  auLevel = currentLevel;
  mmLevel = currentLevel;
  socLevel = currentLevel;

  document.querySelectorAll('#mg-level-pills .chip-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.mgLevel === mgLevel)
  );
  document.querySelectorAll('#ar-level-pills .chip-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.arLevel === arLevel)
  );
  document.querySelectorAll('#au-level-pills .chip-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.auLevel === auLevel)
  );
  document.querySelectorAll('#mm-level-pills .chip-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.mmLevel === mmLevel)
  );
  document.querySelectorAll('#soc-level-pills .chip-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.socLevel === socLevel)
  );

  if (type === 'recall') {
    loadRecallPassage();
  } else if (type === 'listening' || type === 'dialogue') {
    loadAudioScenario();
  } else if (type === 'math') {
    generateMathQuestion();
  } else if (type !== 'memory') {
    loadSocialScenario();
  }
}

// --- LAB 1: MEMORY SPAN MATRIX (WITH AUDIO ID/EN & CONTEXT WORDS) ---
let mgLevel = 'Low';
let mgType = 'numbers';
let mgRound = 1;
let mgScore = 0;
let mgTargetSequence = [];
let mgIsReverse = false;
let mgRevealTimer = null;

const mgStatus = document.getElementById('mg-status');
const mgDisplay = document.getElementById('mg-display');
const mgInputArea = document.getElementById('mg-input-area');
const mgAnswerInput = document.getElementById('mg-answer-input');
const mgRoundEl = document.getElementById('mg-round');
const mgScoreEl = document.getElementById('mg-score');
const mgStartBtn = document.getElementById('mg-start-btn');

document.querySelectorAll('#mg-level-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    mgLevel = btn.dataset.mgLevel;
    currentLevel = mgLevel;
    syncConfigButtons();
    updatePrompt();
    document.querySelectorAll('#mg-level-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
  });
});

document.querySelectorAll('#mg-type-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    mgType = btn.dataset.mgType;
    document.querySelectorAll('#mg-type-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
  });
});

function generateSequence(level, type) {
  const count = level === 'Hard' ? 8 : level === 'Medium' ? 6 : 4;
  if (type === 'numbers') {
    return Array.from({ length: count }, () => String(Math.floor(Math.random() * 90 + 10)));
  }
  const isEn = type === 'words-en' || type === 'audio-en';
  // Extract topic words if user entered a custom topic
  const customTopicWords = (topicInput?.value || '')
    .toLowerCase()
    .replace(/[^a-z\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS_ID_EN.has(w));

  const baseBank = isEn ? WORD_BANK_EN : WORD_BANK_ID;
  const pool = [...new Set([...customTopicWords, ...baseBank])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

mgStartBtn.addEventListener('click', () => {
  clearTimeout(mgRevealTimer);
  mgTargetSequence = generateSequence(mgLevel, mgType);
  mgIsReverse = mgLevel === 'Hard';

  const revealMs = mgLevel === 'Hard' ? 5400 : mgLevel === 'Medium' ? 4400 : 3600;
  mgInputArea.hidden = true;
  mgAnswerInput.value = '';
  mgStartBtn.disabled = true;

  if (mgType === 'audio-id' || mgType === 'audio-en') {
    const ttsLang = mgType === 'audio-en' ? 'en-US' : 'id-ID';
    mgDisplay.textContent = '🔊 DENGARKAN AUDIO...';
    mgStatus.textContent = mgIsReverse
      ? 'Dengarkan urutan kata, lalu ketik dengan URUTAN TERBALIK!'
      : 'Dengarkan urutan kata baik-baik...';
    speakText(mgTargetSequence.join(', '), ttsLang, 0.9);
  } else {
    mgStatus.textContent = mgIsReverse
      ? '👀 Hafalkan urutan ini! Nanti ketik dengan URUTAN TERBALIK.'
      : '👀 Hafalkan urutan ini baik-baik...';
    mgDisplay.textContent = mgTargetSequence.join('  •  ');
  }

  mgRevealTimer = setTimeout(() => {
    mgDisplay.textContent = '❓  ❓  ❓';
    mgStatus.textContent = mgIsReverse
      ? 'Ketik ulang dari BELAKANG ke DEPAN (pisahkan dengan spasi):'
      : 'Ketik ulang urutan tadi (pisahkan dengan spasi):';
    mgInputArea.hidden = false;
    mgAnswerInput.focus();
    mgStartBtn.disabled = false;
  }, revealMs);
});

function checkMiniGameAnswer() {
  const userTokens = mgAnswerInput.value
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (!userTokens.length) return;

  const expected = mgIsReverse
    ? [...mgTargetSequence].reverse().map((x) => x.toLowerCase())
    : mgTargetSequence.map((x) => x.toLowerCase());

  let correctCount = 0;
  expected.forEach((val, idx) => {
    if (userTokens[idx] === val) correctCount++;
  });

  const roundPoints = Math.round((correctCount / expected.length) * 100);
  mgScore += roundPoints;
  mgRound += 1;

  mgRoundEl.textContent = mgRound;
  mgScoreEl.textContent = mgScore;
  mgInputArea.hidden = true;

  if (roundPoints >= 75) {
    const xp = xpForLevel(mgLevel);
    mgDisplay.textContent = roundPoints === 100 ? '🎉 SEMPURNA!' : `✅ BAGUS (${roundPoints}/100)`;
    mgStatus.textContent = `Tepat ${correctCount}/${expected.length} item! +${xp} XP. Urutan: ${expected.join(' • ')}`;
    recordSession(
      mgLevel,
      mgType.includes('en') ? 'en' : 'id',
      `Memory Span (${mgType})`,
      xp,
      'memory'
    );
  } else {
    mgDisplay.textContent = expected.join('  •  ');
    mgStatus.textContent = `Tepat ${correctCount}/${expected.length} (Skor: ${roundPoints}). Perhatikan urutan yang benar di atas lalu coba lagi!`;
  }
}

document.getElementById('mg-submit-btn').addEventListener('click', checkMiniGameAnswer);
mgAnswerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkMiniGameAnswer();
});
document.getElementById('mg-mic-btn').addEventListener('click', () => {
  startMicDictation(mgAnswerInput, mgType.includes('en') ? 'en-US' : 'id-ID');
});

// --- LAB 2: ACTIVE RECALL READER ---
let arLevel = 'Low';
let arIndex = 0;
let arCurrentPassage = null;
let arReadSeconds = 0;
let arPeekCount = 0;
let arTimerInterval = null;

const arPassageTitle = document.getElementById('ar-passage-title');
const arPassageText = document.getElementById('ar-passage-text');
const arTimerBadge = document.getElementById('ar-timer-badge');
const arReadingBox = document.getElementById('ar-reading-box');
const arRecallBox = document.getElementById('ar-recall-box');
const arUserAnswer = document.getElementById('ar-user-answer');
const arResultBox = document.getElementById('ar-result-box');
const arCustomBox = document.getElementById('ar-custom-box');
const arCustomInput = document.getElementById('ar-custom-input');

document.querySelectorAll('#ar-level-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    arLevel = btn.dataset.arLevel;
    currentLevel = arLevel;
    syncConfigButtons();
    updatePrompt();
    arIndex = 0;
    document.querySelectorAll('#ar-level-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
    loadRecallPassage();
  });
});

function loadRecallPassage() {
  clearInterval(arTimerInterval);
  const rawList = RECALL_PASSAGES[arLevel] || RECALL_PASSAGES.Low;
  const preferredLang = currentLang === 'en' ? 'en' : 'id';
  const langFiltered = rawList.filter((item) => item.lang === preferredLang);
  let list = langFiltered.length ? [...langFiltered] : [...rawList];

  // Prioritize passage matching workspace topic if selected
  const activeTopic = (topicInput?.value || '').trim().toLowerCase();
  if (activeTopic) {
    const topicWords = activeTopic.split(/\s+/).filter((w) => w.length >= 4);
    list.sort((a, b) => {
      const hayA = `${a.title} ${a.text}`.toLowerCase();
      const hayB = `${b.title} ${b.text}`.toLowerCase();
      const scoreA = topicWords.filter((w) => hayA.includes(w)).length;
      const scoreB = topicWords.filter((w) => hayB.includes(w)).length;
      return scoreB - scoreA;
    });
  }

  arCurrentPassage = list[arIndex % list.length];
  arPassageTitle.textContent = arCurrentPassage.title;
  arPassageText.textContent = arCurrentPassage.text;

  arReadingBox.hidden = false;
  arRecallBox.hidden = true;
  arResultBox.hidden = true;
  arUserAnswer.value = '';
  arPeekCount = 0;

  arReadSeconds = 0;
  arTimerBadge.textContent = 'Waktu Baca: 0d';
  arTimerInterval = setInterval(() => {
    arReadSeconds++;
    arTimerBadge.textContent = `Waktu Baca: ${arReadSeconds}d`;
  }, 1000);
}

document.getElementById('ar-next-passage-btn').addEventListener('click', () => {
  arIndex++;
  loadRecallPassage();
});

document.getElementById('ar-speak-passage-btn')?.addEventListener('click', () => {
  if (!arCurrentPassage) return;
  const langCode = arCurrentPassage.lang === 'en' ? 'en-US' : 'id-ID';
  speakText(`${arCurrentPassage.title}. ${arCurrentPassage.text}`, langCode, 0.98);
});

document.getElementById('ar-custom-toggle-btn').addEventListener('click', () => {
  arCustomBox.hidden = !arCustomBox.hidden;
});

function extractMeaningfulKeywords(text, limit = 12) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => (w.length >= 5 || /^\d+$/.test(w)) && !STOPWORDS_ID_EN.has(w));
  return [...new Set(words)].slice(0, limit);
}

document.getElementById('ar-use-custom-btn').addEventListener('click', () => {
  const txt = arCustomInput.value.trim();
  if (!txt) return;
  const uniqueKeywords = extractMeaningfulKeywords(txt, 12);
  const sentences = txt.split(/(?<=[.!?])\s+/).filter(Boolean);
  arCurrentPassage = {
    lang: currentLang === 'en' ? 'en' : 'id',
    title: 'Bacaan Kustom Pilihanmu',
    text: txt,
    concepts: sentences.length ? sentences : ['Menjelaskan kembali seluruh fakta inti dari bacaan kustom'],
    keywords: uniqueKeywords,
  };
  arPassageTitle.textContent = arCurrentPassage.title;
  arPassageText.textContent = arCurrentPassage.text;
  arCustomBox.hidden = true;
  arReadingBox.hidden = false;
  arRecallBox.hidden = true;
  arResultBox.hidden = true;
  arPeekCount = 0;
});

document.getElementById('ar-lock-btn').addEventListener('click', () => {
  stopSpeech();
  clearInterval(arTimerInterval);
  arReadingBox.hidden = true;
  arRecallBox.hidden = false;
  arResultBox.hidden = true;
  arUserAnswer.focus();
});

document.getElementById('ar-peek-btn').addEventListener('click', () => {
  arPeekCount++;
  arReadingBox.hidden = false;
  arRecallBox.hidden = true;
  showToast(`👀 Mengintip teks (${arPeekCount}x). Baca kembali lalu klik Tutup Buku.`);
});

document.getElementById('ar-mic-btn').addEventListener('click', () => {
  const langCode = arCurrentPassage?.lang === 'en' ? 'en-US' : 'id-ID';
  startMicDictation(arUserAnswer, langCode);
});

document.getElementById('ar-evaluate-btn').addEventListener('click', () => {
  const answer = arUserAnswer.value.trim().toLowerCase();
  if (!answer) {
    showToast('Tulis atau rekam penjelasanmu terlebih dahulu!');
    return;
  }
  const kw = arCurrentPassage.keywords || [];
  const matched = kw.filter((k) => answer.includes(k.toLowerCase()));
  const missed = kw.filter((k) => !answer.includes(k.toLowerCase()));
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const kwRatio = kw.length ? matched.length / Math.max(1, Math.ceil(kw.length * 0.65)) : 0.8;
  const lengthFactor = wordCount < 6 ? 0.5 : 1;
  const peekPenalty = Math.min(15, arPeekCount * 5);
  const score = Math.max(10, Math.min(100, Math.round(kwRatio * 100 * lengthFactor) - peekPenalty));
  const xp = xpForLevel(arLevel);

  arResultBox.hidden = false;
  arResultBox.innerHTML = `
    <strong>🏆 Skor Active Recall: ${score}/100 (+${xp} XP)</strong>
    <p style="margin-top:6px;">Waktu baca: <strong>${arReadSeconds}d</strong> • Mengintip teks: <strong>${arPeekCount}x</strong> • Konsep tertangkap (${matched.length}/${kw.length}): <code>${matched.join(', ') || 'Belum ada kata kunci spesifik'}</code></p>
    ${missed.length ? `<p style="margin-top:4px;font-size:12.5px;color:#b45309;">⚠️ Istilah/detail yang belum disebut: <code>${missed.join(', ')}</code></p>` : ''}
    <div style="margin-top:10px;">
      <strong>Poin Kunci Atomic di Bacaan Asli:</strong>
      <ul style="margin:6px 0 0 18px;">
        ${(arCurrentPassage.concepts || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
      </ul>
    </div>
  `;
  recordSession(arLevel, arCurrentPassage.lang || 'id', arCurrentPassage.title, xp, 'recall');
});

// --- LAB 3: LISTENING & MULTI-VOICE DIALOGUE AUDIO LAB ---
let auLevel = 'Low';
let auIndex = 0;
let auCurrentItem = null;
let auPlayCount = 0;

const auTitle = document.getElementById('au-title');
const auInstruction = document.getElementById('au-instruction');
const auPlaysLeftEl = document.getElementById('au-plays-left');
const auAnswerInput = document.getElementById('au-answer-input');
const auResultBox = document.getElementById('au-result-box');

document.querySelectorAll('#au-level-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    auLevel = btn.dataset.auLevel;
    currentLevel = auLevel;
    syncConfigButtons();
    updatePrompt();
    auIndex = 0;
    document.querySelectorAll('#au-level-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
    loadAudioScenario();
  });
});

function loadAudioScenario() {
  stopSpeech();
  const isDialogue = currentModule.webLabType === 'dialogue';
  const bank = isDialogue ? DIALOGUE_SCRIPTS : LISTENING_SCRIPTS;
  const rawList = bank[auLevel] || bank.Low;
  const prefPrefix = currentLang === 'en' ? 'en' : 'id';
  const langFiltered = rawList.filter((item) => (item.lang || '').toLowerCase().startsWith(prefPrefix));
  const list = langFiltered.length ? langFiltered : rawList;

  auCurrentItem = list[auIndex % list.length];
  auPlayCount = 0;

  auTitle.textContent = auCurrentItem.title;
  auInstruction.textContent = isDialogue
    ? 'Klik Putar Audio untuk mendengarkan percakapan 2 orang (Pria & Wanita), lalu ceritakan kembali masalah awal, perubahan rencana, dan kesepakatan akhirnya.'
    : 'Klik Putar Audio untuk mendengarkan monolog/briefing, lalu tuliskan informasi atomic (fakta, angka, alasan) yang kamu tangkap.';
  if (auPlaysLeftEl) {
    auPlaysLeftEl.textContent = 'Diputar: 0x (Rekomendasi: dengarkan maksimal 2x sebelum menjawab)';
  }
  auAnswerInput.value = '';
  auResultBox.hidden = true;
}

document.getElementById('au-next-btn').addEventListener('click', () => {
  auIndex++;
  loadAudioScenario();
});

document.getElementById('au-play-btn').addEventListener('click', () => {
  if (!auCurrentItem) return;
  auPlayCount++;
  if (auPlaysLeftEl) {
    auPlaysLeftEl.textContent = `Diputar: ${auPlayCount}x ${auPlayCount > 2 ? '(Usahakan menjawab tanpa memutar ulang terus-menerus)' : ''}`;
  }
  const rate = auLevel === 'Hard' ? 1.12 : auLevel === 'Medium' ? 1.0 : 0.92;
  if (auCurrentItem.lines) {
    if (!('speechSynthesis' in window)) {
      showToast('Browser/perangkat ini belum mendukung Text-to-Speech.');
      return;
    }
    window.speechSynthesis.cancel();
    const langCode = auCurrentItem.lang || 'id-ID';
    const femaleVoice = pickFemaleVoice(langCode);
    const maleVoice = pickMaleVoice(langCode);

    auCurrentItem.lines.forEach((line) => {
      const isMale = line.gender === 'M';
      const u = new SpeechSynthesisUtterance(`${line.speaker}: ${line.text}`);
      u.lang = langCode;
      if (isMale && maleVoice) {
        u.voice = maleVoice;
      } else if (femaleVoice) {
        u.voice = femaleVoice;
      }
      u.rate = rate;
      u.pitch = isMale ? 0.82 : 1.15;
      window.speechSynthesis.speak(u);
    });
  } else {
    speakText(auCurrentItem.script, auCurrentItem.lang || 'id-ID', rate);
  }
});

document.getElementById('au-stop-btn').addEventListener('click', stopSpeech);

document.getElementById('au-mic-btn').addEventListener('click', () => {
  startMicDictation(auAnswerInput, auCurrentItem?.lang || 'id-ID');
});

document.getElementById('au-check-btn').addEventListener('click', () => {
  const ans = auAnswerInput.value.trim().toLowerCase();
  if (!ans) {
    showToast('Tulis atau rekam jawabanmu terlebih dahulu!');
    return;
  }
  const kw = auCurrentItem.keywords || [];
  const matched = kw.filter((k) => ans.includes(k.toLowerCase()));
  const missed = kw.filter((k) => !ans.includes(k.toLowerCase()));
  const score = kw.length ? Math.min(100, Math.round((matched.length / Math.max(1, Math.ceil(kw.length * 0.6))) * 100)) : 85;
  const xp = xpForLevel(auLevel);
  const points = auCurrentItem.facts || auCurrentItem.summaryPoints || [];
  const transcriptHtml = auCurrentItem.lines
    ? auCurrentItem.lines
        .map((l) => `<div><strong>${escapeHtml(l.speaker)}:</strong> ${escapeHtml(l.text)}</div>`)
        .join('')
    : `<p>${escapeHtml(auCurrentItem.script)}</p>`;

  auResultBox.hidden = false;
  auResultBox.innerHTML = `
    <strong>🏆 Skor Listening &amp; Recall: ${score}/100 (+${xp} XP)</strong>
    <p style="margin-top:6px;">Detail kunci tertangkap (${matched.length}/${kw.length}): <code>${matched.join(', ') || 'Belum ada detail angka/kata kunci'}</code></p>
    ${missed.length ? `<p style="margin-top:4px;font-size:12.5px;color:#b45309;">⚠️ Detail yang terlewat: <code>${missed.join(', ')}</code></p>` : ''}
    <div style="margin-top:8px;">
      <strong>Fakta Penting yang Wajib Ditangkap:</strong>
      <ul style="margin:4px 0 10px 18px;">
        ${points.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}
      </ul>
      <strong>Transkrip Audio Asli:</strong>
      <div style="margin-top:4px;padding:10px;background:#fff;border-radius:10px;border:1px solid #cbd5e1;">
        ${transcriptHtml}
      </div>
    </div>
  `;
  recordSession(auLevel, (auCurrentItem.lang || 'id').slice(0, 2), auCurrentItem.title, xp, 'listening');
});

// --- LAB 4: MENTAL MATH & PATTERN BLITZ (MULTI-PATTERN VARIETY) ---
let mmLevel = 'Low';
let mmStreak = 0;
let mmScore = 0;
let mmExpected = null;
let mmShortcut = '';

const mmQuestion = document.getElementById('mm-question');
const mmAnswerInput = document.getElementById('mm-answer-input');
const mmStreakEl = document.getElementById('mm-streak');
const mmScoreEl = document.getElementById('mm-score');
const mmExplanation = document.getElementById('mm-explanation');

document.querySelectorAll('#mm-level-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    mmLevel = btn.dataset.mmLevel;
    currentLevel = mmLevel;
    syncConfigButtons();
    updatePrompt();
    document.querySelectorAll('#mm-level-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
    generateMathQuestion();
  });
});

function generateMathQuestion() {
  mmAnswerInput.value = '';
  const variant = Math.floor(Math.random() * 3);

  if (mmLevel === 'Low') {
    if (variant === 0) {
      const a = Math.floor(Math.random() * 45 + 15);
      const b = Math.floor(Math.random() * 35 + 12);
      const c = Math.floor(Math.random() * 20 + 5);
      mmExpected = a + b - c;
      mmQuestion.textContent = `${a} + ${b} - ${c} = ?`;
      mmShortcut = `Trik Kiri-ke-Kanan: (${a} + ${b}) = ${a + b}, dikurangi ${c} = ${mmExpected}`;
    } else if (variant === 1) {
      const start = Math.floor(Math.random() * 12 + 4);
      const step = Math.floor(Math.random() * 7 + 3);
      const seq = [start, start + step, start + step * 2, start + step * 3];
      mmExpected = start + step * 4;
      mmQuestion.textContent = `Deret: ${seq.join(' , ')} , [ ? ]`;
      mmShortcut = `Pola Selisih Tetap (+${step}): ${seq[3]} + ${step} = ${mmExpected}`;
    } else {
      const a = Math.floor(Math.random() * 8 + 4) * 10;
      const b = Math.floor(Math.random() * 29 + 11);
      mmExpected = a - b;
      mmQuestion.textContent = `${a} - ${b} = ?`;
      mmShortcut = `Trik Komplemen: Kurangi puluhan dulu (${a} - ${Math.floor(b / 10) * 10} = ${a - Math.floor(b / 10) * 10}), lalu kurangi ${b % 10} = ${mmExpected}`;
    }
  } else if (mmLevel === 'Medium') {
    if (variant === 0) {
      const a = Math.floor(Math.random() * 16 + 12);
      const b = Math.floor(Math.random() * 7 + 3);
      const c = Math.floor(Math.random() * 25 + 10);
      mmExpected = a * b + c;
      mmQuestion.textContent = `(${a} × ${b}) + ${c} = ?`;
      const tens = Math.floor(a / 10) * 10;
      const ones = a % 10;
      mmShortcut = `Pecah angka: (${tens}×${b} + ${ones}×${b}) = ${a * b}, lalu + ${c} = ${mmExpected}`;
    } else if (variant === 1) {
      // Percentage discount / calculation
      const pctOptions = [10, 15, 20, 25, 30];
      const pct = pctOptions[Math.floor(Math.random() * pctOptions.length)];
      const base = (Math.floor(Math.random() * 8) + 2) * 20; // 40..180
      mmExpected = (base * pct) / 100;
      mmQuestion.textContent = `${pct}% dari ${base} = ?`;
      mmShortcut = `Trik 10%: 10% dari ${base} adalah ${base / 10} → untuk ${pct}% tinggal kalikan proporsinya = ${mmExpected}`;
    } else {
      // Second-order difference sequence (+3, +5, +7, +9...)
      const s0 = Math.floor(Math.random() * 6 + 2);
      const d0 = Math.floor(Math.random() * 3 + 2);
      const seq = [s0];
      let d = d0;
      for (let i = 0; i < 4; i++) {
        seq.push(seq[seq.length - 1] + d);
        d += 2;
      }
      mmExpected = seq.pop();
      mmQuestion.textContent = `Deret Bertingkat: ${seq.join(' , ')} , [ ? ]`;
      mmShortcut = `Selisih antar angka bertambah +2 setiap langkah (+${d0}, +${d0 + 2}, +${d0 + 4}, +${d0 + 6}) → Jawaban: ${mmExpected}`;
    }
  } else {
    // Hard: Diverse advanced patterns (Fibonacci-like, Squares + offset, Alternating *mult + add, Word Quant)
    if (variant === 0) {
      const a = Math.floor(Math.random() * 5 + 2);
      const b = Math.floor(Math.random() * 6 + 3);
      const seq = [a, b];
      for (let i = 0; i < 4; i++) {
        seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
      }
      mmExpected = seq.pop();
      mmQuestion.textContent = `Deret Fibonacci: ${seq.join(' , ')} , [ ? ]`;
      mmShortcut = `Pola Jumlah 2 Suku Sebelumnya: ${seq[seq.length - 2]} + ${seq[seq.length - 1]} = ${mmExpected}`;
    } else if (variant === 1) {
      const mult = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const offset = Math.floor(Math.random() * 5) - 2; // -2..+2
      const start = Math.floor(Math.random() * 4 + 2);
      const seq = [start];
      for (let i = 0; i < 4; i++) {
        seq.push(seq[seq.length - 1] * mult + offset);
      }
      mmExpected = seq.pop();
      const signStr = offset >= 0 ? `+ ${offset}` : `- ${Math.abs(offset)}`;
      mmQuestion.textContent = `Deret Logika: ${seq.join(' , ')} , [ ? ]`;
      mmShortcut = `Pola: (suku × ${mult}) ${signStr} → (${seq[seq.length - 1]} × ${mult}) ${signStr} = ${mmExpected}`;
    } else {
      const price = (Math.floor(Math.random() * 4) + 2) * 50; // 100, 150, 200, 250
      const disc = 20;
      const people = [2, 4, 5][Math.floor(Math.random() * 3)];
      const afterDisc = price * (1 - disc / 100);
      mmExpected = afterDisc / people;
      mmQuestion.textContent = `Tagihan ${price}rb diskon ${disc}%, dibagi rata ${people} orang = ? rb/orang`;
      mmShortcut = `Trik: ${price}rb diskon 20% = ${afterDisc}rb. Dibagi ${people} orang = ${mmExpected}rb`;
    }
  }
  mmExplanation.textContent = 'Hitung di kepala lalu tekan Enter.';
  mmAnswerInput.focus();
}

function checkMathAnswer() {
  const val = Number(mmAnswerInput.value.trim());
  if (Number.isNaN(val) || mmAnswerInput.value.trim() === '') return;
  if (val === mmExpected) {
    mmStreak++;
    const pts = mmLevel === 'Hard' ? 35 : mmLevel === 'Medium' ? 20 : 10;
    mmScore += pts;
    mmStreakEl.textContent = mmStreak;
    mmScoreEl.textContent = mmScore;
    mmExplanation.textContent = `✅ Tepat! ${mmShortcut}`;
    if (mmStreak % 3 === 0) {
      const xp = xpForLevel(mmLevel);
      recordSession(mmLevel, currentLang, `Mental Math Combo (${mmStreak}x)`, xp, 'logic');
      showToast(`🔥 Combo ${mmStreak}x! +${xp} XP ditambahkan!`);
    }
    setTimeout(generateMathQuestion, 1100);
  } else {
    mmStreak = 0;
    mmStreakEl.textContent = 0;
    mmExplanation.textContent = `❌ Belum tepat (Jawaban: ${mmExpected}). ${mmShortcut}`;
  }
}

document.getElementById('mm-submit-btn').addEventListener('click', checkMathAnswer);
document.getElementById('mm-next-btn').addEventListener('click', generateMathQuestion);
mmAnswerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkMathAnswer();
});

// --- LAB 5: UNIVERSAL INTERACTIVE STUDIO (SOCIAL, SPEAKING, COGNITIVE, LANGUAGE & TEXT ANALYSIS) ---
let socLevel = 'Low';
let socIndex = 0;
let socCurrentScenario = null;
let socTurnIndex = 0;
let socTurnHistory = [];
let socPitchTimer = null;
let socPitchSeconds = 60;

const socTitleEl = document.getElementById('soc-title');
const socLevelBadge = document.getElementById('soc-level-badge');
const socScenarioText = document.getElementById('soc-scenario-text');
const socFormulaText = document.getElementById('soc-formula-text');
const socDialogueLog = document.getElementById('soc-dialogue-log');
const socAnswerLabel = document.getElementById('soc-answer-label');
const socAnswerInput = document.getElementById('soc-answer-input');
const socResultBox = document.getElementById('soc-result-box');
const socTimerBtn = document.getElementById('soc-timer-btn');
const socCustomSourceBtn = document.getElementById('soc-custom-source-btn');
const socCustomBox = document.getElementById('soc-custom-box');
const socCustomInput = document.getElementById('soc-custom-input');

document.querySelectorAll('#soc-level-pills .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    socLevel = btn.dataset.socLevel;
    currentLevel = socLevel;
    syncConfigButtons();
    updatePrompt();
    socIndex = 0;
    document.querySelectorAll('#soc-level-pills .chip-btn').forEach((b) => b.classList.toggle('active', b === btn));
    loadSocialScenario();
  });
});

function getScenarioListForModule(modId, level) {
  let baseList = [];
  if (SOCIAL_LAB_SCENARIOS[modId]) {
    const filtered = SOCIAL_LAB_SCENARIOS[modId].filter((s) => s.level === level);
    baseList = filtered.length ? [...filtered] : [...SOCIAL_LAB_SCENARIOS[modId]];
  } else if (UNIVERSAL_LAB_CHALLENGES[modId]) {
    const byLvl = UNIVERSAL_LAB_CHALLENGES[modId][level] || UNIVERSAL_LAB_CHALLENGES[modId].Low;
    if (byLvl && byLvl.length) baseList = byLvl.map((item) => ({ ...item, level }));
  }

  // Bridge Workspace Topic (#topic-input) directly into Web Lab!
  const rawTopic = (topicInput?.value || '').trim();
  if (rawTopic && currentModule.category === 'analysis' && rawTopic.length > 80) {
    const kw = extractMeaningfulKeywords(rawTopic, 12);
    const clauses = rawTopic
      .split(/[.;!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
    baseList.unshift({
      level,
      title: `Analisis Teks Sumber Pilihanmu (${currentModule.title})`,
      prompt: `TEKS SUMBER DARI WORKSPACE:\n"${rawTopic}"\n\nTUGAS: Bedah teks di atas sesuai spesifikasi ${currentModule.title} (Level ${level})!`,
      formula: currentModule.levelHints?.[level] || 'Pecah menjadi poin-poin fakta atomic eksplisit.',
      sampleGood: clauses
        .map((c, idx) => `${idx + 1}. ${c}${currentModule.id === 'evidence-quote-extraction' ? `\n   "${c}"` : ''}`)
        .join('\n'),
      keywords: kw,
    });
  } else if (rawTopic && baseList.length > 1) {
    const topicWords = rawTopic.toLowerCase().split(/\s+/).filter((w) => w.length >= 4);
    baseList.sort((a, b) => {
      const hayA = `${a.title} ${a.prompt}`.toLowerCase();
      const hayB = `${b.title} ${b.prompt}`.toLowerCase();
      const scoreA = topicWords.filter((w) => hayA.includes(w)).length;
      const scoreB = topicWords.filter((w) => hayB.includes(w)).length;
      return scoreB - scoreA;
    });
  }

  if (baseList.length) return baseList;

  // Fallback for custom user-created modules
  return [
    {
      level,
      title: `${currentModule.title} — Simulasi Latihan (${level})`,
      prompt: `Topik Fokus: "${rawTopic || currentModule.description}"\nSampaikan penjelasan, analisis, atau respons terbaikmu sesuai target modul ini!`,
      formula: currentModule.levelHints?.[level] || 'Susun jawaban secara terstruktur, jelas, dan berikan contoh konkret.',
      sampleGood: 'Jawaban yang baik memuat poin utama yang tegas, alasan logis, serta contoh nyata yang relevan dengan topik.',
      keywords: extractMeaningfulKeywords(`${currentModule.description} ${rawTopic}`, 8),
    },
  ];
}

function loadSocialScenario() {
  stopSpeech();
  clearInterval(socPitchTimer);
  const list = getScenarioListForModule(currentModule.id, socLevel);
  socCurrentScenario = list[socIndex % list.length];
  socTurnIndex = 0;
  socTurnHistory = [];

  if (socTitleEl) socTitleEl.textContent = socCurrentScenario.title;
  if (socLevelBadge) socLevelBadge.textContent = `Level ${socCurrentScenario.level || socLevel}`;
  if (socScenarioText) socScenarioText.textContent = socCurrentScenario.prompt;
  if (socFormulaText) socFormulaText.textContent = `💡 Panduan Kerangka: ${socCurrentScenario.formula}`;
  if (socAnswerInput) socAnswerInput.value = '';
  if (socResultBox) socResultBox.hidden = true;
  if (socDialogueLog) {
    socDialogueLog.innerHTML = '';
    socDialogueLog.hidden = true;
  }

  // Show 60s Pitch Timer button for impromptu-speaking or structured-speaking
  if (socTimerBtn) {
    const showTimer = currentModule.id === 'impromptu-speaking' || currentModule.id === 'structured-speaking';
    socTimerBtn.hidden = !showTimer;
    socTimerBtn.textContent = '⏱️ Mulai Timer 60d';
  }

  // Show Custom Source Text button for analysis modules
  if (socCustomSourceBtn && socCustomBox) {
    const isAnalysis = currentModule.category === 'analysis';
    socCustomSourceBtn.hidden = !isAnalysis;
    socCustomBox.hidden = true;
  }

  // Dynamic button & input label for multi-turn modules
  const checkBtn = document.getElementById('soc-check-btn');
  if (socCurrentScenario.multiTurnReplies && socCurrentScenario.multiTurnReplies.length) {
    if (socAnswerLabel) {
      socAnswerLabel.textContent = `Giliran 1 dari ${socCurrentScenario.multiTurnReplies.length + 1} — Balas sapaan lawan bicara:`;
    }
    if (checkBtn) {
      checkBtn.textContent = '💬 Kirim Balasan & Lanjut Ngobrol →';
    }
  } else {
    if (socAnswerLabel) {
      socAnswerLabel.textContent = 'Ucapkan (via Mic) atau Ketik Jawaban / Analisis Kamu:';
    }
    if (checkBtn) {
      checkBtn.textContent = '✓ Evaluasi & Lihat Model Jawaban Terbaik';
    }
  }
}

document.getElementById('soc-next-btn')?.addEventListener('click', () => {
  socIndex++;
  loadSocialScenario();
});

socTimerBtn?.addEventListener('click', () => {
  clearInterval(socPitchTimer);
  socPitchSeconds = 60;
  socTimerBtn.textContent = `⏱️ ${socPitchSeconds}d`;
  socPitchTimer = setInterval(() => {
    socPitchSeconds--;
    if (socPitchSeconds > 0) {
      socTimerBtn.textContent = `⏱️ ${socPitchSeconds}d`;
    } else {
      clearInterval(socPitchTimer);
      socTimerBtn.textContent = '⏰ Waktu Habis! (Klik Ulang)';
      showToast('⏰ Waktu 60 detik selesai! Silakan evaluasi hasil pitch kamu.');
    }
  }, 1000);
});

socCustomSourceBtn?.addEventListener('click', () => {
  if (socCustomBox) socCustomBox.hidden = !socCustomBox.hidden;
});

document.getElementById('soc-use-custom-btn')?.addEventListener('click', () => {
  const raw = socCustomInput?.value.trim();
  if (!raw) return;
  const kw = extractMeaningfulKeywords(raw, 12);
  const clauses = raw
    .split(/[.;!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  socCurrentScenario = {
    level: socLevel,
    title: `Analisis Teks Kustom (${currentModule.title})`,
    prompt: `TEKS SUMBER KUSTOM:\n"${raw}"\n\nTUGAS: Bedah teks di atas sesuai aturan ${currentModule.title} (Satu fakta = satu poin atomic${currentModule.id === 'evidence-quote-extraction' ? ' + wajib kutipan "..."' : ''})!`,
    formula: currentModule.levelHints?.[socLevel] || 'Pecah menjadi poin-poin fakta atomic eksplisit tanpa opini luar.',
    sampleGood: clauses
      .map((c, idx) => `${idx + 1}. ${c}${currentModule.id === 'evidence-quote-extraction' ? `\n   "${c}"` : ''}`)
      .join('\n'),
    keywords: kw,
  };
  if (socCustomBox) socCustomBox.hidden = true;
  if (socTitleEl) socTitleEl.textContent = socCurrentScenario.title;
  if (socScenarioText) socScenarioText.textContent = socCurrentScenario.prompt;
  if (socFormulaText) socFormulaText.textContent = `💡 Panduan: ${socCurrentScenario.formula}`;
  if (socResultBox) socResultBox.hidden = true;
});

document.getElementById('soc-speak-prompt-btn')?.addEventListener('click', () => {
  if (!socCurrentScenario) return;
  const isEngModule = currentModule.category === 'language' && currentModule.id !== 'impromptu-speaking';
  speakText(socCurrentScenario.prompt, isEngModule || currentLang === 'en' ? 'en-US' : 'id-ID', 0.96);
});

document.getElementById('soc-stop-btn')?.addEventListener('click', stopSpeech);

document.getElementById('soc-mic-btn')?.addEventListener('click', () => {
  const isEngModule = currentModule.category === 'language' && currentModule.id !== 'impromptu-speaking';
  startMicDictation(socAnswerInput, isEngModule || currentLang === 'en' ? 'en-US' : 'id-ID');
});

document.getElementById('soc-check-btn')?.addEventListener('click', () => {
  if (!socCurrentScenario) return;
  const ans = socAnswerInput.value.trim();
  if (!ans) {
    showToast('Ucapkan (via Mic) atau ketik jawabanmu terlebih dahulu!');
    return;
  }

  // Handle Multi-Turn Dialogue Simulation (Simulasi Ngobrol 2 Arah & Roleplay)
  const replies = socCurrentScenario.multiTurnReplies || [];
  if (replies.length && socTurnIndex < replies.length) {
    socTurnHistory.push(ans);
    const partnerReply = replies[socTurnIndex];
    socTurnIndex++;

    if (socDialogueLog) {
      socDialogueLog.hidden = false;
      const turnEl = document.createElement('div');
      turnEl.style.cssText = 'padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #cbd5e1;font-size:13.5px;';
      turnEl.innerHTML = `
        <div style="color:#0f172a;margin-bottom:6px;"><strong>🗣️ Kamu (Putaran ${socTurnIndex}):</strong> ${escapeHtml(ans)}</div>
        <div style="color:#1d4ed8;font-weight:600;">💬 ${escapeHtml(partnerReply)}</div>
      `;
      socDialogueLog.appendChild(turnEl);
    }

    socAnswerInput.value = '';
    socAnswerInput.focus();
    const isEngModule = currentModule.category === 'language';
    speakText(partnerReply, isEngModule ? 'en-US' : 'id-ID', 0.98);

    const totalTurns = replies.length + 1;
    if (socAnswerLabel) {
      socAnswerLabel.textContent = `Giliran ${socTurnIndex + 1} dari ${totalTurns} — Lanjutkan obrolan:`;
    }
    const checkBtn = document.getElementById('soc-check-btn');
    if (checkBtn && socTurnIndex === replies.length) {
      checkBtn.textContent = '✓ Kirim Balasan Terakhir & Lihat Rapor 3 Indikator';
    }
    return;
  }

  // Combine all turns if multi-turn
  const fullUserText = [...socTurnHistory, ans].join(' ');
  const lower = fullUserText.toLowerCase();
  const kw = socCurrentScenario.keywords || [];
  const matched = kw.filter((k) => lower.includes(k.toLowerCase()));
  const wordCount = fullUserText.split(/\s+/).filter(Boolean).length;

  // Honest scoring based on structure, length, question marks (if social), quotes (if evidence), and keywords
  const kwScore = kw.length
    ? Math.min(60, Math.round((matched.length / Math.max(1, Math.ceil(kw.length * 0.55))) * 60))
    : 45;
  const lengthScore = wordCount >= 22 ? 25 : wordCount >= 12 ? 18 : wordCount >= 6 ? 10 : 3;
  let bonusScore = 10;
  if (currentModule.id === 'evidence-quote-extraction') {
    bonusScore = fullUserText.includes('"') || fullUserText.includes('“') ? 15 : 0;
  } else if (currentModule.id === 'conversation-initiation' || currentModule.id === 'conversation-continuation' || currentModule.id === 'speaking-simulation') {
    bonusScore = fullUserText.includes('?') || /apa|gimana|bagaimana|siapa|mana|kapan|berapa|what|how|where|when/i.test(fullUserText) ? 15 : 5;
  } else {
    bonusScore = wordCount >= 15 ? 15 : 5;
  }

  const score = Math.min(100, kwScore + lengthScore + bonusScore);
  const lvl = socCurrentScenario.level || socLevel;
  const xp = xpForLevel(lvl);

  // Build specialized per-game evaluation rubric for all 14 Universal Studio games
  const hasQuestion = fullUserText.includes('?') || /apa|gimana|bagaimana|siapa|mana|kapan|berapa|what|how|where|when|why/i.test(fullUserText);
  const hasSelfDisclosure = /saya|aku|gue|kami|i am|i have|my|i usually|i think/i.test(fullUserText);
  const hasReasonWord = /karena|sebab|alasan|oleh karena|because|since|reason|due to/i.test(fullUserText);
  const hasExampleWord = /contoh|misal|seperti|kasus|for example|for instance|such as|like when/i.test(fullUserText);
  const hasConclusionWord = /kesimpulan|jadi|intinya|karena itu|therefore|in conclusion|so that|overall/i.test(fullUserText);
  const hasAnalogyWord = /ibarat|seperti|bagaikan|layaknya|analogi|like a|imagine|as if/i.test(fullUserText);
  const hasQuotes = fullUserText.includes('"') || fullUserText.includes('“');
  const numberedLines = fullUserText.split(/\n+/).filter((l) => /^\s*(\d+[.)]|[-•*])/.test(l)).length;
  const missedKw = kw.filter((k) => !lower.includes(k.toLowerCase()));

  function buildModuleSpecificRubricHtml(modId) {
    const boxStyle = 'margin-top:8px;display:grid;gap:5px;font-size:13px;background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #e2e8f0;';
    switch (modId) {
      case 'structured-speaking':
        return `<div style="${boxStyle}">
          <div><strong>🎯 Audit Struktur ${lvl === 'Low' ? '3 Langkah (P-A-C)' : '4 Langkah (P-P-A-K)'}:</strong></div>
          <div>1. <strong>Poin Utama / Pendapat:</strong> ${wordCount >= 5 ? '✅ Tersampaikan di awal kalimat' : '⚠️ Sampaikan poin utama dengan lebih tegas'}</div>
          <div>2. <strong>Penjelasan & Alasan:</strong> ${hasReasonWord ? '✅ Memuat kata penghubung alasan (karena/sebab)' : '💡 Gunakan kata "Karena..." agar alasan terdengar runtut'}</div>
          <div>3. <strong>Contoh Konkret:</strong> ${hasExampleWord ? '✅ Memuat contoh nyata (misalnya/contohnya)' : '💡 Tambahkan "Misalnya..." untuk memberi contoh konkret'}</div>
          ${lvl !== 'Low' ? `<div>4. <strong>Kesimpulan Pengunci:</strong> ${hasConclusionWord ? '✅ Ditutup dengan kalimat kesimpulan' : '💡 Tutup dengan "Karena itu / Jadi..." sebagai kesimpulan P-P-A-K'}</div>` : ''}
        </div>`;

      case 'conversation-initiation':
        return `<div style="${boxStyle}">
          <div><strong>👋 Audit 4 Teknik Pembuka & Quick Entry:</strong></div>
          <div>1. <strong>Konteks / Observasi Situasi:</strong> ${matched.length >= 1 ? '✅ Menangkap konteks situasi sekitar' : '💡 Kaitkan pembuka dengan situasi di sekitar lawan bicara'}</div>
          <div>2. <strong>Kalimat Pancingan (Question / Quick Entry):</strong> ${hasQuestion ? '✅ Mengandung pertanyaan ringan yang mudah dijawab' : '⚠️ Akhiri sapaan dengan pertanyaan ringan agar lawan bicara mudah membalas'}</div>
          <div>3. <strong>Kealamian Nada Sapaan:</strong> ${wordCount >= 5 && wordCount <= 45 ? '✅ Panjang kalimat pas & tidak kaku' : '💡 Buat sapaan singkat, ramah, dan langsung ke konteks'}</div>
        </div>`;

      case 'conversation-continuation':
        return `<div style="${boxStyle}">
          <div><strong>🔗 Audit Rumus Continuation (Dengar → Tangkap Kata → Tanggapi → Tanyakan):</strong></div>
          <div>1. <strong>Tangkap Kata Kunci & Reflective Response:</strong> ${matched.length >= 1 ? `✅ Menangkap kata kunci (<code>${matched.slice(0, 3).join(', ')}</code>)` : '⚠️ Tangkap minimal 1 kata kunci dari ucapan lawan bicara'}</div>
          <div>2. <strong>Self-Disclosure / Topic Expansion:</strong> ${hasSelfDisclosure ? '✅ Menambahkan sedikit pengalaman/konteks diri' : '💡 Selipkan 1 kalimat pengalamanmu sebelum bertanya balik'}</div>
          <div>3. <strong>Follow-up Question:</strong> ${hasQuestion ? '✅ Mengajukan pertanyaan lanjutan agar obrolan hidup' : '⚠️ Wajib tutup dengan Follow-up Question agar obrolan tidak mati!'}</div>
        </div>`;

      case 'speaking-simulation':
      case 'roleplay-mastery':
        return `<div style="${boxStyle}">
          <div><strong>🗨️ Audit 3 Indikator Keluwesan Dialog (${socTurnHistory.length + 1} Putaran):</strong></div>
          <div>1. <strong>Kemampuan Merespons (Response):</strong> ${wordCount >= 8 ? '✅ Jelas & relevan dengan peran/situasi' : '⚠️ Masih terlalu singkat, tambahkan kalimat penjelas'}</div>
          <div>2. <strong>Pengembangan Obrolan (Expansion):</strong> ${hasSelfDisclosure ? '✅ Menggunakan Self-Disclosure / konteks pengalaman' : '💡 Tambahkan sedikit cerita/kondisimu agar obrolan seimbang'}</div>
          <div>3. <strong>Daya Tarik & Umpan Balik (Engagement):</strong> ${hasQuestion ? '✅ Mengajukan pertanyaan balik yang memancing lawan bicara' : '⚠️ Jangan lupa lempar pertanyaan balik agar obrolan tidak berhenti!'}</div>
        </div>`;

      case 'feynman-technique':
        return `<div style="${boxStyle}">
          <div><strong>💡 Audit Dekonstruksi Konsep Feynman (${lvl}):</strong></div>
          <div>1. <strong>Kejernihan & Bebas Hafalan Kaku:</strong> ${wordCount >= 14 ? '✅ Penjelasan dijabarkan dengan kalimat utuh' : '⚠️ Jelaskan lebih utuh seolah mengajari pemula'}</div>
          <div>2. <strong>Mekanisme Sebab-Akibat:</strong> ${hasReasonWord || matched.length >= 2 ? '✅ Menjelaskan proses "mengapa/bagaimana" bekerja' : '💡 Jelaskan mekanisme sebab-akibat di balik konsep ini'}</div>
          <div>3. <strong>Analogi / Perumpamaan Nyata:</strong> ${hasAnalogyWord ? '✅ Menggunakan analogi/metafora dunia nyata' : '💡 Gunakan kata "Ibarat / Seperti..." untuk membuat analogi konkret'}</div>
        </div>`;

      case 'critical-thinking':
        return `<div style="${boxStyle}">
          <div><strong>⚖️ Audit Ketajaman Logika & Fallacy Hunter (${lvl}):</strong></div>
          <div>1. <strong>Deteksi Cacat Logika / Asumsi:</strong> ${matched.length >= 2 ? '✅ Mengidentifikasi celah argumen / asumsi tersembunyi' : '⚠️ Sebutkan asumsi tersembunyi atau celah kausalitas dari klaim di atas'}</div>
          <div>2. <strong>Argumen Berbasis Bukti & Alasan:</strong> ${hasReasonWord ? '✅ Menyertakan landasan alasan logis' : '💡 Sertakan alasan "mengapa" klaim tersebut lemah atau perlu diuji'}</div>
          ${lvl === 'Hard' ? `<div>3. <strong>Steelmanning (Bela Kubu Lawan Dulu):</strong> ${wordCount >= 25 ? '✅ Analisis dua sisi cukup komprehensif' : '💡 Pada level Hard, rumuskan argumen terkuat kubu lawan sebelum membedah batasannya'}</div>` : ''}
        </div>`;

      case 'problem-solving':
        return `<div style="${boxStyle}">
          <div><strong>🧩 Audit First-Principles Case Solver (${lvl}):</strong></div>
          <div>1. <strong>Identifikasi Akar Masalah (Root Cause / 5-Whys):</strong> ${hasReasonWord || matched.length >= 2 ? '✅ Membedah penyebab dasar masalah' : '⚠️ Pisahkan gejala permukaan dari akar penyebab masalah'}</div>
          <div>2. <strong>Langkah Solusi Terstruktur:</strong> ${numberedLines >= 2 || wordCount >= 18 ? '✅ Menyusun langkah aksi nyata' : '💡 Rincikan solusi menjadi 2–3 langkah konkret'}</div>
          <div>3. <strong>Antisipasi Kendala / Plot Twist:</strong> ${matched.length >= 3 ? '✅ Memperhitungkan batasan sumber daya/risiko' : '💡 Pastikan solusi tetap berjalan meski ada kendala mendadak'}</div>
        </div>`;

      case 'grammar-speaking':
        return `<div style="${boxStyle}">
          <div><strong>🗣️ Audit Grammar in Action & Wajib Ucap Ulang (Inggrisku.AI Protocol):</strong></div>
          <div>1. <strong>Pemakaian Pola Target (${lvl}):</strong> ${matched.length >= 2 ? `✅ Menggunakan elemen grammar target (<code>${matched.join(', ')}</code>)` : `⚠️ Pastikan memakai kata/pola target: <code>${kw.slice(0, 4).join(', ')}</code>`}</div>
          <div>2. <strong>Aturan Wajib Recast (Ucap Ulang):</strong> Setelah membaca <em>Model Jawaban Terbaik</em> di bawah, <strong>ucapkan dengan suara keras 1x</strong> atau ketik ulang agar otot bicaramu mengunci pola kalimat yang benar!</div>
        </div>`;

      case 'active-vocabulary':
        return `<div style="${boxStyle}">
          <div><strong>📚 Tracker Aktivasi Kosakata Kontekstual (${lvl}):</strong></div>
          <div>1. <strong>Kata Target yang Berhasil Dipakai (${matched.length}/${kw.length}):</strong> <code>${matched.join(', ') || 'Belum ada kata target yang terdeteksi'}</code></div>
          ${missedKw.length ? `<div>2. <strong>Kata Target yang Belum Dipakai:</strong> <code>${missedKw.join(', ')}</code> — coba buat 1 kalimat tambahan dengan kata ini!</div>` : '<div>2. <strong>Status Penguasaan:</strong> ✅ Seluruh kata kunci target berhasil dirangkai!</div>'}
        </div>`;

      case 'impromptu-speaking':
        return `<div style="${boxStyle}">
          <div><strong>🎙️ Audit Kerangka Pitch 60 Detik (P–R–E–P):</strong></div>
          <div>1. <strong>P — Point (Pernyataan Pembuka):</strong> ${wordCount >= 6 ? '✅ Posisi utama disampaikan' : '⚠️ Buka dengan 1 kalimat posisi utama yang tegas'}</div>
          <div>2. <strong>R — Reason (Alasan Logis):</strong> ${hasReasonWord ? '✅ Memuat alasan pendukung (Because/Karena)' : '💡 Tambahkan alasan logis mengapa poinmu penting'}</div>
          <div>3. <strong>E — Example (Contoh Nyata):</strong> ${hasExampleWord ? '✅ Memuat bukti/contoh konkret (For instance/Misalnya)' : '💡 Berikan 1 contoh atau pengalaman nyata'}</div>
          <div>4. <strong>P — Point (Penegasan Penutup):</strong> ${hasConclusionWord ? '✅ Ditutup dengan kalimat pengunci (Therefore/Jadi)' : '💡 Kunci akhir pitch dengan kalimat penegasan ulang'}</div>
        </div>`;

      case 'atomic-fact-extraction':
        return `<div style="${boxStyle}">
          <div><strong>🔬 Audit Protokol Ekstraksi Fakta Atomic (Promt Formal):</strong></div>
          <div>1. <strong>Pemisahan Poin Atomic (1 Fakta = 1 Poin):</strong> ${numberedLines >= 3 ? `✅ Terdeteksi ${numberedLines} baris poin fakta terpisah` : '⚠️ Pecah kalimat majemuk menjadi daftar poin bernomor (1, 2, 3...) — satu fakta per baris!'}</div>
          <div>2. <strong>Kelengkapan Detail & Angka (${matched.length}/${kw.length}):</strong> ${missedKw.length ? `⚠️ Detail yang belum masuk: <code>${missedKw.join(', ')}</code>` : '✅ Seluruh fakta eksplisit & angka kunci berhasil diekstrak!'}</div>
        </div>`;

      case 'evidence-quote-extraction':
        return `<div style="${boxStyle}">
          <div><strong>📑 Audit Bukti Kutipan Eksplisit (Promt Kutip):</strong></div>
          <div>1. <strong>Kepatuhan Bukti Kutipan (<code>"..."</code>):</strong> ${hasQuotes ? '✅ Menyertakan kutipan teks asli dalam tanda petik ("...")' : '❌ WAJIB menyertakan kutipan kalimat asli dalam tanda kutip ("...") di bawah setiap poin fakta!'}</div>
          <div>2. <strong>Ketepatan Fakta Eksplisit (${matched.length}/${kw.length}):</strong> ${missedKw.length ? `⚠️ Detail fakta yang belum dikutip: <code>${missedKw.join(', ')}</code>` : '✅ Seluruh fakta kunci terverifikasi dengan kutipan!'}</div>
        </div>`;

      case 'modular-transcript-reconstruction':
        return `<div style="${boxStyle}">
          <div><strong>🏛️ Audit Rekonstruksi Transkrip & Modul 5 Pilar (Zero Info Loss):</strong></div>
          <div>1. <strong>Kelengkapan Substansi & Angka (${matched.length}/${kw.length}):</strong> ${missedKw.length ? `⚠️ Detail transkrip yang belum masuk: <code>${missedKw.join(', ')}</code>` : '✅ Zero Information Loss — seluruh substansi & angka terjaga utuh!'}</div>
          <div>2. <strong>Keterstrukturan Rekonstruksi (${lvl}):</strong> ${wordCount >= 20 ? '✅ Narasi & poin analisis tersusun rapi tanpa filler lisan' : '💡 Pastikan baik Paragraf Narasi maupun Poin Analisis ditulis lengkap tanpa memotong detail'}</div>
        </div>`;

      default:
        return '';
    }
  }

  const indicatorHtml = buildModuleSpecificRubricHtml(currentModule.id);

  socResultBox.hidden = false;
  socResultBox.innerHTML = `
    <strong>🏆 Skor Evaluasi (${escapeHtml(currentModule.title)}): ${score}/100 (+${xp} XP)</strong>
    <p style="margin-top:6px;">Total kata: <strong>${wordCount} kata</strong> • Elemen kunci terdeteksi (${matched.length}/${kw.length}): <code>${matched.join(', ') || 'Gunakan lebih banyak kata kunci struktur/konteks'}</code></p>
    ${indicatorHtml}
    <div style="margin-top:10px;padding:12px;background:#fff;border-radius:10px;border:1px solid #bbf7d0;">
      <strong>✨ Model Jawaban Terbaik / Kunci Analisis (Bisa Kamu Ucapkan Ulang dengan Suara Keras):</strong>
      <p style="margin-top:6px;color:#0f172a;font-weight:600;white-space:pre-line;">${escapeHtml(socCurrentScenario.sampleGood)}</p>
    </div>
  `;
  recordSession(lvl, currentLang, socCurrentScenario.title, xp, currentModule.skill);
});

// ==================== EVENT LISTENERS ====================
document.getElementById('nav-home-btn').addEventListener('click', () => {
  stopSpeech();
  workspaceView.classList.remove('active');
  dashboardView.classList.add('active');
});

document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
  stopSpeech();
  workspaceView.classList.remove('active');
  dashboardView.classList.add('active');
});

document.querySelectorAll('#category-tabs .cat-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    activeCategory = tab.dataset.cat;
    document.querySelectorAll('#category-tabs .cat-tab').forEach((t) => t.classList.toggle('active', t === tab));
    renderDashboard();
  });
});

function syncStarFilterTabs() {
  document.querySelectorAll('#star-filter-tabs .star-tab').forEach((t) => {
    const val = t.dataset.star || 'all';
    const isActive =
      val === 'all' ? activeStarFilters.size === 0 : activeStarFilters.has(Number(val));
    t.classList.toggle('active', isActive);
  });
}

document.querySelectorAll('#star-filter-tabs .star-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const val = tab.dataset.star || 'all';
    if (val === 'all') {
      activeStarFilters.clear();
    } else {
      const starNum = Number(val);
      if (activeStarFilters.has(starNum)) {
        activeStarFilters.delete(starNum);
      } else {
        activeStarFilters.add(starNum);
      }
    }
    syncStarFilterTabs();
    renderDashboard();
  });
});

document.querySelectorAll('#ws-mode-tabs .mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => setWorkspaceTab(tab.dataset.mode));
});

document.querySelectorAll('#level-selector .level-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentLevel = btn.dataset.level;
    syncConfigButtons();
    updatePrompt();
    syncWebLabWithWorkspace();
  });
});

document.querySelectorAll('#lang-selector .chip-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    syncConfigButtons();
    renderTopicBrowser();
    updatePrompt();
    syncWebLabWithWorkspace();
  });
});

personaSelect.addEventListener('change', updatePrompt);
roundsSelect.addEventListener('change', updatePrompt);
interactionSelect.addEventListener('change', updatePrompt);
characterInput.addEventListener('input', updatePrompt);
topicInput.addEventListener('input', updatePrompt);

// === CURATED CATEGORY & SUBCATEGORY TOPIC BROWSER (ID & EN) ===
let activeTopicCatId = 'module-special';
const topicBrowserToggle = document.getElementById('topic-browser-toggle');
const topicBrowserPanel = document.getElementById('topic-browser-panel');
const topicSearchInput = document.getElementById('topic-search-input');
const topicPageTabsEl = document.getElementById('topic-page-tabs');
const topicPageListEl = document.getElementById('topic-page-list');

function renderTopicBrowser() {
  if (!topicPageTabsEl || !topicPageListEl) return;
  const categories =
    typeof getTopicsForModuleByCategory === 'function'
      ? getTopicsForModuleByCategory(currentModule, currentLang)
      : [];

  if (!categories.length) return;
  if (!categories.some((c) => c.id === activeTopicCatId)) {
    activeTopicCatId = categories[0].id;
  }

  const query = (topicSearchInput?.value || '').trim().toLowerCase();

  // Render Category Tabs
  topicPageTabsEl.innerHTML = '';
  categories.forEach((cat) => {
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `topic-page-tab${!query && cat.id === activeTopicCatId ? ' active' : ''}`;
    tabBtn.textContent = `${cat.icon} ${cat.label}`;
    tabBtn.title = cat.desc || cat.label;
    tabBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeTopicCatId = cat.id;
      if (topicSearchInput) topicSearchInput.value = '';
      renderTopicBrowser();
    });
    topicPageTabsEl.appendChild(tabBtn);
  });

  // Render Subcategories & Topics
  topicPageListEl.innerHTML = '';
  const activeVal = topicInput.value.trim();
  const frag = document.createDocumentFragment();
  let itemCounter = 0;

  const catsToRender = query ? categories : categories.filter((c) => c.id === activeTopicCatId);

  catsToRender.forEach((cat) => {
    (cat.subcategories || []).forEach((sub) => {
      const matchingTopics = (sub.topics || []).filter((t) => !query || t.toLowerCase().includes(query));
      if (!matchingTopics.length) return;

      const subHeader = document.createElement('div');
      subHeader.style.cssText =
        'padding:8px 12px 4px;font-size:11.5px;font-weight:800;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.04em;background:#f1f5f9;border-radius:6px;margin-top:6px;';
      subHeader.textContent = `${cat.icon} ${sub.name}`;
      frag.appendChild(subHeader);

      matchingTopics.forEach((topicText) => {
        itemCounter++;
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `topic-list-item${activeVal === topicText ? ' selected' : ''}`;
        row.innerHTML = `<span class="topic-num-badge">#${itemCounter}</span><span>${escapeHtml(topicText)}</span>`;
        row.addEventListener('click', () => {
          topicInput.value = topicText;
          updatePrompt();
          renderTopicBrowser();
          topicBrowserPanel.hidden = true;
          topicBrowserToggle.classList.remove('open');
        });
        frag.appendChild(row);
      });
    });
  });

  if (itemCounter === 0) {
    topicPageListEl.innerHTML = `<div style="padding:14px;text-align:center;color:#64748b;font-size:13px;">Tidak ada topik yang cocok dengan "${escapeHtml(query)}".</div>`;
    return;
  }

  topicPageListEl.appendChild(frag);
}

function closeTopicBrowser() {
  if (topicBrowserPanel) topicBrowserPanel.hidden = true;
  if (topicBrowserToggle) topicBrowserToggle.classList.remove('open');
}

topicBrowserToggle?.addEventListener('click', () => {
  const willOpen = topicBrowserPanel.hidden;
  topicBrowserPanel.hidden = !willOpen;
  topicBrowserToggle.classList.toggle('open', willOpen);
  if (willOpen) renderTopicBrowser();
});

document.getElementById('topic-browser-close-btn')?.addEventListener('click', closeTopicBrowser);

document.getElementById('clear-topic-btn')?.addEventListener('click', () => {
  topicInput.value = '';
  updatePrompt();
  topicInput.focus();
  if (topicBrowserPanel && !topicBrowserPanel.hidden) renderTopicBrowser();
  showToast('✕ Topik dikosongkan.');
});

document.getElementById('reset-interaction-btn')?.addEventListener('click', () => {
  personaSelect.value = state.profile.defaultPersona || 'bro';
  roundsSelect.value = '3';
  interactionSelect.value = currentModule.defaultInteraction || 'chat';
  syncCustomSelects();
  updatePrompt();
  showToast('✕ Pengaturan mode dikembalikan ke default.');
});

document.addEventListener('click', (e) => {
  if (!e.target.isConnected) return;
  const wrap = document.getElementById('topic-browser-wrap');
  if (wrap && topicBrowserPanel && !topicBrowserPanel.hidden && !wrap.contains(e.target)) {
    closeTopicBrowser();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && topicBrowserPanel && !topicBrowserPanel.hidden) {
    closeTopicBrowser();
  }
});

topicSearchInput?.addEventListener('input', () => {
  renderTopicBrowser();
});

document.getElementById('random-topic-btn').addEventListener('click', () => {
  const pool =
    typeof generateTopicPoolForModule === 'function'
      ? generateTopicPoolForModule(currentModule, currentLang)
      : (currentModule.suggestions || []).map((t) => ({ text: t, categoryId: 'module-special' }));
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  topicInput.value = pick.text;
  activeTopicCatId = pick.categoryId || 'module-special';
  updatePrompt();
  if (topicBrowserPanel && !topicBrowserPanel.hidden) renderTopicBrowser();
  showToast(`🎲 Topik dipilih dari kategori: ${pick.subcategoryName || 'Pilihan Modul'}`);
});

document.getElementById('speak-prompt-btn').addEventListener('click', () => {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    stopSpeech();
    showToast('⏹ Pembacaan suara dihentikan.');
    return;
  }
  speakText(promptOutput.value, currentLang === 'en' ? 'en-US' : 'id-ID');
  showToast('🔊 Membacakan prompt... Klik Cancel untuk berhenti.');
});

document.getElementById('cancel-speak-btn').addEventListener('click', () => {
  stopSpeech();
  showToast('⏹ Pembacaan suara dihentikan.');
});

function copyPromptToClipboardSync() {
  const text = promptOutput.value.trim();
  if (!text) return '';

  try {
    promptOutput.focus({ preventScroll: true });
    promptOutput.select();
    document.execCommand('copy');
    window.getSelection()?.removeAllRanges();
  } catch {
    // Ignore fallback error
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  if (window.BrainForgeBridge && typeof window.BrainForgeBridge.postMessage === 'function') {
    window.BrainForgeBridge.postMessage(JSON.stringify({ action: 'copy', text }));
  }

  const copyBtn = document.getElementById('copy-prompt-btn');
  if (copyBtn) {
    copyBtn.textContent = '✅ Sudah Ter-Copy!';
    clearTimeout(copyBtn._timer);
    copyBtn._timer = setTimeout(() => {
      copyBtn.textContent = '📋 Copy Prompt';
    }, 3500);
  }

  return text;
}

function triggerLocalAutoPaste(promptText, delaySec = 4.0) {
  fetch('/api/auto-paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptText, delay: delaySec }),
  }).catch(() => {});
}

document.getElementById('copy-prompt-btn').addEventListener('click', () => {
  copyPromptToClipboardSync();
  showToast('✅ Prompt berhasil disalin ke clipboard! Siap di-paste (Ctrl+V).');
});

document.getElementById('launch-gemini-btn').addEventListener('click', () => {
  const text = copyPromptToClipboardSync();
  if (!text) return;
  // Sertakan #bf_prompt=... agar ekstensi Chrome gemini-autofill-extension langsung mengisi kolom Ask Gemini!
  const geminiUrlWithHash = `https://gemini.google.com/app#bf_prompt=${encodeURIComponent(text)}`;
  if (window.BrainForgeBridge && typeof window.BrainForgeBridge.postMessage === 'function') {
    window.BrainForgeBridge.postMessage(
      JSON.stringify({ action: 'open_url', url: 'https://gemini.google.com/app', text })
    );
    showToast('✅ Prompt disalin! Membuka Gemini di HP...');
    return;
  }
  triggerLocalAutoPaste(text, 4.0);
  window.open(geminiUrlWithHash, '_blank');
  showToast('✨ Membuka Gemini... Prompt otomatis ter-copy & siap di-autofill!');
});

document.getElementById('launch-chatgpt-btn').addEventListener('click', () => {
  const text = copyPromptToClipboardSync();
  if (!text) return;
  const q = encodeURIComponent(text);
  const chatGptUrl = `https://chatgpt.com/?q=${q}`;
  if (window.BrainForgeBridge && typeof window.BrainForgeBridge.postMessage === 'function') {
    window.BrainForgeBridge.postMessage(JSON.stringify({ action: 'open_url', url: chatGptUrl, text }));
    showToast('✅ Membuka ChatGPT dengan prompt otomatis...');
    return;
  }
  window.open(chatGptUrl, '_blank');
  showToast('✅ Prompt sudah ter-copy & dikirim otomatis ke ChatGPT!');
});

let lastCompleteSessionTs = 0;
let lastCompletedSessionKey = '';
let lastCircuitStepTs = 0;

document.getElementById('mark-complete-btn').addEventListener('click', () => {
  const now = Date.now();
  const sessionKey = `${currentModule.id}|${currentLevel}|${topicInput.value.trim()}`;
  if (sessionKey === lastCompletedSessionKey && now - lastCompleteSessionTs < 15000) {
    showToast('⏳ Sesi untuk topik & level ini baru saja diklaim! Silakan berlatih atau ganti topik terlebih dahulu.');
    return;
  }
  lastCompleteSessionTs = now;
  lastCompletedSessionKey = sessionKey;
  const earned = xpForLevel(currentLevel);
  recordSession(currentLevel, currentLang, topicInput.value.trim(), earned, currentModule.skill);
  showToast(`🎉 Sesi selesai! +${earned} XP & skill ${currentModule.skill.toUpperCase()} meningkat!`);
});

// ==================== CIRCUITS (4-STEP BRAIN CIRCUIT & 15-MIN SPEAKING CIRCUIT) ====================
document.getElementById('start-circuit-btn').addEventListener('click', () => {
  circuitActive = true;
  circuitMode = 'brain';
  circuitIndex = 0;
  lastCircuitStepTs = Date.now();
  clearInterval(circuitTimerInterval);
  openModule(BRAIN_CIRCUIT_IDS[0]);
  showToast('🧠 Daily Brain Circuit 4-Tahap dimulai!');
});

document.getElementById('start-speaking-circuit-btn')?.addEventListener('click', () => {
  circuitActive = true;
  circuitMode = 'speaking';
  circuitIndex = 0;
  lastCircuitStepTs = Date.now();
  openModule(SPEAKING_CIRCUIT_IDS[0]);
  startCircuitCountdown(300); // 5 menit per tahap (total 15 menit)
  showToast('🗣️ Latihan Bicara 15 Menit dimulai! Tahap 1: Conversation Initiation (5 Menit).');
});

document.getElementById('next-circuit-btn').addEventListener('click', () => {
  const now = Date.now();
  if (now - lastCircuitStepTs < 5000) {
    showToast('⏳ Selesaikan latihan pada tahap ini terlebih dahulu sebelum lanjut ke tahap berikutnya!');
    return;
  }
  lastCircuitStepTs = now;
  const list = circuitMode === 'speaking' ? SPEAKING_CIRCUIT_IDS : BRAIN_CIRCUIT_IDS;
  const earned = xpForLevel(currentLevel);
  recordSession(
    currentLevel,
    currentLang,
    `${circuitMode === 'speaking' ? '15m Speaking' : 'Brain Circuit'}: ${currentModule.title}`,
    earned,
    currentModule.skill
  );
  if (circuitIndex + 1 < list.length) {
    circuitIndex++;
    openModule(list[circuitIndex]);
    if (circuitMode === 'speaking') startCircuitCountdown(300);
  } else {
    const bonus = circuitMode === 'speaking' ? 75 : 60;
    circuitActive = false;
    clearInterval(circuitTimerInterval);
    state.xp += bonus;
    saveState();
    renderHeaderAndStats();
    workspaceView.classList.remove('active');
    dashboardView.classList.add('active');
    showToast(`👑 Sirkuit Tuntas! Bonus +${bonus} XP berhasil diklaim!`);
  }
});

document.getElementById('exit-circuit-btn').addEventListener('click', () => {
  circuitActive = false;
  clearInterval(circuitTimerInterval);
  circuitBanner.hidden = true;
});

// ==================== MODAL DIAGNOSTIK BICARA & KURIKULUM 14 HARI ====================
const diagnosticModal = document.getElementById('diagnostic-modal');
const diagnosticOptionsEl = document.getElementById('diagnostic-options');
const diagnosticResultEl = document.getElementById('diagnostic-result');
const fourteenDayListEl = document.getElementById('fourteen-day-list');
const planProgressBadge = document.getElementById('plan-progress-badge');

function renderDiagnosticAndPlanModal() {
  if (!diagnosticOptionsEl || typeof SPEAKING_DIAGNOSTIC_PROFILES === 'undefined') return;

  // 1. Render 4 Diagnostic Checkboxes (A, B, C, D)
  diagnosticOptionsEl.innerHTML = '';
  Object.values(SPEAKING_DIAGNOSTIC_PROFILES).forEach((prof) => {
    const isChecked = state.diagnosticCodes.includes(prof.code);
    const card = document.createElement('button');
    card.type = 'button';
    card.style.cssText = `text-align:left;padding:12px 14px;border-radius:12px;border:2px solid ${
      isChecked ? '#2563eb' : '#cbd5e1'
    };background:${isChecked ? '#eff6ff' : '#fff'};cursor:pointer;transition:all 0.15s;`;
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong style="color:#0f172a;font-size:14px;">${isChecked ? '☑️' : '⬜'} ${escapeHtml(prof.title)}</strong>
        <span class="badge badge-xp">Kondisi ${prof.code}</span>
      </div>
      <p style="margin-top:4px;font-size:13px;color:#475569;">${escapeHtml(prof.symptom)}</p>
    `;
    card.addEventListener('click', () => {
      if (state.diagnosticCodes.includes(prof.code)) {
        state.diagnosticCodes = state.diagnosticCodes.filter((c) => c !== prof.code);
      } else {
        state.diagnosticCodes.push(prof.code);
      }
      saveState();
      renderDiagnosticAndPlanModal();
    });
    diagnosticOptionsEl.appendChild(card);
  });

  // 2. Render Diagnosis Result & Recommended Modules
  if (!state.diagnosticCodes.length) {
    diagnosticResultEl.hidden = true;
  } else {
    diagnosticResultEl.hidden = false;
    const selectedProfiles = state.diagnosticCodes
      .map((c) => SPEAKING_DIAGNOSTIC_PROFILES[c])
      .filter(Boolean);
    const allMods = getAllModules();

    diagnosticResultEl.innerHTML = `
      <strong>🔍 Hasil Analisis Akar Masalah &amp; Rekomendasi Latihanmu:</strong>
      <div style="display:grid;gap:10px;margin-top:10px;">
        ${selectedProfiles
          .map((p) => {
            const modButtons = (p.recommendedModules || [])
              .map((mId) => {
                const m = allMods.find((x) => x.id === mId);
                return m
                  ? `<button type="button" class="btn-secondary btn-sm diag-launch-btn" data-mod-id="${m.id}" style="font-size:12px;padding:5px 10px;">${m.icon} Buka ${escapeHtml(m.title)}</button>`
                  : '';
              })
              .join(' ');
            return `
              <div style="padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #bfdbfe;">
                <div style="font-weight:700;color:#1e3a8a;">Kondisi ${p.code}: ${escapeHtml(p.rootCause)}</div>
                <div style="font-size:13px;color:#0f172a;margin-top:4px;">💡 <strong>Solusi Praktis:</strong> ${escapeHtml(p.actionTip)}</div>
                <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${modButtons}</div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    diagnosticResultEl.querySelectorAll('.diag-launch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        diagnosticModal.hidden = true;
        openModule(btn.dataset.modId);
      });
    });
  }

  // 3. Render 14-Day Speaking Curriculum
  if (fourteenDayListEl && typeof FOURTEEN_DAY_SPEAKING_PLAN !== 'undefined') {
    fourteenDayListEl.innerHTML = '';
    const doneCount = state.completedPlanDays.length;
    if (planProgressBadge) {
      planProgressBadge.textContent = `${doneCount} / ${FOURTEEN_DAY_SPEAKING_PLAN.length} Tahap Selesai`;
    }

    FOURTEEN_DAY_SPEAKING_PLAN.forEach((step, idx) => {
      const isDone = state.completedPlanDays.includes(idx);
      const row = document.createElement('div');
      row.style.cssText = `display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid ${
        isDone ? '#86efac' : '#e2e8f0'
      };background:${isDone ? '#f0fdf4' : '#fff'};flex-wrap:wrap;`;
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex:1;">
          <input type="checkbox" data-plan-idx="${idx}" ${isDone ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;" />
          <div>
            <strong style="font-size:13.5px;color:#0f172a;">${escapeHtml(step.day)} — ${escapeHtml(step.title)}</strong>
            <div style="font-size:12px;color:#64748b;">Target Level: ${step.level}</div>
          </div>
        </div>
        <button type="button" class="btn-primary btn-sm plan-open-btn" data-mod-id="${step.moduleId}" data-level="${step.level}" style="font-size:12px;padding:6px 12px;">
          Latih Sekarang →
        </button>
      `;

      row.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!state.completedPlanDays.includes(idx)) state.completedPlanDays.push(idx);
          recordSession(step.level, currentLang, `Kurikulum 14 Hari: ${step.day}`, 30, 'speaking');
          showToast(`✅ ${step.day} selesai! +30 XP Speaking!`);
        } else {
          state.completedPlanDays = state.completedPlanDays.filter((x) => x !== idx);
          saveState();
        }
        renderDiagnosticAndPlanModal();
      });

      row.querySelector('.plan-open-btn').addEventListener('click', () => {
        diagnosticModal.hidden = true;
        openModule(step.moduleId, step.level);
      });

      fourteenDayListEl.appendChild(row);
    });
  }
}

document.getElementById('open-diagnostic-btn')?.addEventListener('click', () => {
  renderDiagnosticAndPlanModal();
  diagnosticModal.hidden = false;
});

if (window.BrainForgeBridge) {
  document.body.classList.add('in-flutter-app');
}

document.getElementById('close-diagnostic-btn')?.addEventListener('click', () => {
  diagnosticModal.hidden = true;
});

// Clear History (With Safety Confirmation)
document.getElementById('clear-history-btn').addEventListener('click', () => {
  if (!window.confirm('Apakah kamu yakin ingin me-reset seluruh progres XP, level skill, dan riwayat latihan?')) {
    return;
  }
  state.xp = 0;
  state.streak = 0;
  state.lastActiveDate = null;
  state.skills = { memory: 0, recall: 0, listening: 0, speaking: 0, logic: 0 };
  state.completedPlanDays = [];
  state.history = [];
  saveState();
  renderHeaderAndStats();
  renderDashboard();
  showToast('Progres & statistik telah di-reset.');
});

// Profile Modal
const profileModal = document.getElementById('profile-modal');
const profileNameInput = document.getElementById('profile-name-input');
const profileLangSelect = document.getElementById('profile-lang-select');
const profilePersonaSelect = document.getElementById('profile-persona-select');

document.getElementById('open-profile-btn').addEventListener('click', () => {
  profileNameInput.value = state.profile.name || '';
  profileLangSelect.value = state.profile.defaultLang || 'bilingual';
  profilePersonaSelect.value = state.profile.defaultPersona || 'bro';
  syncCustomSelects();
  profileModal.hidden = false;
});

document.getElementById('close-profile-btn').addEventListener('click', () => {
  profileModal.hidden = true;
});

document.getElementById('save-profile-btn').addEventListener('click', () => {
  state.profile.name = profileNameInput.value.trim() || 'Guest';
  state.profile.defaultLang = profileLangSelect.value;
  state.profile.defaultPersona = profilePersonaSelect.value;
  currentLang = state.profile.defaultLang;
  personaSelect.value = state.profile.defaultPersona;
  saveState();
  renderHeaderAndStats();
  syncConfigButtons();
  renderTopicBrowser();
  updatePrompt();
  profileModal.hidden = true;
  showToast('Profil & preferensi berhasil disimpan!');
});

// Custom Module Modal
const customModuleModal = document.getElementById('custom-module-modal');
const cmTitleInput = document.getElementById('cm-title-input');
const cmSkillSelect = document.getElementById('cm-skill-select');
const cmDescInput = document.getElementById('cm-desc-input');
const cmTemplateInput = document.getElementById('cm-template-input');

document.getElementById('open-custom-modal-btn').addEventListener('click', () => {
  cmTitleInput.value = '';
  cmDescInput.value = '';
  customModuleModal.hidden = false;
});

document.getElementById('close-custom-modal-btn').addEventListener('click', () => {
  customModuleModal.hidden = true;
});

document.getElementById('save-custom-module-btn').addEventListener('click', () => {
  const title = cmTitleInput.value.trim();
  if (!title) {
    showToast('Nama modul wajib diisi!');
    return;
  }
  const skill = cmSkillSelect.value;
  const skillMeta = SKILL_META[skill] || SKILL_META.logic;
  const newMod = {
    id: `custom-${Date.now()}`,
    isCustom: true,
    category: 'custom',
    skill,
    title,
    icon: '✨',
    color: `linear-gradient(135deg, ${skillMeta.color}, #1e293b)`,
    tag: 'Custom Game',
    description: cmDescInput.value.trim() || 'Modul latihan kustom buatanmu sendiri.',
    webLabType: 'social',
    customTemplate: cmTemplateInput.value.trim(),
    levelHints: {
      Low: 'Level dasar & santai',
      Medium: 'Level menengah & terstruktur',
      Hard: 'Level lanjutan & intensif',
    },
    suggestions: ['Topik Eksplorasi 1', 'Topik Eksplorasi 2', 'Studi Kasus Nyata'],
  };
  state.customModules.push(newMod);
  saveState();
  customModuleModal.hidden = true;
  renderDashboard();
  openModule(newMod.id);
  showToast(`✨ Modul "${title}" berhasil dibuat!`);
});

const customSelectSyncers = [];

function closeAllCustomSelects(exceptPanel = null) {
  document.querySelectorAll('.custom-select-panel').forEach((panel) => {
    if (panel !== exceptPanel) {
      panel.hidden = true;
      panel.previousElementSibling?.classList.remove('open');
    }
  });
}

function syncCustomSelects() {
  customSelectSyncers.forEach((fn) => fn());
}

function initCustomSelects() {
  document.querySelectorAll('select').forEach((selectEl) => {
    if (selectEl.dataset.customized === '1') return;
    selectEl.dataset.customized = '1';
    selectEl.classList.add('custom-select-native');

    const wrap = document.createElement('div');
    wrap.className = 'custom-select-wrap' + (selectEl.classList.contains('text-input') ? ' is-full' : '');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'custom-select-label';
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'custom-select-arrow';
    arrowSpan.textContent = '▼';
    trigger.append(labelSpan, arrowSpan);

    const panel = document.createElement('div');
    panel.className = 'custom-select-panel';
    panel.hidden = true;

    const header = document.createElement('div');
    header.className = 'tb-panel-header';
    const titleEl = document.createElement('strong');
    titleEl.textContent = selectEl.title || 'Pilih Opsi';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close-red';
    closeBtn.title = 'Tutup dropdown';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllCustomSelects();
    });
    header.append(titleEl, closeBtn);

    const list = document.createElement('div');
    list.className = 'custom-select-list';
    panel.append(header, list);

    function sync() {
      const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      labelSpan.textContent = selectedOpt ? selectedOpt.textContent : '';
      list.innerHTML = '';
      Array.from(selectEl.options).forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = opt.value === selectEl.value;
        btn.className = 'custom-select-option' + (isActive ? ' active' : '');
        const textSpan = document.createElement('span');
        textSpan.textContent = opt.textContent;
        const checkSpan = document.createElement('span');
        checkSpan.className = 'custom-select-check';
        checkSpan.textContent = isActive ? '✓' : '';
        btn.append(textSpan, checkSpan);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectEl.value = opt.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          closeAllCustomSelects();
        });
        list.appendChild(btn);
      });
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = panel.hidden;
      closeAllCustomSelects(willOpen ? panel : null);
      closeTopicBrowser();
      panel.hidden = !willOpen;
      trigger.classList.toggle('open', willOpen);
      if (willOpen) sync();
    });

    selectEl.addEventListener('change', sync);
    customSelectSyncers.push(sync);
    sync();

    wrap.append(trigger, panel);
    selectEl.insertAdjacentElement('afterend', wrap);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrap')) closeAllCustomSelects();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllCustomSelects();
  });
}

// Initialize App
initCustomSelects();
renderHeaderAndStats();
renderDashboard();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
