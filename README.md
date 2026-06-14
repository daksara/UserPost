# Pendar

Asisten AI untuk pekerjaan **freelance**. Pendar membantu menulis dan
merapikan pekerjaan klien — proposal, balasan pesan, penawaran harga,
ringkasan brief, follow-up, caption sosmed, deskripsi jasa, dan lainnya —
lewat chat AI dengan template siap pakai.

Bekerja langsung dari browser memakai API key milikmu sendiri: **Groq** dan
**Gemini**, lengkap dengan pemilih model yang menampilkan model relevan
(chat) secara dinamis. Tidak ada backend — key disimpan hanya di browser
(localStorage).

> Catatan riwayat: repo ini sebelumnya berupa app belajar web3 (wagmi/viem +
> Firebase). Versi tersebut sudah diganti total oleh asisten AI ini; lihat
> riwayat git bila butuh kode lama.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Groq (OpenAI-compatible) + Gemini (`generativelanguage` API),
  dipanggil langsung dari browser dengan streaming
- **PWA**: installable lewat `vite-plugin-pwa`
- **Hosting**: Vercel / static host apa pun (output statik murni)

---

## Cara pakai

### 1. Install & jalankan
```bash
npm install
npm run dev
```

### 2. Hubungkan AI
Buka menu **Pengaturan** di aplikasi, pilih provider, lalu tempel API key:
- **Groq** — https://console.groq.com/keys
- **Gemini** — https://aistudio.google.com/app/apikey

Daftar model relevan dimuat otomatis dari provider setelah key dimasukkan.
Key tersimpan di `localStorage` browser dan dikirim langsung ke provider.

Opsional, key default bisa diisi saat build lewat `.env`:
```bash
cp .env.example .env
# isi VITE_GROQ_API_KEY / VITE_GEMINI_API_KEY (opsional)
```

### 3. Quality checks
```bash
npm run lint   # ESLint
npm test       # Vitest (helper provider AI)
npm run build  # typecheck + production build
```
CI (GitHub Actions) menjalankan ketiganya pada tiap push dan pull request.

---

## Fitur
- Belajar VA dari pemula hingga expert — kurikulum berjenjang (Pemula,
  Menengah, Mahir, Expert) berisi puluhan materi yang mencakup seluruh skill VA
  plus jalur penghasilan puluhan juta/bulan. Tiap materi diajar langsung oleh
  mentor AI (berperan sebagai VA senior berpengalaman): klik "Mulai belajar" dan
  mentor otomatis mengajar langkah demi langkah, beri contoh nyata, dan latihan.
  Progres belajar tersimpan di browser (localStorage)
- Chat AI streaming dengan Groq atau Gemini
- Riwayat percakapan persisten — banyak percakapan tersimpan di browser
  (localStorage), judul otomatis dari pesan pertama, pindah/hapus dari sidebar
- Pemilih model dinamis — hanya menampilkan model chat yang relevan
- 8 template tugas freelance (proposal, balas klien, penawaran harga,
  ringkas brief, follow-up, caption sosmed, perbaiki/terjemah, deskripsi jasa)
- Regenerasi jawaban, salin sekali klik, hentikan generasi, mulai chat baru
- Composer dengan textarea auto-grow dan auto-scroll cerdas (tidak terenggut
  saat membaca riwayat lama)
- Tema gelap/terang, responsif (sidebar jadi drawer di mobile), installable PWA

## Keamanan & mode koneksi
Pendar punya dua mode transport ke provider AI:

- **Mode A — Bring-your-own-key (default).** Tiap user menempel API key sendiri
  di Pengaturan; key disimpan di `localStorage` dan dikirim langsung dari
  browser ke Groq/Gemini. Cocok untuk **alat pribadi**. Risiko: siapa pun yang
  mengakses browser itu bisa membaca key.
- **Mode B — Proxy server (disarankan untuk publik/multi-user).** Build dengan
  `VITE_USE_PROXY=1`; front-end memanggil `/api/proxy` dan **server** yang
  menyisipkan key dari env (`GROQ_API_KEY` / `GEMINI_API_KEY`). Key **tidak
  pernah** ada di browser. `api/proxy.ts` adalah Vercel Edge Function dan
  meneruskan streaming chat apa adanya.

  Proxy dikunci agar tidak jadi *open relay*: hanya menerima `POST`, hanya
  meneruskan path yang masuk allow-list (daftar model + chat), dan menolak
  request dari origin lain (default: harus sama dengan origin deploy; atur
  `ALLOWED_ORIGINS` bila front-end dilayani dari domain berbeda).

  Opsional, rate-limit per-IP bisa diaktifkan dengan mengisi
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis, gratis).
  Tanpa keduanya, rate-limit dilewati (fail-open). Ambang batas diatur lewat
  `RL_MAX` (request) & `RL_WINDOW` (detik); default 30 request / 60 detik.

Catatan keamanan lain: seluruh teks dirender sebagai teks biasa (tanpa
`dangerouslySetInnerHTML`), jadi tidak ada jalur XSS dari jawaban AI. Kerentanan
`npm audit` yang ada hanya menyangkut `esbuild`/`vite` saat **dev server**, tidak
ikut ter-bundle ke hasil produksi.

### Deploy aman ke Vercel (Mode B)
```bash
# Environment Variables di dashboard Vercel:
#   VITE_USE_PROXY = 1            (build-time, dibaca front-end)
#   GROQ_API_KEY   = ...          (server-only, JANGAN pakai prefix VITE_)
#   GEMINI_API_KEY = ...          (server-only)
vercel
```

## Struktur proyek
```
api/
  proxy.ts          # Vercel Edge Function — proxy key-aman ke Groq/Gemini
src/
  ai/
    types.ts        # Tipe + metadata provider (key url, model fallback)
    providers.ts    # Klien Groq & Gemini: listModels + streamChat (langsung/proxy)
    templates.ts    # Template tugas freelance + system prompt
    clean.ts        # Pembersih output (buang markdown/emoji) + test
    providers.test.ts
  learn/
    curriculum.ts   # Kurikulum VA (pemula→expert) + persona mentor + builder prompt
    progress.ts     # Helper murni progres belajar (sanitasi, per-level, persen)
    curriculum.test.ts
  chat/
    types.ts        # Tipe percakapan + helper murni (judul, sanitasi) + test
  hooks/
    useSettings.ts      # Provider/API key/model tersimpan di localStorage
    useConversations.ts # Riwayat percakapan persisten (banyak chat) di localStorage
    useChat.ts          # Streaming, kirim, regenerasi, batalkan
    useLearning.ts      # Progres materi belajar VA tersimpan di localStorage
    useTheme.ts         # Tema gelap/terang
  components/
    Sidebar.tsx     # Riwayat percakapan + aksi (belajar VA, tema, pengaturan)
    LearnModal.tsx  # Akademi VA: jelajah kurikulum, progres, mulai sesi belajar
    Composer.tsx    # Kolom tulis: auto-grow + Kirim/Stop/Regenerasi
    MessageBubble.tsx
    SettingsModal.tsx
    ModelPicker.tsx # Dropdown model dinamis
    Logo.tsx, ErrorBoundary.tsx
  App.tsx           # Shell utama (sidebar + chat + composer)
  main.tsx
```

## Catatan
- Default-nya panggilan AI client-side (Mode A). Untuk produksi multi-user,
  pakai Mode B (proxy) agar API key tidak ada di browser — lihat bagian
  "Keamanan & mode koneksi".
- Groq dan Gemini sama-sama mengizinkan panggilan langsung dari browser
  (CORS) memakai key pengguna.
