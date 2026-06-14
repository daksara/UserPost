// src/i18n/translations.ts
// Kamus teks antarmuka untuk toggle bahasa web (Indonesia/English). Kunci
// dipakai lewat helper t() dari useI18n. Placeholder {nama} diganti saat render.
import type { Language } from '../ai/templates'

const id = {
  // Sidebar
  'sidebar.tag': 'AI Co-Pilot Virtual Assistant',
  'sidebar.newChat': '+ Chat baru',
  'sidebar.learnVA': 'Belajar VA',
  'sidebar.history': 'Riwayat',
  'sidebar.historyEmpty': 'Belum ada percakapan. Mulai dengan menulis pesan.',
  'sidebar.settings': 'Pengaturan',
  'sidebar.language': 'Bahasa',
  'sidebar.toLight': 'Ganti ke tema terang',
  'sidebar.toDark': 'Ganti ke tema gelap',
  'sidebar.lightTheme': 'Tema terang',
  'sidebar.darkTheme': 'Tema gelap',
  'sidebar.deleteConv': 'Hapus percakapan "{title}"',
  'sidebar.delete': 'Hapus',

  // Document title & error boundary
  'app.title': 'Pendar — AI Co-Pilot untuk Virtual Assistant',
  'error.title': 'Terjadi kesalahan',
  'error.body': 'Terjadi kesalahan tak terduga. Muat ulang aplikasi untuk melanjutkan.',
  'error.reload': 'Muat ulang',

  // Header & notice
  'app.openMenu': 'Buka menu',
  'app.noKey': 'tanpa key',
  'app.assistant': 'Asisten',
  'app.learnPrefix': 'Belajar: {title}',
  'app.noticeBefore': 'Belum ada API key. ',
  'app.noticeLink': 'Buka Pengaturan',
  'app.noticeAfter': ' untuk menghubungkan Groq atau Gemini.',

  // Composer placeholders
  'composer.lesson': 'Jawab latihan mentor atau tanya apa pun tentang materi…',
  'composer.template': 'Lengkapi detail untuk "{title}"…',
  'composer.default': 'Tulis tugas atau pertanyaanmu…',
  'composer.templates': 'Template',
  'composer.pickTemplate': 'Pilih template',
  'composer.hint': 'Enter kirim · Shift+Enter baris baru',
  'composer.stop': 'Stop',
  'composer.send': 'Kirim',

  // Message bubble
  'msg.copy': 'Salin',
  'msg.copied': 'Tersalin',

  // Welcome
  'welcome.title': 'Halo, saya Pendar',

  // Settings modal
  'settings.title': 'Pengaturan',
  'settings.close': 'Tutup',
  'settings.provider': 'Penyedia AI',
  'settings.apiKey': 'API Key — {name}',
  'settings.proxyHint':
    'Dikelola oleh server (mode proxy). Key tidak disimpan di browser — tidak perlu memasukkan apa pun di sini.',
  'settings.getKey': 'Dapatkan key',
  'settings.keyPlaceholder': 'Tempel API key {name}…',
  'settings.show': 'Lihat',
  'settings.hide': 'Sembunyi',
  'settings.keyHint':
    'Key disimpan hanya di browser ini (localStorage) dan dikirim langsung ke {name}.',
  'settings.done': 'Selesai',

  // Model picker
  'model.label': 'Model',
  'model.loading': 'Memuat…',
  'model.reload': 'Muat ulang',
  'model.enterKey': 'Masukkan API key untuk memuat daftar model terbaru.',
  'model.available': '{n} model relevan tersedia.',

  // Learn modal
  'learn.title': 'Belajar jadi VA — pemula sampai expert',
  'learn.intro':
    'Belajar langsung dari mentor AI yang berperan sebagai Virtual Assistant senior berpengalaman. Pilih materi, mentor akan mengajarimu langkah demi langkah, memberi contoh nyata, dan latihan — tanpa ada pelajaran yang tertinggal.',
  'learn.overall': 'Progres keseluruhan',
  'learn.overallCount': '{done}/{total} materi · {percent}%',
  'learn.start': 'Mulai belajar',
  'learn.repeat': 'Ulangi',
  'learn.done': 'Selesai',
} as const

