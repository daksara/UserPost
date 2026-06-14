// src/learn/scenarios.ts
// Mode Latihan Klien: AI berperan sebagai klien nyata, learner berlatih
// menanganinya, lalu dinilai. Data + builder prompt murni & dapat diuji,
// dipisah dari React. Dwibahasa (ikut toggle UI).
import type { Language } from '../ai/templates'
import type { LevelId } from './curriculum'

type Loc = Record<Language, string>
export type ScenarioDifficulty = 1 | 2 | 3 | 4 | 5

export interface Scenario {
  id: string
  level: LevelId
  /** Label skill yang dilatih (dwibahasa). */
  skill: Loc
  /** Nama persona klien. */
  clientName: string
  /** Bisnis/peran klien (dwibahasa). */
  business: Loc
  /** 1 (mudah/kooperatif) - 5 (sulit/menekan). */
  difficulty: ScenarioDifficulty
  /** Konteks situasi, ditampilkan ke user & dipakai persona (dwibahasa). */
  situation: Loc
  /** Tujuan tersembunyi klien — hanya untuk persona AI (dwibahasa). */
  hiddenGoal: Loc
  /** Kriteria penilaian (internal, untuk penilai). */
  rubric: string[]
}

const PRO = [
  'Professionalism and tone (warm, clear, respectful)',
  'Addresses the client request fully and accurately',
  'No overpromising; no invented facts, dates, or prices',
  'Clear, concrete next step',
]

