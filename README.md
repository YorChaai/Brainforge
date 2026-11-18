# 🧠 BrainForge.AI Pro

**19 Cognitive, Speaking & Text Analysis Games** — Pusat latihan memori kerja (*working memory*), pendengaran (*listening*), bicara terstruktur anti-*blank*, Bahasa Inggris praktis, logika kritis, dan analisis teks dalam satu aplikasi ringan (Web, Standalone HTML, & Android APK).

---

## 📥 Cara Download & Memakai Aplikasi

Pilih cara yang paling mudah untuk perangkat Anda:

### 📱 1. Download Aplikasi Android (`.apk`)
1. Buka halaman **[Releases](../../releases/latest)** di repository GitHub ini.
2. Download file **`app-release.apk`** (atau **`BrainForge-Pro.apk`**).
3. Buka file `.apk` di HP Android Anda dan izinkan *Install from unknown sources* jika diminta.
4. Saat pertama kali dibuka, pilih **Izinkan Mikrofon (*While using the app*)** agar fitur suara & *Voice Lab* berjalan penuh.

> **Isi Aplikasi Android:** Sudah dilengkapi Hub Utama bergaya minimalis (**BrainForge.AI** + akses cepat **Inggrisku.AI**) dan halaman **Settings** terpisah.

---

### 🌐 2. Jalankan Tanpa Install (1 File HTML Mandiri — HP & PC)
1. Download file **[`BrainForge_HP_Standalone.html`](./BrainForge_HP_Standalone.html)** *(klik file tersebut lalu klik ikon **Download raw file**)*.
2. Buka langsung file tersebut menggunakan **Chrome / Safari / Edge** di HP atau Laptop Anda.
3. Seluruh **19 game**, **Web Lab Offline**, dan **1.008 topik terkurasi per game** sudah tertanam di dalam 1 file tersebut tanpa butuh server tambahan.

---

### 💻 3. Jalankan Lengkap di Laptop / PC (Dengan Ekstensi Auto-Fill Gemini)
```bash
git clone https://github.com/YorChaai/Brainforge.git
cd Brainforge
python server.py
```
Atau klik ganda **[`start_brainforge.bat`](./start_brainforge.bat)** di Windows.

- **Opsional (Auto-Paste ke Gemini di Chrome):**
  1. Buka `chrome://extensions` dan aktifkan **Developer mode**.
  2. Klik **Load unpacked** lalu pilih folder **[`gemini-autofill-extension/`](./gemini-autofill-extension)**.
  3. Saat Anda menekan **Lanjut ke Gemini**, prompt otomatis terisi di kolom input Gemini.

---

## ✨ Fitur Utama

- **Dual-Mode di Setiap Game:**
  - **🚀 Prompt Launcher (`Gemini` & `ChatGPT`)**: Merakit *Master Prompt* adaptif sesuai Level (`Low / Medium / Hard`), Bahasa (`Indonesia / English / Campur`), Gaya Coach, Jumlah Ronde (`3 / 5 / 10 / 20`), dan Mode (`Chat / Voice`).
  - **🎮 Web Lab Interaktif (Offline)**: Main langsung di dalam aplikasi tanpa AI luar — lengkap dengan Audio Multi-Voice (TTS), Rekam Suara (Mic STT), Timer 60 detik, dan evaluasi otomatis.
- **🎙️ Protokol Khusus Voice AI:**
  - AI menjelaskan singkat aturan main di awal lalu menunggu Anda mengucapkan **`"I'm ready to play [Nama Game]"`** sebelum memulai Ronde 1.
  - Pada game memori & pendengaran (*Memory Span Matrix*, *Listening Practice*, *Recall Percakapan*), AI otomatis **mengulang bacaan 3× berturut-turut** agar detail tidak terlewat.
  - Pada game *Conversation Continuation*, obrolan berantai terus mengalir di dalam 1 ronde sampai Anda sendiri memutuskan pindah ronde.
- **📚 1.008 Topik Terkurasi per Game** (`10 Kategori × 102 Subkategori` dalam ID & EN) yang otomatis disesuaikan dengan mekanisme game aktif.
- **⭐ Filter Bintang Prioritas Multi-Pilih (`★★★★★` s/d `★☆☆☆☆`)** & **Badge Mode (`Voice / Both (Voice) / Both (Text) / Text`)**.

---

## 🎮 Daftar 19 Games

| Kategori | Daftar Game |
| :--- | :--- |
| **🧠 4 Inti (Memory & Recall)** | Memory Span Matrix · Active Recall Reader · Listening Practice (Fakta Lisan) · Recall Percakapan (Dialog 2 Orang) |
| **💬 Latihan Bicara & Sosial (4)** | Structured Speaking (P-A-C & P-P-A-K) · Conversation Initiation (Buka & Nimbrung) · Conversation Continuation (Sambung Obrolan) · Simulasi Ngobrol 2 Arah (Live Sparring) |
| **⚡ Logika & Deep Thinking (4)** | Feynman Concept Deconstructor · Critical Thinking & Fallacy Hunter · Mental Math & Pattern Blitz · First-Principles Case Solver |
| **🗣️ Bahasa & English (4)** | Grammar in Action & Speaking Drill · Immersive Character Roleplay · Active Vocabulary & Story Weaver · Impromptu 1-Minute Pitch (PREP) |
| **🔬 Analisis Teks & Transkrip (3)** | Ekstraksi Fakta Atomic · Analisis Teks & Bukti Kutipan (`"..."`) · Rekonstruksi Transkrip & Modul 5 Pilar |

---

## 🛠️ Build dari Source Code (Developer)

1. **Sinkronkan Bundle HTML Mandiri (`BrainForge_HP_Standalone.html` & aset Flutter):**
   ```bash
   python build_standalone.py
   ```
2. **Build Android Release APK:**
   ```bash
   cd mobile_app
   flutter pub get
   flutter build apk --release
   ```
   Hasil build berada di `mobile_app/build/app/outputs/flutter-apk/app-release.apk`.
