// src/learn/curriculum.ts
// Kurikulum "Belajar VA" — jalur lengkap dari pemula hingga expert, diajar oleh
// persona mentor: Virtual Assistant senior berpengalaman dengan penghasilan
// puluhan juta per bulan. Teks tampilan dwibahasa (id/en) mengikuti toggle
// bahasa web; `focus` hanya dipakai untuk menyusun system prompt mentor.
import type { Language } from '../ai/templates'

/** Persona mentor VA. Dipakai sebagai dasar system prompt tiap sesi belajar. */
export const MENTOR_SYSTEM_PROMPT = `You are Pendar Mentor, an experienced Senior Virtual Assistant and VA coach.

WHO YOU ARE
You have worked for years as a top Virtual Assistant and now earn tens of millions of rupiah per month from VA work. You have served many clients across administrative support, communication, social media, ecommerce, research, project coordination, and more. You now mentor people to become professional, high-earning Virtual Assistants from zero to expert.

YOUR MISSION
Teach the learner the current lesson clearly and practically so they truly master it and can apply it to real client work. Leave no gap: make sure the learner understands the concept, sees how it is done in the real world, and practices it. Your goal is to turn a beginner into a confident, well-paid professional VA, one lesson at a time.

HOW YOU TEACH (use this flow for every lesson)
1. Open warmly and state plainly what they will be able to do after this lesson and why it matters for earning as a VA.
2. Explain the concept in simple steps, from the basics up. Define any term the first time you use it.
3. Give at least one concrete, realistic example from actual VA work (a sample message, workflow, or before/after).
4. Share practical tips, common beginner mistakes to avoid, and the tools or templates a pro VA would use.
5. Give one short practice task the learner can do right now, and tell them to paste their attempt so you can give feedback.
6. End with a one-line recap and tell them what the next lesson or next step would be.

TEACHING STYLE
- Be encouraging, patient, and direct, like a senior colleague who genuinely wants the learner to succeed and earn well.
- Teach one lesson at a time. Do not dump the whole curriculum at once. Go deep on the current topic.
- Keep it concrete and execution-focused. Prefer real examples and ready-to-use phrasing over theory.
- Check understanding. Invite questions and adapt to the learner's level and answers.
- When the learner submits a practice attempt, review it honestly: praise what works, fix what does not, and show an improved version.
- Connect skills to income: explain how mastering this makes them more valuable, faster, or able to charge more.
- You may mention that Pendar (this app) and its task templates can speed up real client work once they start earning.
- When teaching in Indonesian, speak casually and warmly: call yourself "aku" and the learner "kamu", never the formal "saya"/"Anda". Talk like a real, approachable senior colleague.

LANGUAGE RULES
- Respond in the learner's language. If unclear, default to Indonesian. Use English only when asked.

HONESTY RULES
- Never invent fake client names, fake earnings guarantees, fake statistics, or fake tools. Teach realistic, proven practices. If income depends on effort and market, say so plainly.

OUTPUT RULES
Use clean plain text that is easy to read and copy. No markdown, no emojis, no tables, and no decorative symbols (no asterisks, hashes, underscores, backticks, or horizontal rules). For lists, use a simple hyphen at the start of the line. Keep sections short with clear line breaks.`

export type LevelId = 'pemula' | 'menengah' | 'mahir' | 'expert'

type Loc = Record<Language, string>
type LocList = Record<Language, string[]>

export interface Level {
  id: LevelId
  title: Loc
  tagline: Loc
}

export interface Lesson {
  id: string
  level: LevelId
  /** Judul materi (dwibahasa). */
  title: Loc
  /** Ringkasan satu kalimat untuk kartu materi (dwibahasa). */
  summary: Loc
  /** Hasil belajar yang diharapkan (dwibahasa). */
  objectives: LocList
  /** Arahan tambahan untuk mentor saat mengajar materi ini (prompt). */
  focus: string
}

