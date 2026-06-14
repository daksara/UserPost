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
- Chat AI streaming dengan Groq atau Gemini
- Pemilih model dinamis — hanya menampilkan model chat yang relevan
- 8 template tugas freelance (proposal, balas klien, penawaran harga,
  ringkas brief, follow-up, caption sosmed, perbaiki/terjemah, deskripsi jasa)
- Salin jawaban sekali klik, hentikan generasi, mulai chat baru
- Tema gelap/terang, responsif (sidebar jadi drawer di mobile), installable PWA

## Struktur proyek
```
src/
  ai/
    types.ts        # Tipe + metadata provider (key url, model fallback)
    providers.ts    # Klien Groq & Gemini: listModels + streamChat (+ helper murni)
    templates.ts    # Template tugas freelance + system prompt
    providers.test.ts
  hooks/
    useSettings.ts  # Provider/API key/model tersimpan di localStorage
    useChat.ts      # Kirim pesan, streaming, batalkan, reset
    useTheme.ts     # Tema gelap/terang
  components/
    Sidebar.tsx     # Daftar template + aksi
    MessageBubble.tsx
    SettingsModal.tsx
    ModelPicker.tsx # Dropdown model dinamis
    Logo.tsx, ErrorBoundary.tsx
  App.tsx           # Shell utama (sidebar + chat + composer)
  main.tsx
```

## Catatan
- Semua panggilan AI terjadi di sisi klien. Untuk produksi dengan banyak
  pengguna, pertimbangkan proxy backend agar API key tidak ada di browser.
- Groq dan Gemini sama-sama mengizinkan panggilan langsung dari browser
  (CORS) memakai key pengguna.
