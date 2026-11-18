# Graph Report - geminibikingames  (2026-11-15)

## Corpus Check
- 18 files · ~121,748 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .bat 6, (none) 3, .webmanifest 1)

## Summary
- 278 nodes · 337 edges · 20 communities (11 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- app.js
- prompts.js
- main.dart
- server.py
- openModule
- syncWebLabWithWorkspace
- manifest.json
- initCustomSelects
- sw.js
- 🏛️ ARSITEKTUR ISI SETIAP MODUL (STRUKTUR 5 PILAR ADAPTIF)
- promt Kutip.md
- Ponytail: The Lazy Senior Developer
- brainforge_app

## God Nodes (most connected - your core abstractions)
1. `openModule()` - 12 edges
2. `renderDiagnosticAndPlanModal()` - 9 edges
3. `recordSession()` - 8 edges
4. `syncWebLabWithWorkspace()` - 7 edges
5. `showToast()` - 6 edges
6. `renderDashboard()` - 6 edges
7. `escapeHtml()` - 6 edges
8. `speakText()` - 6 edges
9. `renderTopicBrowser()` - 6 edges
10. `BrainForgeHandler` - 6 edges

## Surprising Connections (you probably didn't know these)
- `renderDiagnosticAndPlanModal()` --calls--> `showToast()`  [EXTRACTED]
  app.js → app.js  _Bridges community 5 → community 4_

## Import Cycles
- None detected.

## Communities (20 total, 9 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.02
Nodes (118): arCustomBox, arCustomInput, arPassageText, arPassageTitle, arReadingBox, arRecallBox, arResultBox, arTimerBadge (+110 more)

### Community 1 - "prompts.js"
Cohesion: 0.13
Nodes (18): buildAdvancedPrompt(), _buildRawAdvancedPrompt(), CURATED_TOPIC_CATEGORIES, DEFAULT_MODULES, DIALOGUE_SCRIPTS, FOURTEEN_DAY_SPEAKING_PLAN, generateTopicPoolForModule(), getLanguageRule() (+10 more)

### Community 2 - "main.dart"
Cohesion: 0.09
Nodes (11): BrainForgeApp, BrainForgeWebViewPage, _BrainForgeWebViewPageState, build, _controller, createState, _handleWebViewBack, initState (+3 more)

### Community 3 - "server.py"
Cohesion: 0.11
Nodes (6): auto_paste_after_delay(), _worker(), BrainForgeHandler, DualStackServer, is_target_browser_foreground(), send_ctrl_v_native()

### Community 4 - "openModule"
Cohesion: 0.18
Nodes (18): escapeHtml(), getAllModules(), getRankInfo(), getTodayStr(), langLabel(), openModule(), recordSession(), renderDashboard() (+10 more)

### Community 5 - "syncWebLabWithWorkspace"
Cohesion: 0.10
Nodes (22): checkMathAnswer(), checkMiniGameAnswer(), cleanMarkdownForSpeech(), extractMeaningfulKeywords(), generateMathQuestion(), getScenarioListForModule(), initWebLabForModule(), loadAudioScenario() (+14 more)

### Community 7 - "manifest.json"
Cohesion: 0.33
Nodes (5): content_scripts, description, manifest_version, name, version

### Community 8 - "initCustomSelects"
Cohesion: 0.67
Nodes (4): closeAllCustomSelects(), closeTopicBrowser(), initCustomSelects(), sync()

### Community 12 - "🏛️ ARSITEKTUR ISI SETIAP MODUL (STRUKTUR 5 PILAR ADAPTIF)"
Cohesion: 0.15
Nodes (12): 1. Banner & Navigasi Modul, 2. Teks Narasi Lengkap (Penulisan Ulang Utuh & Mengalir), 3. Poin-Poin Analisis Mendalam & Terstruktur, 4. Prosedur, Visualisasi Alur, & Diagram Logika, 5. Toolkit Aksi, Template Siap Pakai, & Glosarium, 🏛️ ARSITEKTUR ISI SETIAP MODUL (STRUKTUR 5 PILAR ADAPTIF), MASTER PROMPT 2.0: TRANSFORMASI NASKAH & REKONSTRUKSI MODULAR DINAMIS, Pedoman Pembagian Modul: (+4 more)

### Community 13 - "promt Kutip.md"
Cohesion: 0.40
Nodes (4): Daftar topik yang dibahas, Informasi tambahan yang tersirat dalam teks (OPSIONAL, pisahkan dari hasil utama, dan WAJIB tetap berbasis kutipan jika digunakan), Penjelasan detail untuk setiap topik, Ringkasan isi teks (Gambaran umum, tanpa menghilangkan konteks utama, maksimal 3–5 kalimat, tanpa interpretasi tambahan)

### Community 14 - "Ponytail: The Lazy Senior Developer"
Cohesion: 0.50
Nodes (3): Lazy, Not Negligent, Ponytail: The Lazy Senior Developer, The 7-Rung Decision Ladder

## Knowledge Gaps
- **8 isolated node(s):** `_controller`, `main`, `build`, `createState`, `initState` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initCustomSelects()` connect `initCustomSelects` to `app.js`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `_controller`, `main`, `build` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.016129032258064516 - nodes in this community are weakly interconnected._
- **Why does `closeAllCustomSelects()` connect `initCustomSelects` to `app.js`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Should `prompts.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1286549707602339 - nodes in this community are weakly interconnected._
- **Should `main.dart` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `server.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11231884057971014 - nodes in this community are weakly interconnected._