export const LEVELS: Level[] = [
  {
    id: 'pemula',
    title: { id: 'Pemula', en: 'Beginner' },
    tagline: {
      id: 'Fondasi: kenali profesi VA, mindset, dan alat dasar.',
      en: 'Foundations: understand the VA profession, mindset, and basic tools.',
    },
  },
  {
    id: 'menengah',
    title: { id: 'Menengah', en: 'Intermediate' },
    tagline: {
      id: 'Skill inti VA yang dipakai untuk pekerjaan klien sehari-hari.',
      en: 'Core VA skills used for everyday client work.',
    },
  },
  {
    id: 'mahir',
    title: { id: 'Mahir', en: 'Advanced' },
    tagline: {
      id: 'Spesialisasi bernilai tinggi: sosmed, konten, ecommerce, tim.',
      en: 'High-value specializations: social media, content, ecommerce, teams.',
    },
  },
  {
    id: 'expert',
    title: { id: 'Expert', en: 'Expert' },
    tagline: {
      id: 'Bisnis VA: dapat klien, harga premium, skala, penghasilan besar.',
      en: 'VA business: win clients, premium pricing, scale, high income.',
    },
  },
]

export const LESSONS: Lesson[] = [
  // ── Pemula ───────────────────────────────────────────────────────────────
  {
    id: 'apa-itu-va',
    level: 'pemula',
    title: { id: 'Apa itu Virtual Assistant', en: 'What is a Virtual Assistant' },
    summary: {
      id: 'Pahami peran VA, jenis layanan, dan peluang penghasilannya.',
      en: 'Understand the VA role, types of services, and income opportunity.',
    },
    objectives: {
      id: [
        'Menjelaskan apa itu Virtual Assistant dan apa yang dikerjakan',
        'Mengenali jenis-jenis layanan VA dan klien yang membutuhkannya',
        'Memahami peluang penghasilan VA secara realistis',
      ],
      en: [
        'Explain what a Virtual Assistant is and what they do',
        'Recognize the types of VA services and the clients who need them',
        'Understand the VA income opportunity realistically',
      ],
    },
    focus:
      'Beri gambaran besar profesi VA: definisi, contoh tugas nyata, jenis klien (pemilik bisnis, agensi, kreator), model kerja (per jam, per proyek, retainer), dan rentang penghasilan yang masuk akal dari pemula hingga senior. Buat learner bersemangat sekaligus realistis.',
  },
  {
    id: 'mindset-etika',
    level: 'pemula',
    title: { id: 'Mindset & etika profesional', en: 'Professional mindset & ethics' },
    summary: {
      id: 'Bangun sikap kerja, kepercayaan, dan komunikasi yang dipercaya klien.',
      en: 'Build the work attitude, trust, and communication clients rely on.',
    },
    objectives: {
      id: [
        'Menerapkan mindset profesional dan dapat diandalkan',
        'Menjaga kerahasiaan dan etika kerja dengan klien',
        'Berkomunikasi dengan sopan, jelas, dan tepat waktu',
      ],
      en: [
        'Apply a professional, reliable mindset',
        'Keep confidentiality and work ethics with clients',
        'Communicate politely, clearly, and on time',
      ],
    },
    focus:
      'Ajarkan sikap yang membuat klien percaya: proaktif, jujur soal tenggat, menjaga kerahasiaan data, responsif, dan komunikasi yang jelas. Beri contoh frasa profesional saat menerima tugas, melapor progres, dan menyampaikan kabar buruk.',
  },
  {
    id: 'tools-dasar',
    level: 'pemula',
    title: { id: 'Tools wajib VA', en: 'Essential VA tools' },
    summary: {
      id: 'Kuasai alat dasar: email, kalender, Google Workspace, Notion/Trello.',
      en: 'Master the basics: email, calendar, Google Workspace, Notion/Trello.',
    },
    objectives: {
      id: [
        'Menggunakan email, kalender, dan Google Workspace dengan lancar',
        'Mengelola tugas dengan Notion, Trello, atau Asana',
        'Memilih alat komunikasi dan berbagi file yang tepat',
      ],
      en: [
        'Use email, calendar, and Google Workspace fluently',
        'Manage tasks with Notion, Trello, or Asana',
        'Choose the right communication and file-sharing tools',
      ],
    },
    focus:
      'Perkenalkan toolkit standar VA dan fungsinya: Gmail/Outlook, Google Calendar, Docs/Sheets/Drive, alat manajemen tugas (Trello/Notion/Asana), alat komunikasi (Slack/WhatsApp/Zoom). Tekankan fungsi, bukan tombol. Beri tips memilih dan menata alat agar rapi.',
  },
  {
    id: 'manajemen-waktu',
    level: 'pemula',
    title: { id: 'Manajemen waktu & produktivitas', en: 'Time management & productivity' },
    summary: {
      id: 'Atur prioritas, time tracking, dan kerja fokus agar output tinggi.',
      en: 'Set priorities, track time, and focus to keep output high.',
    },
    objectives: {
      id: [
        'Menyusun prioritas tugas dengan metode sederhana',
        'Melacak waktu kerja untuk klien per jam maupun proyek',
        'Menghindari kelelahan dengan ritme kerja yang sehat',
      ],
      en: [
        'Prioritize tasks with a simple method',
        'Track work time for hourly and project-based clients',
        'Avoid burnout with a healthy work rhythm',
      ],
    },
    focus:
      'Ajarkan prioritisasi (mis. urgent/important), blok waktu, dan time tracking (Toggl/Clockify) terutama untuk billing per jam. Beri contoh menata hari kerja VA dengan banyak klien dan cara menghindari overload.',
  },
  {
    id: 'setup-kerja',
    level: 'pemula',
    title: { id: 'Setup kerja remote & keamanan data', en: 'Remote work setup & data security' },
    summary: {
      id: 'Siapkan ruang kerja, koneksi, dan kebiasaan menjaga data klien.',
      en: 'Set up your workspace, connection, and habits to protect client data.',
    },
    objectives: {
      id: [
        'Menyiapkan perangkat, koneksi, dan ruang kerja yang andal',
        'Menjaga keamanan akun dan kerahasiaan data klien',
        'Menyiapkan sistem berkas dan kata sandi yang rapi',
      ],
      en: [
        'Set up reliable devices, connection, and workspace',
        'Keep accounts secure and client data confidential',
        'Organize a tidy file and password system',
      ],
    },
    focus:
      'Bahas kebutuhan kerja remote: perangkat, internet cadangan, password manager, otentikasi dua langkah, penataan folder, dan cara aman menerima akses akun klien. Tekankan tanggung jawab menjaga data.',
  },

  // ── Menengah ─────────────────────────────────────────────────────────────
  {
    id: 'admin-support',
    level: 'menengah',
    title: { id: 'Dukungan administratif & data entry', en: 'Administrative support & data entry' },
    summary: {
      id: 'Kerjakan tugas admin dan data entry dengan rapi, akurat, cepat.',
      en: 'Handle admin tasks and data entry neatly, accurately, and fast.',
    },
    objectives: {
      id: [
        'Mengerjakan tugas administratif dengan akurat dan rapi',
        'Melakukan data entry tanpa kesalahan dan terorganisir',
        'Membuat sistem pengarsipan yang mudah ditelusuri',
      ],
      en: [
        'Do administrative tasks accurately and neatly',
        'Perform data entry that is error-free and organized',
        'Build an easy-to-search filing system',
      ],
    },
    focus:
      'Ajarkan akurasi dan kerapian: konvensi penamaan file, struktur spreadsheet, validasi data, dan cara cek ulang. Beri latihan merapikan daftar data berantakan menjadi tabel rapi.',
  },
  {
    id: 'email-inbox',
    level: 'menengah',
    title: { id: 'Email management & inbox zero', en: 'Email management & inbox zero' },
    summary: {
      id: 'Tata inbox klien: prioritas, balasan profesional, dan tindak lanjut.',
      en: 'Organize the client inbox: priorities, professional replies, follow-ups.',
    },
    objectives: {
      id: [
        'Menyortir dan memprioritaskan inbox klien',
        'Menulis balasan email yang jelas dan profesional',
        'Menjaga inbox tetap teratur dengan label dan template',
      ],
      en: [
        'Sort and prioritize the client inbox',
        'Write clear, professional email replies',
        'Keep the inbox tidy with labels and templates',
      ],
    },
    focus:
      'Ajarkan triase inbox (label, filter, prioritas), menulis balasan ringkas dengan tujuan di depan dan langkah berikutnya yang jelas, serta membuat template balasan. Kaitkan dengan template Email/Balas klien di Pendar.',
  },
  {
    id: 'kalender-jadwal',
    level: 'menengah',
    title: { id: 'Calendar & scheduling', en: 'Calendar & scheduling' },
    summary: {
      id: 'Atur jadwal, rapat lintas zona waktu, dan hindari bentrok.',
      en: 'Manage schedules, cross-timezone meetings, and avoid clashes.',
    },
    objectives: {
      id: [
        'Mengelola kalender dan menjadwalkan rapat tanpa bentrok',
        'Menangani perbedaan zona waktu dengan benar',
        'Menggunakan alat penjadwalan dan mengirim undangan rapi',
      ],
      en: [
        'Manage the calendar and schedule meetings without clashes',
        'Handle timezone differences correctly',
        'Use scheduling tools and send tidy invites',
      ],
    },
    focus:
      'Ajarkan penjadwalan: cek ketersediaan, zona waktu, buffer antar rapat, alat seperti Calendly, dan konfirmasi/undangan yang sopan. Beri contoh kasus menjadwalkan rapat tiga peserta beda zona waktu.',
  },
  {
    id: 'notula-meeting',
    level: 'menengah',
    title: { id: 'Notula & ringkasan meeting', en: 'Meeting notes & summaries' },
    summary: {
      id: 'Ubah catatan rapat jadi keputusan dan action item yang jelas.',
      en: 'Turn meeting notes into clear decisions and action items.',
    },
    objectives: {
      id: [
        'Mencatat poin penting selama rapat secara terstruktur',
        'Menyusun ringkasan, keputusan, dan action item dengan pemilik',
        'Menandai hal ambigu untuk dikonfirmasi',
      ],
      en: [
        'Capture key points during a meeting in a structured way',
        'Produce a summary, decisions, and action items with owners',
        'Flag ambiguous items for confirmation',
      ],
    },
    focus:
      'Ajarkan struktur notula: ringkasan, keputusan, action item (pemilik + tenggat), pertanyaan terbuka, langkah berikutnya. Tekankan tidak mengarang. Kaitkan dengan template Ringkas meeting di Pendar.',
  },
  {
    id: 'komunikasi-klien',
    level: 'menengah',
    title: { id: 'Komunikasi & korespondensi klien', en: 'Client communication & correspondence' },
    summary: {
      id: 'Bangun hubungan klien lewat pesan yang jelas dan profesional.',
      en: 'Build client relationships through clear, professional messages.',
    },
    objectives: {
      id: [
        'Menulis pesan klien yang profesional, hangat, dan to the point',
        'Menyampaikan kabar sulit tanpa merusak hubungan',
        'Menyesuaikan nada dengan klien dan situasi',
      ],
      en: [
        'Write client messages that are professional, warm, and to the point',
        'Deliver difficult news without damaging the relationship',
        'Match tone to the client and situation',
      ],
    },
    focus:
      'Ajarkan korespondensi klien: struktur pesan, menyesuaikan formalitas, follow-up sopan, dan menangani revisi atau keterlambatan. Beri contoh balasan untuk situasi sulit. Kaitkan dengan template Balas klien & Follow-up.',
  },
  {
    id: 'customer-support',
    level: 'menengah',
    title: { id: 'Customer support', en: 'Customer support' },
    summary: {
      id: 'Tangani pertanyaan, keluhan, dan tiket pelanggan dengan empati.',
      en: 'Handle customer questions, complaints, and tickets with empathy.',
    },
    objectives: {
      id: [
        'Membalas pertanyaan dan keluhan pelanggan dengan empati',
        'Menyelesaikan masalah atau eskalasi dengan tepat',
        'Menjaga nada brand yang konsisten',
      ],
      en: [
        'Reply to customer questions and complaints with empathy',
        'Resolve or escalate issues appropriately',
        'Keep a consistent brand tone',
      ],
    },
    focus:
      'Ajarkan alur dukungan: pahami masalah, berempati, beri solusi atau langkah, dan tindak lanjut. Bahas menangani pelanggan marah dan menjaga konsistensi brand. Beri latihan membalas keluhan.',
  },
  {
    id: 'riset-data',
    level: 'menengah',
    title: { id: 'Riset online & organisasi data', en: 'Online research & data organization' },
    summary: {
      id: 'Cari, verifikasi, dan rangkum informasi jadi temuan actionable.',
      en: 'Find, verify, and summarize information into actionable findings.',
    },
    objectives: {
      id: [
        'Melakukan riset online yang efisien dan kredibel',
        'Memisahkan fakta dari asumsi dan mencatat sumber',
        'Merangkum temuan menjadi poin yang bisa ditindaklanjuti',
      ],
      en: [
        'Do efficient, credible online research',
        'Separate facts from assumptions and record sources',
        'Summarize findings into actionable points',
      ],
    },
    focus:
      'Ajarkan teknik riset: menyusun pertanyaan, sumber kredibel, mencatat sumber, dan merangkum jadi temuan kunci + rekomendasi. Tekankan tidak mengarang data. Kaitkan dengan template Riset online di Pendar.',
  },
  {
    id: 'crm-laporan',
    level: 'menengah',
    title: { id: 'CRM & reporting', en: 'CRM & reporting' },
    summary: {
      id: 'Perbarui CRM dan susun laporan rapi dari data klien.',
      en: 'Update the CRM and build tidy reports from client data.',
    },
    objectives: {
      id: [
        'Memperbarui dan menjaga kebersihan data CRM',
        'Menyusun laporan ringkas dari data yang ada',
        'Menyajikan angka dengan jujur dan jelas',
      ],
      en: [
        'Update and keep CRM data clean',
        'Build concise reports from existing data',
        'Present numbers honestly and clearly',
      ],
    },
    focus:
      'Ajarkan menjaga CRM (HubSpot/Notion/Sheets): konsistensi field, status lead, dan menyusun laporan (ringkasan, temuan, rekomendasi) tanpa mengarang metrik. Kaitkan dengan template Laporan di Pendar.',
  },

  // ── Mahir ────────────────────────────────────────────────────────────────
  {
    id: 'sosmed-management',
    level: 'mahir',
    title: { id: 'Social media management', en: 'Social media management' },
    summary: {
      id: 'Kelola akun sosmed: kalender konten, jadwal, dan keterlibatan.',
      en: 'Manage social accounts: content calendar, scheduling, and engagement.',
    },
    objectives: {
      id: [
        'Menyusun kalender konten dengan campuran yang seimbang',
        'Menjadwalkan dan memublikasikan konten lintas platform',
        'Memantau dan merespons interaksi audiens',
      ],
      en: [
        'Build a content calendar with a balanced mix',
        'Schedule and publish content across platforms',
        'Monitor and respond to audience interactions',
      ],
    },
    focus:
      'Ajarkan manajemen sosmed: strategi, content mix (edukasi, engagement, brand, produk, CTA), kalender konten, alat penjadwalan, dan analitik dasar. Beri contoh kalender mingguan. Kaitkan dengan template Caption sosmed.',
  },
  {
    id: 'content-creation',
    level: 'mahir',
    title: { id: 'Content creation & copywriting', en: 'Content creation & copywriting' },
    summary: {
      id: 'Tulis caption, hook, dan copy yang menarik tanpa klise.',
      en: 'Write captions, hooks, and copy that engage without cliché.',
    },
    objectives: {
      id: [
        'Menulis hook pembuka dan caption yang kuat',
        'Menyesuaikan gaya dengan platform dan audiens',
        'Memvariasikan CTA dan angle agar tidak repetitif',
      ],
      en: [
        'Write strong opening hooks and captions',
        'Adapt style to the platform and audience',
        'Vary CTAs and angles to avoid repetition',
      ],
    },
    focus:
      'Ajarkan dasar copywriting untuk VA: memahami audiens, hook, satu ide per konten, CTA bervariasi, dan menghindari klaim palsu. Beri latihan menulis tiga caption dengan angle berbeda.',
  },
  {
    id: 'ecommerce-listing',
    level: 'mahir',
    title: { id: 'Ecommerce & product listing', en: 'Ecommerce & product listings' },
    summary: {
      id: 'Buat listing produk, kelola pesanan, dan dukungan toko online.',
      en: 'Create product listings, manage orders, and support online stores.',
    },
    objectives: {
      id: [
        'Menulis deskripsi dan judul produk yang menjual',
        'Mengelola listing, stok, dan pesanan secara rapi',
        'Mendukung operasional toko di marketplace/Shopify',
      ],
      en: [
        'Write product titles and descriptions that sell',
        'Manage listings, stock, and orders neatly',
        'Support store operations on marketplaces/Shopify',
      ],
    },
    focus:
      'Ajarkan dukungan ecommerce: anatomi listing yang baik (judul, bullet manfaat, deskripsi, kata kunci), pengelolaan pesanan, dan dukungan toko. Beri latihan menulis listing dari spesifikasi produk.',
  },
  {
    id: 'lead-gen',
    level: 'mahir',
    title: { id: 'Lead generation & prospecting', en: 'Lead generation & prospecting' },
    summary: {
      id: 'Cari dan kumpulkan calon klien/pelanggan yang relevan.',
      en: 'Find and gather relevant prospective clients/customers.',
    },
    objectives: {
      id: [
        'Membangun daftar prospek yang tertarget dan rapi',
        'Mencari kontak yang relevan secara etis',
        'Menyiapkan data lead untuk tim sales atau klien',
      ],
      en: [
        'Build a targeted, tidy prospect list',
        'Find relevant contacts ethically',
        'Prepare lead data for the sales team or client',
      ],
    },
    focus:
      'Ajarkan lead gen: menentukan kriteria target, sumber pencarian (LinkedIn, direktori), menyusun daftar prospek rapi, dan praktik etis. Tekankan kualitas data. Beri contoh struktur sheet lead.',
  },
  {
    id: 'project-coordination',
    level: 'mahir',
    title: { id: 'Koordinasi proyek & tim remote', en: 'Project coordination & remote teams' },
    summary: {
      id: 'Jaga proyek tetap berjalan: tugas, tenggat, dan komunikasi tim.',
      en: 'Keep projects moving: tasks, deadlines, and team communication.',
    },
    objectives: {
      id: [
        'Memecah proyek menjadi tugas dengan pemilik dan tenggat',
        'Memantau progres dan menindaklanjuti hambatan',
        'Mengoordinasikan komunikasi tim remote',
      ],
      en: [
        'Break projects into tasks with owners and deadlines',
        'Track progress and follow up on blockers',
        'Coordinate remote team communication',
      ],
    },
    focus:
      'Ajarkan koordinasi proyek: memecah pekerjaan, papan tugas, status update, dan menindaklanjuti yang terlambat dengan sopan. Beri contoh update mingguan ke klien. Tekankan peran VA sebagai perekat tim.',
  },
  {
    id: 'sop-dokumentasi',
    level: 'mahir',
    title: { id: 'SOP & dokumentasi proses', en: 'SOPs & process documentation' },
    summary: {
      id: 'Tulis SOP dan panduan agar pekerjaan bisa diulang dan didelegasi.',
      en: 'Write SOPs and guides so work can be repeated and delegated.',
    },
    objectives: {
      id: [
        'Mendokumentasikan proses langkah demi langkah dengan jelas',
        'Membuat SOP yang mudah diikuti orang lain',
        'Menyusun template dan checklist kerja',
      ],
      en: [
        'Document processes step by step clearly',
        'Create SOPs others can easily follow',
        'Build work templates and checklists',
      ],
    },
    focus:
      'Ajarkan menulis SOP: tujuan, prasyarat, langkah berurutan, dan checklist. Tekankan kejelasan agar bisa didelegasikan. Beri latihan menulis SOP singkat dari satu tugas berulang. Ini fondasi untuk naik kelas jadi tim.',
  },
  {
    id: 'community-management',
    level: 'mahir',
    title: { id: 'Community management', en: 'Community management' },
    summary: {
      id: 'Kelola dan rawat komunitas: balas, moderasi, dan jaga suasana.',
      en: 'Run and nurture communities: reply, moderate, and keep the vibe.',
    },
    objectives: {
      id: [
        'Merespons komentar dan DM komunitas sesuai brand',
        'Memoderasi dengan adil dan menjaga suasana positif',
        'Menumbuhkan keterlibatan anggota',
      ],
      en: [
        'Respond to community comments and DMs on brand',
        'Moderate fairly and keep a positive atmosphere',
        'Grow member engagement',
      ],
    },
    focus:
      'Ajarkan community management: nada on-brand, menangani anggota sulit, moderasi adil, dan mendorong interaksi. Beri contoh membalas komentar positif, pertanyaan, dan keluhan. Kaitkan dengan template Balas komunitas.',
  },

  // ── Expert ───────────────────────────────────────────────────────────────
  {
    id: 'positioning-niche',
    level: 'expert',
    title: { id: 'Positioning, niche & personal branding', en: 'Positioning, niche & personal branding' },
    summary: {
      id: 'Pilih spesialisasi dan bangun citra agar menonjol dan dicari.',
      en: 'Choose a specialty and build an image that stands out and gets hired.',
    },
    objectives: {
      id: [
        'Memilih niche dan layanan andalan yang menguntungkan',
        'Membangun personal branding yang dipercaya',
        'Menyusun penawaran nilai yang jelas',
      ],
      en: [
        'Pick a profitable niche and signature service',
        'Build a trusted personal brand',
        'Craft a clear value proposition',
      ],
    },
    focus:
      'Ajarkan positioning: kenapa spesialis dibayar lebih, memilih niche sesuai minat dan pasar, menyusun value proposition, dan profil/branding (LinkedIn, portofolio). Beri latihan menulis satu kalimat positioning.',
  },
  {
    id: 'cari-klien',
    level: 'expert',
    title: { id: 'Mendapatkan klien', en: 'Getting clients' },
    summary: {
      id: 'Cari klien lewat platform, pitching, dan portofolio yang kuat.',
      en: 'Find clients via platforms, pitching, and a strong portfolio.',
    },
    objectives: {
      id: [
        'Menemukan klien di platform freelance dan jaringan',
        'Menulis pitch dan profil yang meyakinkan',
        'Membangun portofolio yang membuktikan kemampuan',
      ],
      en: [
        'Find clients on freelance platforms and networks',
        'Write convincing pitches and profiles',
        'Build a portfolio that proves your skills',
      ],
    },
    focus:
      'Ajarkan akuisisi klien: platform (Upwork, OnlineJobs, LinkedIn), menulis proposal/pitch yang menonjol, membangun portofolio meski belum punya klien, dan referral. Beri latihan menulis pitch singkat. Kaitkan dengan template Proposal.',
  },
  {
    id: 'proposal-harga',
    level: 'expert',
    title: { id: 'Proposal menang & harga premium', en: 'Winning proposals & premium pricing' },
    summary: {
      id: 'Susun proposal yang dipilih dan strategi harga/paket bernilai.',
      en: 'Write proposals that get picked and value-based pricing/packages.',
    },
    objectives: {
      id: [
        'Menyusun proposal yang berfokus pada hasil klien',
        'Menetapkan harga per jam, proyek, dan retainer',
        'Menawarkan paket bertingkat tanpa menjual murah',
      ],
      en: [
        'Write proposals focused on client outcomes',
        'Set hourly, project, and retainer pricing',
        'Offer tiered packages without underselling',
      ],
    },
    focus:
      'Ajarkan strategi harga: menghitung rate, model retainer vs proyek, paket Basic/Standard/Premium, dan menulis proposal yang fokus hasil. Bahas cara naik harga. Beri latihan menyusun paket. Kaitkan dengan template Proposal & Penawaran harga.',
  },
  {
    id: 'retensi-upsell',
    level: 'expert',
    title: { id: 'Retensi klien & upsell', en: 'Client retention & upsell' },
    summary: {
      id: 'Pertahankan klien jangka panjang dan tambah nilai layanan.',
      en: 'Keep clients long term and add value to your services.',
    },
    objectives: {
      id: [
        'Menjaga klien tetap puas dan loyal jangka panjang',
        'Menawarkan layanan tambahan secara natural',
        'Mengelola kontrak dan ekspektasi',
      ],
      en: [
        'Keep clients satisfied and loyal long term',
        'Offer add-on services naturally',
        'Manage contracts and expectations',
      ],
    },
    focus:
      'Ajarkan retensi: komunikasi proaktif, laporan nilai, meminta testimoni dan referral, serta upsell yang relevan. Bahas kontrak retainer dan menjaga batasan. Tekankan klien lama lebih murah daripada cari baru.',
  },
  {
    id: 'skala-tim',
    level: 'expert',
    title: { id: 'Naik kelas: agensi & bangun tim', en: 'Level up: agency & building a team' },
    summary: {
      id: 'Dari solo jadi agensi: delegasi, rekrut, dan kelola tim VA.',
      en: 'From solo to agency: delegate, recruit, and manage a VA team.',
    },
    objectives: {
      id: [
        'Mendelegasikan pekerjaan dengan SOP yang jelas',
        'Merekrut dan melatih VA lain',
        'Mengelola tim dan menjaga kualitas',
      ],
      en: [
        'Delegate work with clear SOPs',
        'Recruit and train other VAs',
        'Manage a team and maintain quality',
      ],
    },
    focus:
      'Ajarkan penskalaan: kapan mulai mendelegasi, merekrut VA, menggunakan SOP untuk menjaga kualitas, dan mengubah diri dari pelaksana jadi pengelola. Bahas margin agensi. Inilah lompatan menuju penghasilan jauh lebih besar.',
  },
  {
    id: 'penghasilan-puluhan-juta',
    level: 'expert',
    title: {
      id: 'Strategi penghasilan puluhan juta/bulan',
      en: 'Strategy for tens of millions/month income',
    },
    summary: {
      id: 'Rangkai skill, harga, dan klien jadi penghasilan besar yang stabil.',
      en: 'Combine skills, pricing, and clients into stable high income.',
    },
    objectives: {
      id: [
        'Menyusun bauran klien retainer untuk penghasilan stabil',
        'Menaikkan nilai per jam lewat spesialisasi dan hasil',
        'Membangun beberapa sumber penghasilan dari keahlian VA',
      ],
      en: [
        'Build a retainer client mix for stable income',
        'Raise your hourly value through specialization and results',
        'Build multiple income streams from VA skills',
      ],
    },
    focus:
      'Satukan semua pelajaran menjadi peta penghasilan: kombinasi retainer, menaikkan rate, spesialisasi bernilai tinggi, membangun tim, dan income tambahan (kursus, template, afiliasi). Beri hitung-hitungan realistis menuju puluhan juta per bulan dan tegaskan bahwa hasil bergantung usaha dan pasar.',
  },
  {
    id: 'ai-leverage',
    level: 'expert',
    title: { id: 'Gandakan output dengan AI', en: 'Multiply output with AI' },
    summary: {
      id: 'Pakai AI seperti Pendar untuk kerja lebih cepat dan bernilai jual.',
      en: 'Use AI like Pendar to work faster and increase your value.',
    },
    objectives: {
      id: [
        'Memakai AI untuk mempercepat tugas klien tanpa kehilangan kualitas',
        'Menjaga akurasi dan menghindari output mengarang',
        'Menjadikan kecepatan sebagai keunggulan bernilai jual',
      ],
      en: [
        'Use AI to speed up client tasks without losing quality',
        'Keep accuracy and avoid fabricated output',
        'Turn speed into a sellable advantage',
      ],
    },
    focus:
      'Ajarkan memanfaatkan AI sebagai co-pilot: mempercepat email, konten, riset, dan laporan lewat template Pendar, sambil tetap meninjau dan menjaga akurasi. Tekankan AI menggandakan output, bukan menggantikan tanggung jawab VA, dan ini bisa jadi keunggulan saat menetapkan harga.',
  },
]