export const SCENARIOS: Scenario[] = [
  {
    id: 'brief-vague', level: 'pemula', difficulty: 2,
    skill: { id: 'Klarifikasi brief', en: 'Clarifying a brief' },
    clientName: 'Bu Rina',
    business: { id: 'pemilik toko skincare online', en: 'owner of an online skincare shop' },
    situation: {
      id: 'Klien mengirim brief sangat singkat: "Tolong buatin konten ya, yang bagus." Tanpa detail platform, tujuan, atau deadline.',
      en: 'The client sends a very short brief: "Make me some good content, ok." No platform, goal, or deadline.',
    },
    hiddenGoal: {
      id: 'Sebenarnya butuh konten promosi produk baru minggu depan, tapi tidak menjelaskannya kecuali ditanya.',
      en: 'Really needs promo content for a new product next week, but will not explain unless asked.',
    },
    rubric: ['Asks focused clarifying questions before working', ...PRO],
  },
  {
    id: 'first-contact', level: 'pemula', difficulty: 1,
    skill: { id: 'Komunikasi awal klien', en: 'First client contact' },
    clientName: 'Mas Dion',
    business: { id: 'founder startup kecil', en: 'founder of a small startup' },
    situation: {
      id: 'Calon klien pertama bertanya: "Kamu bisa bantu apa aja sih sebagai VA?" Ini kontak pertama.',
      en: 'A first prospective client asks: "So what can you actually help with as a VA?" This is first contact.',
    },
    hiddenGoal: {
      id: 'Ingin tahu apakah VA ini bisa dipercaya dan terorganisir sebelum memberi tugas.',
      en: 'Wants to gauge whether this VA is trustworthy and organized before assigning work.',
    },
    rubric: ['Communicates value and relevant services clearly', ...PRO],
  },
  {
    id: 'progress-update', level: 'pemula', difficulty: 2,
    skill: { id: 'Update progres', en: 'Progress updates' },
    clientName: 'Pak Hadi',
    business: { id: 'pemilik agensi kecil', en: 'owner of a small agency' },
    situation: {
      id: 'Klien menanyakan: "Gimana progres yang kemarin?" Kamu baru menyelesaikan sebagian pekerjaan.',
      en: 'The client asks: "How is the task from yesterday going?" You have finished part of the work.',
    },
    hiddenGoal: {
      id: 'Khawatir pekerjaan tidak jalan; ingin kepastian dan kapan selesai.',
      en: 'Worried the work has stalled; wants reassurance and a completion time.',
    },
    rubric: ['Gives a clear, honest status with a realistic next step', ...PRO],
  },
  {
    id: 'schedule-admin', level: 'pemula', difficulty: 1,
    skill: { id: 'Tugas admin & jadwal', en: 'Admin and scheduling' },
    clientName: 'Mbak Sari',
    business: { id: 'konsultan freelance', en: 'a freelance consultant' },
    situation: {
      id: 'Klien minta: "Tolong atur jadwal meeting aku minggu depan sama 3 orang ini." Beberapa info belum lengkap.',
      en: 'The client asks: "Please set up my meetings next week with these 3 people." Some details are missing.',
    },
    hiddenGoal: {
      id: 'Sibuk dan tidak mau ditanya bertele-tele; hargai bila VA proaktif dan ringkas.',
      en: 'Is busy and dislikes long back-and-forth; values a proactive, concise VA.',
    },
    rubric: ['Collects only the essential missing info efficiently', ...PRO],
  },

  {
    id: 'price-nego', level: 'menengah', difficulty: 3,
    skill: { id: 'Negosiasi harga', en: 'Price negotiation' },
    clientName: 'Pak Bram',
    business: { id: 'pemilik bisnis F&B', en: 'owner of an F&B business' },
    situation: {
      id: 'Klien menawar: "Harganya kemahalan, bisa turun 50%? Nanti aku kasih banyak kerjaan." Rate kamu sudah wajar.',
      en: 'The client pushes back: "Too expensive, can you drop 50%? I will give you lots of work later." Your rate is already fair.',
    },
    hiddenGoal: {
      id: 'Sebenarnya mampu bayar; sedang menguji apakah VA akan langsung menyerah pada harga.',
      en: 'Can actually afford it; is testing whether the VA will cave on price immediately.',
    },
    rubric: ['Holds value without being defensive; offers options not just discounts', ...PRO],
  },
  {
    id: 'inbox-triage', level: 'menengah', difficulty: 2,
    skill: { id: 'Triase & ringkas email', en: 'Inbox triage and summary' },
    clientName: 'Ms. Clara',
    business: { id: 'pemilik bisnis ekspor', en: 'owner of an export business' },
    situation: {
      id: 'Klien: "Inbox aku 200 email belum dibaca, tolong beresin dan kasih tahu mana yang penting." Belum menempel isinya.',
      en: 'Client: "I have 200 unread emails, please sort them and tell me what matters." Has not pasted the emails yet.',
    },
    hiddenGoal: {
      id: 'Ingin merasa beban inbox-nya hilang; benci kehilangan email penting.',
      en: 'Wants the inbox burden lifted; hates missing an important email.',
    },
    rubric: ['Proposes a clear triage method and asks for the actual emails before promising results', ...PRO],
  },
  {
    id: 'scope-creep', level: 'menengah', difficulty: 3,
    skill: { id: 'Kelola scope & revisi', en: 'Managing scope and revisions' },
    clientName: 'Bu Mega',
    business: { id: 'pemilik brand fashion', en: 'owner of a fashion brand' },
    situation: {
      id: 'Klien minta revisi ke-5 padahal paket hanya mencakup 2 revisi: "Sekalian ya, kan gampang."',
      en: 'The client asks for a 5th revision although the package includes only 2: "Just do it, it is easy right."',
    },
    hiddenGoal: {
      id: 'Terbiasa minta ekstra gratis; akan terus melakukannya bila tidak ada batas yang sopan.',
      en: 'Is used to getting extras for free; will keep doing it unless a polite boundary is set.',
    },
    rubric: ['Sets a polite, firm boundary and offers a paid path for extra work', ...PRO],
  },
  {
    id: 'late-payment', level: 'menengah', difficulty: 3,
    skill: { id: 'Menagih pembayaran', en: 'Chasing a late payment' },
    clientName: 'Pak Yusuf',
    business: { id: 'pemilik toko online', en: 'owner of an online store' },
    situation: {
      id: 'Invoice sudah lewat 2 minggu. Kamu harus menagih tanpa merusak hubungan. Klien ramah tapi pelupa.',
      en: 'The invoice is 2 weeks overdue. You must follow up without damaging the relationship. The client is friendly but forgetful.',
    },
    hiddenGoal: {
      id: 'Tidak sengaja lupa; akan bayar bila ditagih dengan jelas dan sopan.',
      en: 'Forgot by accident; will pay once reminded clearly and politely.',
    },
    rubric: ['Reminds clearly and politely with payment details and a due date', ...PRO],
  },

  {
    id: 'content-complaint', level: 'mahir', difficulty: 4,
    skill: { id: 'Tangani komplain', en: 'Handling a complaint' },
    clientName: 'Bu Nadia',
    business: { id: 'pemilik klinik kecantikan', en: 'owner of a beauty clinic' },
    situation: {
      id: 'Klien kecewa: "Caption yang kamu buat jelek, gak ada yang nge-like. Ini gimana?" Nada agak marah.',
      en: 'The client is upset: "Your caption was bad, nobody liked it. What now?" Tone is somewhat angry.',
    },
    hiddenGoal: {
      id: 'Sebenarnya cemas soal penjualan; ingin merasa didengar lalu diberi solusi, bukan dibela.',
      en: 'Is really anxious about sales; wants to feel heard then given a fix, not defensiveness.',
    },
    rubric: ['Shows empathy first, avoids defensiveness, proposes a concrete improvement plan', ...PRO],
  },
  {
    id: 'urgent-afterhours', level: 'mahir', difficulty: 4,
    skill: { id: 'Kelola ekspektasi & urgensi', en: 'Managing expectations and urgency' },
    clientName: 'Mr. Alex',
    business: { id: 'pemilik startup', en: 'a startup owner' },
    situation: {
      id: 'Jam 9 malam klien chat: "Butuh ini SEKARANG, besok pagi harus jadi." Di luar jam kerja yang disepakati.',
      en: 'At 9pm the client messages: "I need this NOW, must be ready by morning." Outside agreed working hours.',
    },
    hiddenGoal: {
      id: 'Panik karena deadline-nya sendiri; akan tenang bila ada rencana yang jelas dan realistis.',
      en: 'Is panicking over their own deadline; will calm down given a clear, realistic plan.',
    },
    rubric: ['Stays calm, sets a realistic boundary, and offers a workable plan without overpromising', ...PRO],
  },
  {
    id: 'content-plan', level: 'mahir', difficulty: 3,
    skill: { id: 'Rencana konten sosmed', en: 'Social content planning' },
    clientName: 'Mbak Tia',
    business: { id: 'pemilik bisnis kue rumahan', en: 'owner of a home bakery' },
    situation: {
      id: 'Klien: "Buatin rencana konten Instagram sebulan dong." Tujuan dan audiens belum dijelaskan detail.',
      en: 'Client: "Make me a one-month Instagram content plan." Goals and audience are not detailed yet.',
    },
    hiddenGoal: {
      id: 'Ingin lebih banyak pesanan; suka ide yang bervariasi, bukan jualan terus-menerus.',
      en: 'Wants more orders; likes varied ideas, not constant selling.',
    },
    rubric: ['Clarifies goal/audience, proposes a varied content mix, no fabricated metrics', ...PRO],
  },
  {
    id: 'out-of-skill', level: 'mahir', difficulty: 4,
    skill: { id: 'Jujur soal kompetensi', en: 'Honesty about competence' },
    clientName: 'Pak Reza',
    business: { id: 'pemilik agensi digital', en: 'owner of a digital agency' },
    situation: {
      id: 'Klien minta jasa editing video kompleks yang di luar keahlianmu, tapi menjanjikan bayaran besar.',
      en: 'The client asks for complex video editing outside your skill set, but dangles a big payment.',
    },
    hiddenGoal: {
      id: 'Menghargai kejujuran; akan tetap memberi kerja lain bila VA jujur dan menawarkan solusi.',
      en: 'Values honesty; will still give other work if the VA is honest and offers a solution.',
    },
    rubric: ['Is honest about limits, avoids overpromising, offers an alternative or referral', ...PRO],
  },

  {
    id: 'retainer-close', level: 'expert', difficulty: 4,
    skill: { id: 'Closing kontrak retainer', en: 'Closing a retainer' },
    clientName: 'Ms. Olivia',
    business: { id: 'pemilik beberapa toko e-commerce', en: 'owner of several e-commerce stores' },
    situation: {
      id: 'Prospek besar tertarik kerja bulanan: "Coba yakinkan aku kenapa harus pakai kamu jangka panjang."',
      en: 'A big prospect is interested in a monthly arrangement: "Convince me why I should retain you long-term."',
    },
    hiddenGoal: {
      id: 'Mau partner yang andal dan proaktif; harga nomor dua bila nilai terbukti.',
      en: 'Wants a reliable, proactive partner; price is secondary if value is proven.',
    },
    rubric: ['Frames value and outcomes, proposes a clear retainer structure, confident not pushy', ...PRO],
  },
  {
    id: 'angry-cancel', level: 'expert', difficulty: 5,
    skill: { id: 'Krisis & retensi', en: 'Crisis and retention' },
    clientName: 'Pak Surya',
    business: { id: 'pemilik bisnis properti', en: 'owner of a property business' },
    situation: {
      id: 'Klien marah: "Aku mau berhenti dan minta refund, hasilnya mengecewakan!" Sebagian keluhan valid.',
      en: 'The client is angry: "I want to quit and get a refund, the results were disappointing!" Some complaints are valid.',
    },
    hiddenGoal: {
      id: 'Masih mau dipertahankan bila merasa didengar dan ada rencana perbaikan nyata.',
      en: 'Can still be retained if they feel heard and see a real recovery plan.',
    },
    rubric: ['De-escalates with empathy, owns valid issues, proposes a recovery plan, handles refund professionally', ...PRO],
  },
  {
    id: 'lead-team', level: 'expert', difficulty: 4,
    skill: { id: 'Koordinasi tim VA', en: 'Coordinating a VA team' },
    clientName: 'Ms. Hana',
    business: { id: 'pemilik brand yang berkembang', en: 'owner of a growing brand' },
    situation: {
      id: 'Klien minta kamu memimpin 2 VA lain untuk proyek besar: "Atur mereka ya, aku mau hasilnya rapi."',
      en: 'The client asks you to lead 2 other VAs on a big project: "Manage them, I want clean results."',
    },
    hiddenGoal: {
      id: 'Ingin satu titik tanggung jawab yang jelas; benci harus mikirin koordinasi sendiri.',
      en: 'Wants one clear point of accountability; hates having to coordinate it themselves.',
    },
    rubric: ['Proposes clear ownership, task breakdown, and reporting cadence; sets realistic expectations', ...PRO],
  },
  {
    id: 'strategic-discovery', level: 'expert', difficulty: 5,
    skill: { id: 'Discovery strategis', en: 'Strategic discovery' },
    clientName: 'Mr. Daniel',
    business: { id: 'pemilik bisnis bernilai tinggi', en: 'owner of a high-value business' },
    situation: {
      id: 'Klien high-value: "Aku mau tumbuh tahun ini, bantu aku." Brief sengaja luas dan ambigu.',
      en: 'A high-value client: "I want to grow this year, help me." The brief is deliberately broad and ambiguous.',
    },
    hiddenGoal: {
      id: 'Menguji apakah VA bisa berpikir strategis dan mengajukan pertanyaan tajam, bukan langsung eksekusi.',
      en: 'Is testing whether the VA can think strategically and ask sharp questions, not just execute.',
    },
    rubric: ['Asks strategic discovery questions, identifies the real objective, avoids jumping to tasks', ...PRO],
  },
]

