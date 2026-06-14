# Changelog

Semua perubahan penting pada proyek ini dicatat di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/),
dan proyek ini memakai [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Lisensi MIT.
- Splash loading dengan animasi logo Pendar saat aplikasi dibuka (fade-out setelah siap, hormati `prefers-reduced-motion`).
- Retry/backoff otomatis untuk kegagalan awal streaming yang sementara (429/5xx/jaringan).
- Batas ukuran body pada proxy (`MAX_BODY_BYTES`, default 256KB) untuk mencegah penyalahgunaan.
- Harness test komponen (Vitest + jsdom + Testing Library) dan test untuk komponen, hook, serta modul i18n & progres belajar.
- Dependabot untuk pembaruan dependency npm & GitHub Actions mingguan.

### Changed
- Bot menjawab dalam Bahasa Indonesia memakai register santai "aku/kamu", bukan "saya/Anda".
- Prompt tugas VA ditingkatkan: brand voice, contoh few-shot, spesifikasi platform sosmed, discovery-gating proposal/harga, etiket bisnis Indonesia, dan aturan emoji yang konsisten.
- Aturan emoji: plain-text secara default, emoji secukupnya hanya untuk caption sosmed & balasan komunitas.
- Template "Riset online" menjadi "Rangkum riset" (jujur: bot tidak mengakses internet).

### Fixed
- README disinkronkan dengan fitur terkini; peringatan tegas soal env `VITE_*` yang ter-bundle ke klien.