export const TOTAL_LESSONS = LESSONS.length

export function lessonsByLevel(level: LevelId): Lesson[] {
  return LESSONS.filter((l) => l.level === level)
}

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id)
}

function levelTitle(level: LevelId, lang: Language): string {
  return LEVELS.find((l) => l.id === level)?.title[lang] ?? level
}

/** System prompt mentor untuk satu materi: persona + konteks materi aktif. */
export function buildLessonSystem(lesson: Lesson, lang: Language): string {
  const objectives = lesson.objectives[lang].map((o) => `- ${o}`).join('\n')
  return `${MENTOR_SYSTEM_PROMPT}

CURRENT LESSON
Level: ${levelTitle(lesson.level, lang)}
Title: ${lesson.title[lang]}
Summary: ${lesson.summary[lang]}
Learning objectives:
${objectives}
Teaching focus: ${lesson.focus}

Teach this lesson now using your teaching flow. Stay on this topic until the learner is ready to move on.`
}

/** Pesan pembuka dari learner yang memicu mentor mulai mengajar materi. */
export function buildLessonStarter(lesson: Lesson, lang: Language): string {
  const title = lesson.title[lang]
  return lang === 'en'
    ? `I want to learn the lesson "${title}". Please teach me from scratch, step by step, give real examples from VA work, then give me one short exercise to do.`
    : `Aku ingin belajar materi "${title}". Tolong ajari aku dari nol, langkah demi langkah, beri contoh nyata dari pekerjaan VA, lalu beri satu latihan singkat untuk kukerjakan.`
}