const en: Record<keyof typeof id, string> = {
  // Sidebar
  'sidebar.tag': 'AI Co-Pilot for Virtual Assistants',
  'sidebar.newChat': '+ New chat',
  'sidebar.learnVA': 'Learn VA',
  'sidebar.history': 'History',
  'sidebar.historyEmpty': 'No conversations yet. Start by writing a message.',
  'sidebar.settings': 'Settings',
  'sidebar.language': 'Language',
  'sidebar.toLight': 'Switch to light theme',
  'sidebar.toDark': 'Switch to dark theme',
  'sidebar.lightTheme': 'Light theme',
  'sidebar.darkTheme': 'Dark theme',
  'sidebar.deleteConv': 'Delete conversation "{title}"',
  'sidebar.delete': 'Delete',

  // Document title & error boundary
  'app.title': 'Pendar — AI Co-Pilot for Virtual Assistants',
  'error.title': 'Something went wrong',
  'error.body': 'An unexpected error occurred. Reload the app to continue.',
  'error.reload': 'Reload',

  // Header & notice
  'app.openMenu': 'Open menu',
  'app.noKey': 'no key',
  'app.assistant': 'Assistant',
  'app.learnPrefix': 'Learning: {title}',
  'app.noticeBefore': 'No API key yet. ',
  'app.noticeLink': 'Open Settings',
  'app.noticeAfter': ' to connect Groq or Gemini.',

  // Composer placeholders
  'composer.lesson': "Answer the mentor's exercise or ask anything about the lesson…",
  'composer.template': 'Fill in the details for "{title}"…',
  'composer.default': 'Write your task or question…',
  'composer.templates': 'Templates',
  'composer.pickTemplate': 'Choose template',
  'composer.hint': 'Enter to send · Shift+Enter for a new line',
  'composer.stop': 'Stop',
  'composer.send': 'Send',

  // Message bubble
  'msg.copy': 'Copy',
  'msg.copied': 'Copied',

  // Welcome
  'welcome.title': "Hi, I'm Pendar",

  // Settings modal
  'settings.title': 'Settings',
  'settings.close': 'Close',
  'settings.provider': 'AI provider',
  'settings.apiKey': 'API Key — {name}',
  'settings.proxyHint':
    "Managed by the server (proxy mode). The key is not stored in the browser — you don't need to enter anything here.",
  'settings.getKey': 'Get key',
  'settings.keyPlaceholder': 'Paste your {name} API key…',
  'settings.show': 'Show',
  'settings.hide': 'Hide',
  'settings.keyHint':
    'The key is stored only in this browser (localStorage) and sent directly to {name}.',
  'settings.done': 'Done',

  // Model picker
  'model.label': 'Model',
  'model.loading': 'Loading…',
  'model.reload': 'Reload',
  'model.enterKey': 'Enter an API key to load the latest model list.',
  'model.available': '{n} relevant models available.',

  // Learn modal
  'learn.title': 'Learn to be a VA — beginner to expert',
  'learn.intro':
    'Learn directly from an AI mentor playing the role of an experienced senior Virtual Assistant. Pick a lesson and the mentor will teach you step by step, give real examples, and exercises — with nothing left behind.',
  'learn.overall': 'Overall progress',
  'learn.overallCount': '{done}/{total} lessons · {percent}%',
  'learn.start': 'Start learning',
  'learn.repeat': 'Repeat',
  'learn.done': 'Done',
}

export type MsgKey = keyof typeof id

export const MESSAGES: Record<Language, Record<MsgKey, string>> = { id, en }

export type TFunc = (key: MsgKey, params?: Record<string, string | number>) => string

/** Buat fungsi penerjemah untuk bahasa tertentu, dengan substitusi {placeholder}. */
export function createT(lang: Language): TFunc {
  const dict = MESSAGES[lang]
  return (key, params) => {
    let out = dict[key]
    if (params) {
      for (const k of Object.keys(params)) {
        out = out.replace(`{${k}}`, String(params[k]))
      }
    }
    return out
  }
}
