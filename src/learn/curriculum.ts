// src/learn/curriculum.ts
// Kurikulum "Belajar VA" — jalur lengkap dari pemula hingga expert, diajarkan
// oleh persona mentor: Virtual Assistant senior berpengalaman dengan penghasilan
// puluhan juta per bulan. Tiap materi memberi tujuan belajar dan fokus mengajar
// yang dipakai untuk menyusun system prompt mentor saat sesi dimulai.

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

LANGUAGE RULES
- Respond in the learner's language. If unclear, default to Indonesian. Use English only when asked.

HONESTY RULES
- Never invent fake client names, fake earnings guarantees, fake statistics, or fake tools. Teach realistic, proven practices. If income depends on effort and market, say so plainly.

OUTPUT RULES
Use clean plain text that is easy to read and copy. No markdown, no emojis, no tables, and no decorative symbols (no asterisks, hashes, underscores, backticks, or horizontal rules). For lists, use a simple hyphen at the start of the line. Keep sections short with clear line breaks.`

export type LevelId = 'pemula' | 'menengah' | 'mahir' | 'expert'

export interface Level {
  id: LevelId
  title: string
  tagline: string
}

export interface Lesson {
  id: string
  level: LevelId
  title: string
  /** Ringkasan satu kalimat untuk kartu materi. */
  summary: string
  /** Hasil belajar yang diharapkan (ditampilkan & dikirim ke mentor). */
  objectives: string[]
  /** Arahan tambahan untuk mentor saat mengajar materi ini. */
  focus: string
}

export const LEVELS: Level[] = [
  {
    id: 'pemula',
    title: 'Pemula',
    tagline: 'Fondasi: kenali profesi VA, mindset, dan alat dasar.',
  },
  {
    id: 'menengah',
    title: 'Menengah',
    tagline: 'Skill inti VA yang dipakai untuk pekerjaan klien sehari-hari.',
  },
  {
    id: 'mahir',
    title: 'Mahir',
    tagline: 'Spesialisasi bernilai tinggi: sosmed, konten, ecommerce, tim.',
  },
  {
    id: 'expert',
    title: 'Expert',
    tagline: 'Bisnis VA: dapat klien, harga premium, skala, penghasilan besar.',
  },
]

export const LESSONS: Lesson[] = [
  // ── Pemula ───────────────────────────────────────────────────────────────
  {
    id: 'apa-itu-va',
    level: 'pemula',
    title: 'Apa itu Virtual Assistant',
    summary: 'Pahami peran VA, jenis layanan, dan peluang penghasilannya.',
    objectives: [
      'Menjelaskan apa itu Virtual Assistant dan apa yang dikerjakan',
      'Mengenali jenis-jenis layanan VA dan klien yang membutuhkannya',
      'Memahami peluang penghasilan VA secara realistis',
    ],
    focus:
      'Beri gambaran besar profesi VA: definisi, contoh tugas nyata, jenis klien (pemilik bisnis, agensi, kreator), model kerja (per jam, per proyek, retainer), dan rentang penghasilan yang masuk akal dari pemula hingga senior. Buat learner bersemangat sekaligus realistis.',
  },
  {
    id: 'mindset-etika',
    level: 'pemula',
    title: 'Mindset & etika profesional',
    summary: 'Bangun sikap kerja, kepercayaan, dan komunikasi yang dipercaya klien.',
    objectives: [
      'Menerapkan mindset profesional dan dapat diandalkan',
      'Menjaga kerahasiaan dan etika kerja dengan klien',
      'Berkomunikasi dengan sopan, jelas, dan tepat waktu',
    ],
    focus:
      'Ajarkan sikap yang membuat klien percaya: proaktif, jujur soal tenggat, menjaga kerahasiaan data, responsif, dan komunikasi yang jelas. Beri contoh frasa profesional saat menerima tugas, melapor progres, dan menyampaikan kabar buruk.',
  },
  {
    id: 'tools-dasar',
    level: 'pemula',
    title: 'Tools wajib VA',
    summary: 'Kuasai alat dasar: email, kalender, Google Workspace, Notion/Trello.',
    objectives: [
      'Menggunakan email, kalender, dan Google Workspace dengan lancar',
      'Mengelola tugas dengan Notion, Trello, atau Asana',
      'Memilih alat komunikasi dan berbagi file yang tepat',
    ],
    focus:
      'Perkenalkan toolkit standar VA dan fungsinya: Gmail/Outlook, Google Calendar, Docs/Sheets/Drive, alat manajemen tugas (Trello/Notion/Asana), alat komunikasi (Slack/WhatsApp/Zoom). Tekankan fungsi, bukan tombol. Beri tips memilih dan menata alat agar rapi.',
  },
  {
    id: 'manajemen-waktu',
    level: 'pemula',
    title: 'Manajemen waktu & produktivitas',
    summary: 'Atur prioritas, time tracking, dan kerja fokus agar output tinggi.',
    objectives: [
      'Menyusun prioritas tugas dengan metode sederhana',
      'Melacak waktu kerja untuk klien per jam maupun proyek',
      'Menghindari kelelahan dengan ritme kerja yang sehat',
    ],
    focus:
      'Ajarkan prioritisasi (mis. urgent/important), blok waktu, dan time tracking (Toggl/Clockify) terutama untuk billing per jam. Beri contoh menata hari kerja VA dengan banyak klien dan cara menghindari overload.',
  },
  {
    id: 'setup-kerja',
    level: 'pemula',
    title: 'Setup kerja remote & keamanan data',
    summary: 'Siapkan ruang kerja, koneksi, dan kebiasaan menjaga data klien.',
    objectives: [
      'Menyiapkan perangkat, koneksi, dan ruang kerja yang andal',
      'Menjaga keamanan akun dan kerahasiaan data klien',
      'Menyiapkan sistem berkas dan kata sandi yang rapi',
    ],
    focus:
      'Bahas kebutuhan kerja remote: perangkat, internet cadangan, password manager, otentikasi dua langkah, penataan folder, dan cara aman menerima akses akun klien. Tekankan tanggung jawab menjaga data.',
  },

  // ── Menengah ─────────────────────────────────────────────────────────────
  {
    id: 'admin-support',
    level: 'menengah',
    title: 'Dukungan administratif & data entry',
    summary: 'Kerjakan tugas admin dan data entry dengan rapi, akurat, cepat.',
    objectives: [
      'Mengerjakan tugas administratif dengan akurat dan rapi',
      'Melakukan data entry tanpa kesalahan dan terorganisir',
      'Membuat sistem pengarsipan yang mudah ditelusuri',
    ],
    focus:
      'Ajarkan akurasi dan kerapian: konvensi penamaan file, struktur spreadsheet, validasi data, dan cara cek ulang. Beri latihan merapikan daftar data berantakan menjadi tabel rapi.',
  },
  {
    id: 'email-inbox',
    level: 'menengah',
    title: 'Email management & inbox zero',
    summary: 'Tata inbox klien: prioritas, balasan profesional, dan tindak lanjut.',
    objectives: [
      'Menyortir dan memprioritaskan inbox klien',
      'Menulis balasan email yang jelas dan profesional',
      'Menjaga inbox tetap teratur dengan label dan template',
    ],
    focus:
      'Ajarkan triase inbox (label, filter, prioritas), menulis balasan ringkas dengan tujuan di depan dan langkah berikutnya yang jelas, serta membuat template balasan. Kaitkan dengan template Email/Balas klien di Pendar.',
  },
  {
    id: 'kalender-jadwal',
    level: 'menengah',
    title: 'Calendar & scheduling',
    summary: 'Atur jadwal, rapat lintas zona waktu, dan hindari bentrok.',
    objectives: [
      'Mengelola kalender dan menjadwalkan rapat tanpa bentrok',
      'Menangani perbedaan zona waktu dengan benar',
      'Menggunakan alat penjadwalan dan mengirim undangan rapi',
    ],
    focus:
      'Ajarkan penjadwalan: cek ketersediaan, zona waktu, buffer antar rapat, alat seperti Calendly, dan konfirmasi/undangan yang sopan. Beri contoh kasus menjadwalkan rapat tiga peserta beda zona waktu.',
  },
  {
    id: 'notula-meeting',
    level: 'menengah',
    title: 'Notula & ringkasan meeting',
    summary: 'Ubah catatan rapat jadi keputusan dan action item yang jelas.',
    objectives: [
      'Mencatat poin penting selama rapat secara terstruktur',
      'Menyusun ringkasan, keputusan, dan action item dengan pemilik',
      'Menandai hal ambigu untuk dikonfirmasi',
    ],
    focus:
      'Ajarkan struktur notula: ringkasan, keputusan, action item (pemilik + tenggat), pertanyaan terbuka, langkah berikutnya. Tekankan tidak mengarang. Kaitkan dengan template Ringkas meeting di Pendar.',
  },
  {
    id: 'komunikasi-klien',
    level: 'menengah',
    title: 'Komunikasi & korespondensi klien',
    summary: 'Bangun hubungan klien lewat pesan yang jelas dan profesional.',
    objectives: [
      'Menulis pesan klien yang profesional, hangat, dan to the point',
      'Menyampaikan kabar sulit tanpa merusak hubungan',
      'Menyesuaikan nada dengan klien dan situasi',
    ],
    focus:
      'Ajarkan korespondensi klien: struktur pesan, menyesuaikan formalitas, follow-up sopan, dan menangani revisi atau keterlambatan. Beri contoh balasan untuk situasi sulit. Kaitkan dengan template Balas klien & Follow-up.',
  },
  {
    id: 'customer-support',
    level: 'menengah',
    title: 'Customer support',
    summary: 'Tangani pertanyaan, keluhan, dan tiket pelanggan dengan empati.',
    objectives: [
      'Membalas pertanyaan dan keluhan pelanggan dengan empati',
      'Menyelesaikan masalah atau eskalasi dengan tepat',
      'Menjaga nada brand yang konsisten',
    ],
    focus:
      'Ajarkan alur dukungan: pahami masalah, berempati, beri solusi atau langkah, dan tindak lanjut. Bahas menangani pelanggan marah dan menjaga konsistensi brand. Beri latihan membalas keluhan.',
  },
  {
    id: 'riset-data',
    level: 'menengah',
    title: 'Riset online & organisasi data',
    summary: 'Cari, verifikasi, dan rangkum informasi jadi temuan actionable.',
    objectives: [
      'Melakukan riset online yang efisien dan kredibel',
      'Memisahkan fakta dari asumsi dan mencatat sumber',
      'Merangkum temuan menjadi poin yang bisa ditindaklanjuti',
    ],
    focus:
      'Ajarkan teknik riset: menyusun pertanyaan, sumber kredibel, mencatat sumber, dan merangkum jadi temuan kunci + rekomendasi. Tekankan tidak mengarang data. Kaitkan dengan template Riset online di Pendar.',
  },
  {
    id: 'crm-laporan',
    level: 'menengah',
    title: 'CRM & reporting',
    summary: 'Perbarui CRM dan susun laporan rapi dari data klien.',
    objectives: [
      'Memperbarui dan menjaga kebersihan data CRM',
      'Menyusun laporan ringkas dari data yang ada',
      'Menyajikan angka dengan jujur dan jelas',
    ],
    focus:
      'Ajarkan menjaga CRM (HubSpot/Notion/Sheets): konsistensi field, status lead, dan menyusun laporan (ringkasan, temuan, rekomendasi) tanpa mengarang metrik. Kaitkan dengan template Laporan di Pendar.',
  },

  // ── Mahir ────────────────────────────────────────────────────────────────
  {
    id: 'sosmed-management',
    level: 'mahir',
    title: 'Social media management',
    summary: 'Kelola akun sosmed: kalender konten, jadwal, dan keterlibatan.',
    objectives: [
      'Menyusun kalender konten dengan campuran yang seimbang',
      'Menjadwalkan dan memublikasikan konten lintas platform',
      'Memantau dan merespons interaksi audiens',
    ],
    focus:
      'Ajarkan manajemen sosmed: strategi, content mix (edukasi, engagement, brand, produk, CTA), kalender konten, alat penjadwalan, dan analitik dasar. Beri contoh kalender mingguan. Kaitkan dengan template Caption sosmed.',
  },
  {
    id: 'content-creation',
    level: 'mahir',
    title: 'Content creation & copywriting',
    summary: 'Tulis caption, hook, dan copy yang menarik tanpa klise.',
    objectives: [
      'Menulis hook pembuka dan caption yang kuat',
      'Menyesuaikan gaya dengan platform dan audiens',
      'Memvariasikan CTA dan angle agar tidak repetitif',
    ],
    focus:
      'Ajarkan dasar copywriting untuk VA: memahami audiens, hook, satu ide per konten, CTA bervariasi, dan menghindari klaim palsu. Beri latihan menulis tiga caption dengan angle berbeda.',
  },
  {
    id: 'ecommerce-listing',
    level: 'mahir',
    title: 'Ecommerce & product listing',
    summary: 'Buat listing produk, kelola pesanan, dan dukungan toko online.',
    objectives: [
      'Menulis deskripsi dan judul produk yang menjual',
      'Mengelola listing, stok, dan pesanan secara rapi',
      'Mendukung operasional toko di marketplace/Shopify',
    ],
    focus:
      'Ajarkan dukungan ecommerce: anatomi listing yang baik (judul, bullet manfaat, deskripsi, kata kunci), pengelolaan pesanan, dan dukungan toko. Beri latihan menulis listing dari spesifikasi produk.',
  },
  {
    id: 'lead-gen',
    level: 'mahir',
    title: 'Lead generation & prospecting',
    summary: 'Cari dan kumpulkan calon klien/pelanggan yang relevan.',
    objectives: [
      'Membangun daftar prospek yang tertarget dan rapi',
      'Mencari kontak yang relevan secara etis',
      'Menyiapkan data lead untuk tim sales atau klien',
    ],
    focus:
      'Ajarkan lead gen: menentukan kriteria target, sumber pencarian (LinkedIn, direktori), menyusun daftar prospek rapi, dan praktik etis. Tekankan kualitas data. Beri contoh struktur sheet lead.',
  },
  {
    id: 'project-coordination',
    level: 'mahir',
    title: 'Koordinasi proyek & tim remote',
    summary: 'Jaga proyek tetap berjalan: tugas, tenggat, dan komunikasi tim.',
    objectives: [
      'Memecah proyek menjadi tugas dengan pemilik dan tenggat',
      'Memantau progres dan menindaklanjuti hambatan',
      'Mengoordinasikan komunikasi tim remote',
    ],
    focus:
      'Ajarkan koordinasi proyek: memecah pekerjaan, papan tugas, status update, dan menindaklanjuti yang terlambat dengan sopan. Beri contoh update mingguan ke klien. Tekankan peran VA sebagai perekat tim.',
  },
  {
    id: 'sop-dokumentasi',
    level: 'mahir',
    title: 'SOP & dokumentasi proses',
    summary: 'Tulis SOP dan panduan agar pekerjaan bisa diulang dan didelegasi.',
    objectives: [
      'Mendokumentasikan proses langkah demi langkah dengan jelas',
      'Membuat SOP yang mudah diikuti orang lain',
      'Menyusun template dan checklist kerja',
    ],
    focus:
      'Ajarkan menulis SOP: tujuan, prasyarat, langkah berurutan, dan checklist. Tekankan kejelasan agar bisa didelegasikan. Beri latihan menulis SOP singkat dari satu tugas berulang. Ini fondasi untuk naik kelas jadi tim.',
  },
  {
    id: 'community-management',
    level: 'mahir',
    title: 'Community management',
    summary: 'Kelola dan rawat komunitas: balas, moderasi, dan jaga suasana.',
    objectives: [
      'Merespons komentar dan DM komunitas sesuai brand',
      'Memoderasi dengan adil dan menjaga suasana positif',
      'Menumbuhkan keterlibatan anggota',
    ],
    focus:
      'Ajarkan community management: nada on-brand, menangani anggota sulit, moderasi adil, dan mendorong interaksi. Beri contoh membalas komentar positif, pertanyaan, dan keluhan. Kaitkan dengan template Balas komunitas.',
  },

  // ── Expert ───────────────────────────────────────────────────────────────
  {
    id: 'positioning-niche',
    level: 'expert',
    title: 'Positioning, niche & personal branding',
    summary: 'Pilih spesialisasi dan bangun citra agar menonjol dan dicari.',
    objectives: [
      'Memilih niche dan layanan andalan yang menguntungkan',
      'Membangun personal branding yang dipercaya',
      'Menyusun penawaran nilai yang jelas',
    ],
    focus:
      'Ajarkan positioning: kenapa spesialis dibayar lebih, memilih niche sesuai minat dan pasar, menyusun value proposition, dan profil/branding (LinkedIn, portofolio). Beri latihan menulis satu kalimat positioning.',
  },
  {
    id: 'cari-klien',
    level: 'expert',
    title: 'Mendapatkan klien',
    summary: 'Cari klien lewat platform, pitching, dan portofolio yang kuat.',
    objectives: [
      'Menemukan klien di platform freelance dan jaringan',
      'Menulis pitch dan profil yang meyakinkan',
      'Membangun portofolio yang membuktikan kemampuan',
    ],
    focus:
      'Ajarkan akuisisi klien: platform (Upwork, OnlineJobs, LinkedIn), menulis proposal/pitch yang menonjol, membangun portofolio meski belum punya klien, dan referral. Beri latihan menulis pitch singkat. Kaitkan dengan template Proposal.',
  },
  {
    id: 'proposal-harga',
    level: 'expert',
    title: 'Proposal menang & harga premium',
    summary: 'Susun proposal yang dipilih dan strategi harga/paket bernilai.',
    objectives: [
      'Menyusun proposal yang berfokus pada hasil klien',
      'Menetapkan harga per jam, proyek, dan retainer',
      'Menawarkan paket bertingkat tanpa menjual murah',
    ],
    focus:
      'Ajarkan strategi harga: menghitung rate, model retainer vs proyek, paket Basic/Standard/Premium, dan menulis proposal yang fokus hasil. Bahas cara naik harga. Beri latihan menyusun paket. Kaitkan dengan template Proposal & Penawaran harga.',
  },
  {
    id: 'retensi-upsell',
    level: 'expert',
    title: 'Retensi klien & upsell',
    summary: 'Pertahankan klien jangka panjang dan tambah nilai layanan.',
    objectives: [
      'Menjaga klien tetap puas dan loyal jangka panjang',
      'Menawarkan layanan tambahan secara natural',
      'Mengelola kontrak dan ekspektasi',
    ],
    focus:
      'Ajarkan retensi: komunikasi proaktif, laporan nilai, meminta testimoni dan referral, serta upsell yang relevan. Bahas kontrak retainer dan menjaga batasan. Tekankan klien lama lebih murah daripada cari baru.',
  },
  {
    id: 'skala-tim',
    level: 'expert',
    title: 'Naik kelas: agensi & bangun tim',
    summary: 'Dari solo jadi agensi: delegasi, rekrut, dan kelola tim VA.',
    objectives: [
      'Mendelegasikan pekerjaan dengan SOP yang jelas',
      'Merekrut dan melatih VA lain',
      'Mengelola tim dan menjaga kualitas',
    ],
    focus:
      'Ajarkan penskalaan: kapan mulai mendelegasi, merekrut VA, menggunakan SOP untuk menjaga kualitas, dan mengubah diri dari pelaksana jadi pengelola. Bahas margin agensi. Inilah lompatan menuju penghasilan jauh lebih besar.',
  },
  {
    id: 'penghasilan-puluhan-juta',
    level: 'expert',
    title: 'Strategi penghasilan puluhan juta/bulan',
    summary: 'Rangkai skill, harga, dan klien jadi penghasilan besar yang stabil.',
    objectives: [
      'Menyusun bauran klien retainer untuk penghasilan stabil',
      'Menaikkan nilai per jam lewat spesialisasi dan hasil',
      'Membangun beberapa sumber penghasilan dari keahlian VA',
    ],
    focus:
      'Satukan semua pelajaran menjadi peta penghasilan: kombinasi retainer, menaikkan rate, spesialisasi bernilai tinggi, membangun tim, dan income tambahan (kursus, template, afiliasi). Beri hitung-hitungan realistis menuju puluhan juta per bulan dan tegaskan bahwa hasil bergantung usaha dan pasar.',
  },
  {
    id: 'ai-leverage',
    level: 'expert',
    title: 'Gandakan output dengan AI',
    summary: 'Pakai AI seperti Pendar untuk kerja lebih cepat dan bernilai jual.',
    objectives: [
      'Memakai AI untuk mempercepat tugas klien tanpa kehilangan kualitas',
      'Menjaga akurasi dan menghindari output mengarang',
      'Menjadikan kecepatan sebagai keunggulan bernilai jual',
    ],
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

function levelTitle(level: LevelId): string {
  return LEVELS.find((l) => l.id === level)?.title ?? level
}

/** System prompt mentor untuk satu materi: persona + konteks materi aktif. */
export function buildLessonSystem(lesson: Lesson): string {
  const objectives = lesson.objectives.map((o) => `- ${o}`).join('\n')
  return `${MENTOR_SYSTEM_PROMPT}

CURRENT LESSON
Level: ${levelTitle(lesson.level)}
Title: ${lesson.title}
Summary: ${lesson.summary}
Learning objectives:
${objectives}
Teaching focus: ${lesson.focus}

Teach this lesson now using your teaching flow. Stay on this topic until the learner is ready to move on.`
}

/** Pesan pembuka dari learner yang memicu mentor mulai mengajar materi. */
export function buildLessonStarter(lesson: Lesson): string {
  return `Aku ingin belajar materi "${lesson.title}". Tolong ajari aku dari nol, langkah demi langkah, beri contoh nyata dari pekerjaan VA, lalu beri satu latihan singkat untuk kukerjakan.`
}