export const TOTAL_SCENARIOS = SCENARIOS.length

/** Skenario pada satu level, urut sesuai definisi. */
export function scenariosByLevel(level: LevelId): Scenario[] {
  return SCENARIOS.filter((s) => s.level === level)
}

/** Cari skenario berdasarkan id. */
export function findScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

function langName(lang: Language): string {
  return lang === 'en' ? 'English' : 'Indonesian'
}

/** System prompt untuk AI berperan sebagai klien (roleplay). Murni & dapat diuji. */
export function buildClientSystem(scenario: Scenario, lang: Language): string {
  return `You are role-playing a CLIENT in a Virtual Assistant practice simulation. Stay fully in character as the client at all times. Never break character, never act as an assistant or coach, and never solve the task for the trainee.

CLIENT
Name: ${scenario.clientName}
Business: ${scenario.business[lang]}
Situation: ${scenario.situation[lang]}
Your hidden goal (do not state it outright, reveal only through behaviour): ${scenario.hiddenGoal[lang]}

HOW TO BEHAVE
- React like a real client: realistic emotions, sometimes incomplete information, natural pushback.
- Difficulty ${scenario.difficulty} of 5 (higher = more demanding, less patient, harder to please).
- Write in ${langName(lang)}, in a natural messaging style (short, like WhatsApp or email).
- Open the conversation now with your first message to the trainee (the Virtual Assistant). Do not explain that this is an exercise; simply be the client.`
}

/** System prompt untuk menilai performa learner terhadap rubrik. Murni & dapat diuji. */
export function buildEvalSystem(scenario: Scenario, lang: Language): string {
  const verdict = lang === 'en' ? '"Pass" or "Try again"' : '"Lulus" atau "Coba lagi"'
  return `You are a senior Virtual Assistant coach. Evaluate how the trainee handled the client in this practice scenario. Be honest, specific, and constructive — praise what works and fix what does not.

SCENARIO
Skill practiced: ${scenario.skill[lang]}
Situation: ${scenario.situation[lang]}

EVALUATION CRITERIA (score each from 1 to 5)
${scenario.rubric.map((r) => `- ${r}`).join('\n')}

OUTPUT (respond in ${langName(lang)}, plain text)
- A score for each criterion with a one-line reason, quoting the trainee where useful.
- An overall verdict: ${verdict}, with the average score.
- The 2 to 3 most important things to improve.
- One example of a stronger reply the trainee could have sent.`
}
