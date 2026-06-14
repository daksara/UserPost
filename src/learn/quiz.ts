// src/learn/quiz.ts
// Kuis interaktif A/B/C/D (statis) untuk Latihan Klien: tiap skenario punya satu
// pertanyaan "pilih balasan terbaik" dengan 4 opsi; tiap opsi punya penjelasan
// (kenapa benar / kenapa kurang tepat). Tanpa API key, instan, dwibahasa.
// Logika murni & dapat diuji; UI menyusul terpisah.
import type { Language } from '../ai/templates'
import type { LevelId } from './curriculum'

type Loc = Record<Language, string>

export interface QuizOption {
  text: Loc
  /** Penjelasan kenapa opsi ini benar atau kurang tepat. */
  explanation: Loc
}

export interface QuizQuestion {
  id: string
  prompt: Loc
  options: QuizOption[]
  /** Indeks opsi yang benar (0-3). */
  correct: number
}

/** Satu kuis "pilih balasan terbaik" per skenario Latihan Klien (kunci = id skenario). */
export const SCENARIO_QUIZZES: Record<string, QuizQuestion> = {
  'brief-vague': {
    id: 'brief-vague',
    prompt: {
      id: 'Klien hanya bilang "buatin konten yang bagus" tanpa detail. Balasan terbaik?',
      en: 'The client only says "make me good content" with no detail. Best reply?',
    },
    correct: 0,
    options: [
      {
        text: { id: 'Tanya tujuan, platform, dan tenggat dulu sebelum mulai.', en: 'Ask the goal, platform, and deadline before starting.' },
        explanation: { id: 'Klarifikasi singkat memastikan hasil tepat sasaran.', en: 'A short clarification keeps the result on target.' },
      },
      {
        text: { id: 'Langsung buat 10 konten apa saja biar cepat.', en: 'Just make 10 random posts to be fast.' },
        explanation: { id: 'Tanpa arah, hasilnya kemungkinan besar meleset.', en: 'Without direction the output likely misses.' },
      },
      {
        text: { id: 'Balas "oke siap" lalu kerjakan tanpa bertanya.', en: 'Reply "sure" and work without asking.' },
        explanation: { id: 'Asumsi diam-diam berisiko salah sasaran.', en: 'Silent assumptions risk being off target.' },
      },
      {
        text: { id: 'Kirim formulir brief berisi 20 pertanyaan.', en: 'Send a 20-question brief form.' },
        explanation: { id: 'Terlalu membebani; cukup 2-3 pertanyaan inti.', en: 'Too heavy; 2-3 key questions suffice.' },
      },
    ],
  },
  'first-contact': {
    id: 'first-contact',
    prompt: {
      id: 'Calon klien pertama bertanya "kamu bisa bantu apa aja sebagai VA?" Balasan terbaik?',
      en: 'A first prospect asks "what can you help with as a VA?" Best reply?',
    },
    correct: 1,
    options: [
      {
        text: { id: 'Kirim daftar 30 layanan tanpa konteks.', en: 'Send a list of 30 services with no context.' },
        explanation: { id: 'Membanjiri; klien tak tahu mana yang relevan.', en: 'Overwhelming; the client cannot see what is relevant.' },
      },
      {
        text: { id: 'Sebut layanan inti yang relevan, lalu tanya kebutuhan utamanya.', en: 'Name a few relevant core services, then ask their main need.' },
        explanation: { id: 'Jelas dan berpusat pada kebutuhan klien.', en: 'Clear and centered on the client need.' },
      },
      {
        text: { id: 'Bilang "bisa semua kok, apa aja".', en: 'Say "I can do anything, whatever you want".' },
        explanation: { id: 'Terlalu kabur dan terkesan overpromise.', en: 'Too vague and sounds like overpromising.' },
      },
      {
        text: { id: 'Langsung kirim penawaran harga.', en: 'Immediately send a price quote.' },
        explanation: { id: 'Terlalu cepat; kebutuhan belum dipahami.', en: 'Too soon; the need is not understood yet.' },
      },
    ],
  },
  'progress-update': {
    id: 'progress-update',
    prompt: {
      id: 'Klien tanya "gimana progresnya?" dan pekerjaan baru selesai sebagian. Balasan terbaik?',
      en: 'The client asks "how is it going?" and the work is partly done. Best reply?',
    },
    correct: 2,
    options: [
      {
        text: { id: 'Bilang "hampir selesai kok" padahal belum.', en: 'Say "almost done" when it is not.' },
        explanation: { id: 'Membesarkan progres merusak kepercayaan.', en: 'Inflating progress breaks trust.' },
      },
      {
        text: { id: 'Diamkan dulu sampai semuanya beres.', en: 'Stay silent until everything is finished.' },
        explanation: { id: 'Klien jadi cemas tanpa kabar.', en: 'The client grows anxious without news.' },
      },
      {
        text: { id: 'Sebut yang sudah selesai, sisa tugas, dan perkiraan kapan beres.', en: 'State what is done, what remains, and a realistic finish time.' },
        explanation: { id: 'Jujur, jelas, dan menenangkan klien.', en: 'Honest, clear, and reassuring.' },
      },
      {
        text: { id: 'Jawab "lagi dikerjain" tanpa detail.', en: 'Reply "working on it" with no detail.' },
        explanation: { id: 'Terlalu samar; tak memberi kepastian.', en: 'Too vague; gives no certainty.' },
      },
    ],
  },
  'schedule-admin': {
    id: 'schedule-admin',
    prompt: {
      id: 'Klien minta atur 3 meeting minggu depan tapi beberapa info kurang. Balasan terbaik?',
      en: 'The client asks to set 3 meetings next week but some info is missing. Best reply?',
    },
    correct: 0,
    options: [
      {
        text: { id: 'Konfirmasi hanya info penting yang kurang (waktu/zona/peserta), lalu jalankan.', en: 'Confirm only the key missing info (time/zone/attendees), then proceed.' },
        explanation: { id: 'Proaktif dan ringkas, sesuai klien sibuk.', en: 'Proactive and concise, right for a busy client.' },
      },
      {
        text: { id: 'Tanyakan semua detail satu per satu panjang lebar.', en: 'Ask every detail one by one at length.' },
        explanation: { id: 'Bertele-tele; klien sibuk tak suka.', en: 'Long-winded; a busy client dislikes it.' },
      },
      {
        text: { id: 'Tebak semua dan kirim undangan tanpa konfirmasi.', en: 'Guess everything and send invites without confirming.' },
        explanation: { id: 'Berisiko salah jadwal/zona waktu.', en: 'Risks wrong time or timezone.' },
      },
      {
        text: { id: 'Minta klien yang atur sendiri.', en: 'Ask the client to arrange it themselves.' },
        explanation: { id: 'Itu justru tugas VA.', en: 'That is exactly the VA job.' },
      },
    ],
  },
  'price-nego': {
    id: 'price-nego',
    prompt: {
      id: 'Klien minta harga turun 50% dengan iming-iming "banyak kerjaan nanti". Balasan terbaik?',
      en: 'The client asks for 50% off, dangling "lots of work later". Best reply?',
    },
    correct: 3,
    options: [
      {
        text: { id: 'Langsung setuju turun 50%.', en: 'Immediately agree to 50% off.' },
        explanation: { id: 'Merendahkan nilai dan sulit dinaikkan lagi.', en: 'Undercuts your value and is hard to raise back.' },
      },
      {
        text: { id: 'Tolak mentah-mentah dan akhiri obrolan.', en: 'Refuse flatly and end the chat.' },
        explanation: { id: 'Membakar hubungan tanpa perlu.', en: 'Burns the relationship needlessly.' },
      },
      {
        text: { id: 'Bela harga dengan nada defensif.', en: 'Defend the price defensively.' },
        explanation: { id: 'Defensif memperburuk negosiasi.', en: 'Defensiveness worsens the negotiation.' },
      },
      {
        text: { id: 'Tahan nilai, jelaskan manfaat, tawarkan opsi paket bukan diskon.', en: 'Hold value, explain benefits, offer package options not discounts.' },
        explanation: { id: 'Menjaga nilai sambil tetap fleksibel.', en: 'Protects value while staying flexible.' },
      },
    ],
  },
  'inbox-triage': {
    id: 'inbox-triage',
    prompt: {
      id: 'Klien minta beresin 200 email tapi belum menempel isinya. Balasan terbaik?',
      en: 'The client asks to clear 200 emails but has not shared them. Best reply?',
    },
    correct: 1,
    options: [
      {
        text: { id: 'Janji "beres hari ini" tanpa lihat emailnya.', en: 'Promise "done today" without seeing the emails.' },
        explanation: { id: 'Overpromise sebelum tahu bebannya.', en: 'Overpromising before knowing the load.' },
      },
      {
        text: { id: 'Jelaskan metode triase singkat, lalu minta akses/isi emailnya dulu.', en: 'Explain a short triage method, then ask for access to the emails.' },
        explanation: { id: 'Rencana jelas dan minta bahan dulu.', en: 'Clear plan and asks for the input first.' },
      },
      {
        text: { id: 'Minta klien sendiri yang memilah dulu.', en: 'Ask the client to sort them first.' },
        explanation: { id: 'Memindahkan tugas balik ke klien.', en: 'Pushes the task back to the client.' },
      },
      {
        text: { id: 'Hapus email lama tanpa konfirmasi biar cepat.', en: 'Delete old emails without confirming, to be fast.' },
        explanation: { id: 'Berisiko menghapus yang penting.', en: 'Risks deleting important ones.' },
      },
    ],
  },
  'scope-creep': {
    id: 'scope-creep',
    prompt: {
      id: 'Klien minta revisi ke-5 padahal paket hanya 2 revisi. Balasan terbaik?',
      en: 'The client asks for a 5th revision but the package includes only 2. Best reply?',
    },
    correct: 2,
    options: [
      {
        text: { id: 'Kerjakan saja gratis biar tak ribut.', en: 'Just do it free to avoid conflict.' },
        explanation: { id: 'Membiasakan ekstra gratis tanpa batas.', en: 'Trains endless free extras.' },
      },
      {
        text: { id: 'Tolak tegas: "revisi habis, tidak bisa".', en: 'Refuse bluntly: "revisions are used up, no".' },
        explanation: { id: 'Benar soal batas, tapi nadanya kasar.', en: 'Right on limits, but the tone is harsh.' },
      },
      {
        text: { id: 'Ingatkan batas paket dengan sopan, tawarkan revisi tambahan berbayar.', en: 'Politely note the package limit, offer paid extra revisions.' },
        explanation: { id: 'Batas jelas sekaligus menjaga hubungan.', en: 'Clear boundary while keeping the relationship.' },
      },
      {
        text: { id: 'Abaikan permintaannya.', en: 'Ignore the request.' },
        explanation: { id: 'Tidak profesional dan merusak kepercayaan.', en: 'Unprofessional and breaks trust.' },
      },
    ],
  },
  'late-payment': {
    id: 'late-payment',
    prompt: {
      id: 'Invoice telat 2 minggu, klien ramah tapi pelupa. Balasan terbaik?',
      en: 'Invoice is 2 weeks overdue; the client is friendly but forgetful. Best reply?',
    },
    correct: 0,
    options: [
      {
        text: { id: 'Ingatkan sopan dengan rincian invoice dan tenggat baru yang jelas.', en: 'Politely remind with the invoice details and a clear new due date.' },
        explanation: { id: 'Jelas, sopan, dan mudah ditindaklanjuti.', en: 'Clear, polite, and easy to act on.' },
      },
      {
        text: { id: 'Kirim ancaman akan stop kerja.', en: 'Threaten to stop all work.' },
        explanation: { id: 'Terlalu keras untuk lupa yang tak disengaja.', en: 'Too harsh for an honest oversight.' },
      },
      {
        text: { id: 'Diam dan berharap klien ingat sendiri.', en: 'Stay silent and hope they remember.' },
        explanation: { id: 'Pembayaran makin tertunda.', en: 'Payment gets delayed further.' },
      },
      {
        text: { id: 'Sindir klien di chat.', en: 'Make a passive-aggressive jab.' },
        explanation: { id: 'Merusak hubungan baik.', en: 'Damages a good relationship.' },
      },
    ],
  },
  'content-complaint': {
    id: 'content-complaint',
    prompt: {
      id: 'Klien marah: "caption kamu jelek, gak ada yang nge-like". Balasan terbaik?',
      en: 'The client is angry: "your caption was bad, no likes". Best reply?',
    },
    correct: 1,
    options: [
      {
        text: { id: 'Bela diri: "captionnya sudah bagus kok".', en: 'Get defensive: "the caption was actually fine".' },
        explanation: { id: 'Defensif bikin klien makin kesal.', en: 'Defensiveness upsets the client more.' },
      },
      {
        text: { id: 'Akui kekecewaannya, tanya target, lalu usulkan perbaikan konkret.', en: 'Acknowledge the frustration, ask the goal, propose a concrete fix.' },
        explanation: { id: 'Empati dulu, baru solusi nyata.', en: 'Empathy first, then a real fix.' },
      },
      {
        text: { id: 'Minta maaf berlebihan tanpa solusi.', en: 'Over-apologize with no solution.' },
        explanation: { id: 'Tidak menyelesaikan masalah klien.', en: 'Does not solve the client problem.' },
      },
      {
        text: { id: 'Salahkan algoritma media sosial.', en: 'Blame the social media algorithm.' },
        explanation: { id: 'Terkesan cari alasan, bukan tanggung jawab.', en: 'Sounds like an excuse, not ownership.' },
      },
    ],
  },
  'urgent-afterhours': {
    id: 'urgent-afterhours',
    prompt: {
      id: 'Jam 9 malam klien minta "harus jadi besok pagi", di luar jam kerja. Balasan terbaik?',
      en: 'At 9pm the client demands "done by morning", outside work hours. Best reply?',
    },
    correct: 3,
    options: [
      {
        text: { id: 'Iyakan semua dan begadang tanpa syarat.', en: 'Agree to everything and pull an all-nighter.' },
        explanation: { id: 'Membiasakan ekspektasi tak sehat.', en: 'Sets an unhealthy expectation.' },
      },
      {
        text: { id: 'Abaikan sampai besok pagi.', en: 'Ignore it until morning.' },
        explanation: { id: 'Klien yang panik merasa ditinggal.', en: 'A panicking client feels abandoned.' },
      },
      {
        text: { id: 'Balas ketus soal jam kerja.', en: 'Reply curtly about working hours.' },
        explanation: { id: 'Benar soal batas, tapi tak membantu.', en: 'Right on boundaries, but unhelpful.' },
      },
      {
        text: { id: 'Tenangkan, tawarkan yang realistis bisa dikirim pagi, sepakati prioritas.', en: 'Calm them, offer what is realistically deliverable by morning, agree priorities.' },
        explanation: { id: 'Tenang, batas sehat, tetap menolong.', en: 'Calm, healthy boundary, still helpful.' },
      },
    ],
  },
  'content-plan': {
    id: 'content-plan',
    prompt: {
      id: 'Klien minta rencana konten Instagram sebulan; tujuan belum jelas. Balasan terbaik?',
      en: 'The client wants a one-month Instagram plan; the goal is unclear. Best reply?',
    },
    correct: 0,
    options: [
      {
        text: { id: 'Tanya tujuan & audiens, lalu usulkan mix konten bervariasi.', en: 'Ask goal and audience, then propose a varied content mix.' },
        explanation: { id: 'Terarah dan menghindari jualan terus-menerus.', en: 'Focused and avoids constant selling.' },
      },
      {
        text: { id: 'Isi 30 hari dengan promo jualan semua.', en: 'Fill 30 days with all-sales posts.' },
        explanation: { id: 'Monoton dan membuat audiens jenuh.', en: 'Monotonous and tires the audience.' },
      },
      {
        text: { id: 'Salin rencana klien lain apa adanya.', en: 'Copy another client plan as-is.' },
        explanation: { id: 'Tidak sesuai audiens spesifik ini.', en: 'Not fit for this specific audience.' },
      },
      {
        text: { id: 'Klaim "dijamin viral".', en: 'Claim "guaranteed to go viral".' },
        explanation: { id: 'Janji palsu yang tak bisa dijamin.', en: 'A false promise no one can guarantee.' },
      },
    ],
  },
  'out-of-skill': {
    id: 'out-of-skill',
    prompt: {
      id: 'Klien minta editing video kompleks di luar keahlianmu, bayaran besar. Balasan terbaik?',
      en: 'The client wants complex video editing beyond your skill, big pay. Best reply?',
    },
    correct: 2,
    options: [
      {
        text: { id: 'Terima dan pura-pura bisa.', en: 'Accept and pretend you can do it.' },
        explanation: { id: 'Berisiko hasil buruk dan hilang kepercayaan.', en: 'Risks poor work and lost trust.' },
      },
      {
        text: { id: 'Tolak singkat tanpa alternatif.', en: 'Decline curtly with no alternative.' },
        explanation: { id: 'Menutup peluang tanpa membantu.', en: 'Closes the door without helping.' },
      },
      {
        text: { id: 'Jujur soal batas, tawarkan bantuan lain atau rujuk rekan tepercaya.', en: 'Be honest about limits, offer other help or refer a trusted peer.' },
        explanation: { id: 'Jujur dan tetap memberi solusi.', en: 'Honest and still offers a solution.' },
      },
      {
        text: { id: 'Ambil bayarannya dulu, pikir caranya nanti.', en: 'Take the money first, figure it out later.' },
        explanation: { id: 'Tidak etis dan berisiko gagal.', en: 'Unethical and likely to fail.' },
      },
    ],
  },
  'retainer-close': {
    id: 'retainer-close',
    prompt: {
      id: 'Prospek besar: "yakinkan aku kenapa harus pakai kamu jangka panjang". Balasan terbaik?',
      en: 'Big prospect: "convince me to retain you long-term". Best reply?',
    },
    correct: 1,
    options: [
      {
        text: { id: 'Tawarkan harga termurah sebagai daya tarik utama.', en: 'Lead with the cheapest price as the main draw.' },
        explanation: { id: 'Lomba harga mengikis nilai & profit.', en: 'A price race erodes value and profit.' },
      },
      {
        text: { id: 'Tonjolkan hasil & keandalan, usulkan struktur retainer yang jelas.', en: 'Highlight outcomes and reliability, propose a clear retainer structure.' },
        explanation: { id: 'Fokus nilai jangka panjang, percaya diri.', en: 'Focuses on long-term value, confidently.' },
      },
      {
        text: { id: 'Mendesak terus agar segera teken.', en: 'Pressure them hard to sign now.' },
        explanation: { id: 'Memaksa membuat prospek mundur.', en: 'Pushiness makes prospects retreat.' },
      },
      {
        text: { id: 'Janji hasil ajaib tanpa dasar.', en: 'Promise magical results with no basis.' },
        explanation: { id: 'Overpromise merusak kredibilitas.', en: 'Overpromising wrecks credibility.' },
      },
    ],
  },
  'angry-cancel': {
    id: 'angry-cancel',
    prompt: {
      id: 'Klien marah mau berhenti & minta refund; sebagian keluhannya valid. Balasan terbaik?',
      en: 'Angry client wants to quit and refund; some complaints are valid. Best reply?',
    },
    correct: 3,
    options: [
      {
        text: { id: 'Balas marah dan salahkan klien.', en: 'Respond angrily and blame the client.' },
        explanation: { id: 'Memperkeruh dan pasti kehilangan klien.', en: 'Escalates and guarantees losing them.' },
      },
      {
        text: { id: 'Langsung setuju refund tanpa bahas perbaikan.', en: 'Instantly agree to refund without discussing a fix.' },
        explanation: { id: 'Menyerah padahal masih bisa dipulihkan.', en: 'Gives up when recovery is still possible.' },
      },
      {
        text: { id: 'Bantah semua keluhan satu per satu.', en: 'Rebut every complaint one by one.' },
        explanation: { id: 'Defensif, mengabaikan keluhan yang valid.', en: 'Defensive, ignores valid complaints.' },
      },
      {
        text: { id: 'Tenangkan, akui yang valid, tawarkan rencana perbaikan, tangani refund profesional.', en: 'De-escalate, own valid points, offer a recovery plan, handle refund professionally.' },
        explanation: { id: 'Empati + tanggung jawab + jalan keluar.', en: 'Empathy plus ownership plus a path forward.' },
      },
    ],
  },
  'lead-team': {
    id: 'lead-team',
    prompt: {
      id: 'Klien minta kamu memimpin 2 VA lain untuk proyek besar. Balasan terbaik?',
      en: 'The client asks you to lead 2 other VAs on a big project. Best reply?',
    },
    correct: 0,
    options: [
      {
        text: { id: 'Usulkan pembagian tugas, satu titik tanggung jawab, dan ritme laporan jelas.', en: 'Propose task split, a single point of accountability, and a clear reporting cadence.' },
        explanation: { id: 'Memberi klien kepastian & hasil rapi.', en: 'Gives the client certainty and clean results.' },
      },
      {
        text: { id: 'Kerjakan semua sendiri agar pasti rapi.', en: 'Do everything yourself to be safe.' },
        explanation: { id: 'Tidak skala dan cepat kelelahan.', en: 'Does not scale and burns you out.' },
      },
      {
        text: { id: 'Biarkan tiap VA jalan sendiri tanpa koordinasi.', en: 'Let each VA work alone with no coordination.' },
        explanation: { id: 'Hasil tak konsisten dan kacau.', en: 'Inconsistent, messy results.' },
      },
      {
        text: { id: 'Minta klien yang mengatur ketiganya.', en: 'Ask the client to manage all three.' },
        explanation: { id: 'Justru itu yang ingin klien hindari.', en: 'That is exactly what the client wants to avoid.' },
      },
    ],
  },
  'strategic-discovery': {
    id: 'strategic-discovery',
    prompt: {
      id: 'Klien high-value: "aku mau tumbuh tahun ini, bantu aku" (brief sengaja luas). Balasan terbaik?',
      en: 'High-value client: "I want to grow this year, help me" (deliberately broad). Best reply?',
    },
    correct: 2,
    options: [
      {
        text: { id: 'Langsung tawarkan paket konten standar.', en: 'Immediately pitch a standard content package.' },
        explanation: { id: 'Lompat ke eksekusi tanpa tahu tujuan.', en: 'Jumps to execution without the goal.' },
      },
      {
        text: { id: 'Jawab "siap, nanti aku pikirkan".', en: 'Reply "sure, I will think about it".' },
        explanation: { id: 'Pasif; tak menunjukkan pemikiran strategis.', en: 'Passive; shows no strategic thinking.' },
      },
      {
        text: { id: 'Ajukan pertanyaan strategis untuk menemukan target & prioritas sebenarnya.', en: 'Ask strategic questions to uncover the real target and priorities.' },
        explanation: { id: 'Berpikir strategis sebelum eksekusi.', en: 'Thinks strategically before executing.' },
      },
      {
        text: { id: 'Minta anggaran besar dulu sebelum bicara.', en: 'Demand a big budget before any discussion.' },
        explanation: { id: 'Menempatkan uang di atas kebutuhan klien.', en: 'Puts money ahead of the client need.' },
      },
    ],
  },
}

export const TOTAL_SCENARIO_QUIZZES = Object.keys(SCENARIO_QUIZZES).length

/** Kuis untuk sebuah skenario, atau undefined bila tak ada. */
export function scenarioQuiz(scenarioId: string): QuizQuestion | undefined {
  return SCENARIO_QUIZZES[scenarioId]
}

/** True bila indeks opsi yang dipilih adalah jawaban benar. Murni & dapat diuji. */
export function isCorrect(question: QuizQuestion, choiceIndex: number): boolean {
  return choiceIndex === question.correct
}

/** Hitung skor dari peta jawaban {questionId: indeksPilihan}. */
export function scoreAnswers(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): { correct: number; total: number } {
  let correct = 0
  for (const q of questions) {
    if (q.id in answers && isCorrect(q, answers[q.id])) correct++
  }
  return { correct, total: questions.length }
}

/** Kuis konsep A/B/C/D per level untuk tab Materi (Uji pemahaman). */
export const LEVEL_QUIZZES: Record<LevelId, QuizQuestion[]> = {
  pemula: [
    {
      id: 'pem-1',
      prompt: { id: 'Apa yang paling membuat klien mempercayai seorang VA?', en: 'What most makes a client trust a VA?' },
      correct: 0,
      options: [
        { text: { id: 'Keandalan: tepat waktu, jujur soal progres, jaga kerahasiaan.', en: 'Reliability: on time, honest about progress, keeps things confidential.' }, explanation: { id: 'Inti kepercayaan VA adalah dapat diandalkan dan jujur.', en: 'Trust in a VA is built on reliability and honesty.' } },
        { text: { id: 'Mengerjakan semua permintaan tanpa pernah bertanya.', en: 'Doing every request without ever asking.' }, explanation: { id: 'Tanpa klarifikasi, hasil sering meleset.', en: 'Without clarifying, work often misses the mark.' } },
        { text: { id: 'Memakai sebanyak mungkin tools canggih.', en: 'Using as many fancy tools as possible.' }, explanation: { id: 'Tools hanya pendukung, bukan dasar kepercayaan.', en: 'Tools only support; they are not the basis of trust.' } },
        { text: { id: 'Memberi harga termurah di pasar.', en: 'Offering the cheapest price on the market.' }, explanation: { id: 'Harga murah tak menggantikan keandalan.', en: 'Cheap pricing does not replace reliability.' } },
      ],
    },
    {
      id: 'pem-2',
      prompt: { id: 'Saat memilih tools kerja, yang paling penting dipahami adalah...', en: 'When choosing work tools, the most important thing to understand is...' },
      correct: 1,
      options: [
        { text: { id: 'Merek tools yang paling populer.', en: 'The most popular tool brand.' }, explanation: { id: 'Popularitas bukan ukuran kecocokan.', en: 'Popularity is not a measure of fit.' } },
        { text: { id: 'Fungsi tiap tool dan cara menatanya rapi.', en: 'What each tool does and how to keep it organized.' }, explanation: { id: 'Paham fungsi membuat kerja efisien dan rapi.', en: 'Knowing the function keeps work efficient and tidy.' } },
        { text: { id: 'Semua tombol dan fitur tersembunyi.', en: 'Every button and hidden feature.' }, explanation: { id: 'Tak perlu hafal semua; cukup yang dipakai.', en: 'No need to memorize all; just what you use.' } },
        { text: { id: 'Tools yang paling mahal pasti terbaik.', en: 'The most expensive tool must be the best.' }, explanation: { id: 'Mahal belum tentu paling cocok.', en: 'Expensive is not always the best fit.' } },
      ],
    },
    {
      id: 'pem-3',
      prompt: { id: 'Untuk klien yang membayar per jam, kebiasaan penting VA adalah...', en: 'For an hourly client, an important VA habit is...' },
      correct: 0,
      options: [
        { text: { id: 'Melacak waktu kerja secara akurat.', en: 'Tracking work time accurately.' }, explanation: { id: 'Time tracking menjaga tagihan jujur dan jelas.', en: 'Time tracking keeps billing honest and clear.' } },
        { text: { id: 'Menebak jam kerja di akhir bulan.', en: 'Guessing the hours at month end.' }, explanation: { id: 'Menebak berisiko salah dan tak adil.', en: 'Guessing risks error and unfairness.' } },
        { text: { id: 'Bekerja tanpa mencatat waktu sama sekali.', en: 'Working without logging any time.' }, explanation: { id: 'Tanpa catatan, billing per jam tak bisa dipercaya.', en: 'Without logs, hourly billing is untrustworthy.' } },
        { text: { id: 'Membulatkan jam selalu ke atas.', en: 'Always rounding hours up.' }, explanation: { id: 'Itu tidak jujur dan merusak hubungan.', en: 'That is dishonest and harms the relationship.' } },
      ],
    },
  ],
  menengah: [
    {
      id: 'men-1',
      prompt: { id: 'Balasan email klien yang baik sebaiknya...', en: 'A good client email reply should...' },
      correct: 1,
      options: [
        { text: { id: 'Sepanjang mungkin agar terkesan serius.', en: 'Be as long as possible to seem serious.' }, explanation: { id: 'Panjang tak sama dengan jelas.', en: 'Long is not the same as clear.' } },
        { text: { id: 'Menaruh tujuan di depan dan langkah berikutnya jelas.', en: 'Put the purpose up front with clear next steps.' }, explanation: { id: 'Jelas dan ringkas memudahkan klien.', en: 'Clear and concise helps the client act.' } },
        { text: { id: 'Tanpa salam atau penutup.', en: 'Skip any greeting or closing.' }, explanation: { id: 'Sapaan menjaga nada profesional.', en: 'A greeting keeps a professional tone.' } },
        { text: { id: 'Menunda jawaban inti sampai paragraf terakhir.', en: 'Bury the main answer in the last paragraph.' }, explanation: { id: 'Klien sibuk butuh inti di awal.', en: 'A busy client needs the point first.' } },
      ],
    },
    {
      id: 'men-2',
      prompt: { id: 'Notula meeting yang berguna harus memuat...', en: 'Useful meeting notes must include...' },
      correct: 1,
      options: [
        { text: { id: 'Transkrip kata demi kata.', en: 'A word-for-word transcript.' }, explanation: { id: 'Transkrip mentah sulit ditindaklanjuti.', en: 'A raw transcript is hard to act on.' } },
        { text: { id: 'Ringkasan, keputusan, dan action item dengan pemilik dan tenggat.', en: 'A summary, decisions, and action items with owners and deadlines.' }, explanation: { id: 'Itu membuat hasil rapat bisa dieksekusi.', en: 'That makes the meeting outcome executable.' } },
        { text: { id: 'Opini pribadi VA tentang peserta.', en: 'The VA personal opinions about attendees.' }, explanation: { id: 'Tidak profesional dan tak relevan.', en: 'Unprofessional and irrelevant.' } },
        { text: { id: 'Hal yang dikarang bila lupa.', en: 'Made-up items when you forget.' }, explanation: { id: 'Mengarang merusak kepercayaan.', en: 'Fabricating breaks trust.' } },
      ],
    },
    {
      id: 'men-3',
      prompt: { id: 'Saat meriset dan merangkum data untuk klien, VA wajib...', en: 'When researching and summarizing data for a client, a VA must...' },
      correct: 0,
      options: [
        { text: { id: 'Mencatat sumber dan memisahkan fakta dari asumsi.', en: 'Record sources and separate facts from assumptions.' }, explanation: { id: 'Itu menjaga riset kredibel dan jujur.', en: 'That keeps research credible and honest.' } },
        { text: { id: 'Menambah angka agar laporan terlihat meyakinkan.', en: 'Add numbers to make the report look convincing.' }, explanation: { id: 'Mengarang data adalah pelanggaran serius.', en: 'Fabricating data is a serious breach.' } },
        { text: { id: 'Menyalin satu sumber tanpa verifikasi.', en: 'Copy one source without verifying.' }, explanation: { id: 'Satu sumber tak terverifikasi berisiko salah.', en: 'One unverified source risks being wrong.' } },
        { text: { id: 'Menyembunyikan dari mana data berasal.', en: 'Hide where the data came from.' }, explanation: { id: 'Sumber harus transparan agar bisa dicek.', en: 'Sources must be transparent to be checked.' } },
      ],
    },
  ],
  mahir: [
    {
      id: 'mah-1',
      prompt: { id: 'Kalender konten sosmed yang sehat sebaiknya...', en: 'A healthy social content calendar should...' },
      correct: 1,
      options: [
        { text: { id: 'Hanya berisi konten jualan terus-menerus.', en: 'Be nothing but constant sales posts.' }, explanation: { id: 'Jualan terus membuat audiens jenuh.', en: 'Nonstop selling tires the audience.' } },
        { text: { id: 'Mencampur edukasi, interaksi, brand, dan ajakan secara seimbang.', en: 'Mix education, engagement, brand, and calls to action in balance.' }, explanation: { id: 'Bauran seimbang menjaga audiens tetap terlibat.', en: 'A balanced mix keeps the audience engaged.' } },
        { text: { id: 'Memposting sebanyak mungkin tanpa rencana.', en: 'Post as much as possible with no plan.' }, explanation: { id: 'Tanpa rencana, kualitas dan konsistensi turun.', en: 'Without a plan, quality and consistency drop.' } },
        { text: { id: 'Meniru persis akun pesaing.', en: 'Copy a competitor account exactly.' }, explanation: { id: 'Meniru mentah tak membangun identitas brand.', en: 'Blind copying builds no brand identity.' } },
      ],
    },
    {
      id: 'mah-2',
      prompt: { id: 'Tujuan utama menulis SOP adalah...', en: 'The main purpose of writing an SOP is...' },
      correct: 0,
      options: [
        { text: { id: 'Membuat pekerjaan bisa diulang dan didelegasikan dengan konsisten.', en: 'Make work repeatable and delegable with consistency.' }, explanation: { id: 'SOP menjaga kualitas saat tugas berpindah tangan.', en: 'An SOP keeps quality when work changes hands.' } },
        { text: { id: 'Memperpanjang dokumen agar terlihat sibuk.', en: 'Pad documents to look busy.' }, explanation: { id: 'SOP justru harus ringkas dan jelas.', en: 'An SOP should be concise and clear.' } },
        { text: { id: 'Menyimpan rahasia agar tak ada yang bisa menggantikan kita.', en: 'Hoard know-how so no one can replace us.' }, explanation: { id: 'Itu menghambat penskalaan dan tim.', en: 'That blocks scaling and team growth.' } },
        { text: { id: 'Mengganti kebutuhan komunikasi tim.', en: 'Replace the need for team communication.' }, explanation: { id: 'SOP melengkapi, bukan mengganti komunikasi.', en: 'An SOP complements, not replaces, communication.' } },
      ],
    },
    {
      id: 'mah-3',
      prompt: { id: 'Caption sosmed yang kuat biasanya...', en: 'A strong social caption usually...' },
      correct: 1,
      options: [
        { text: { id: 'Penuh klaim berlebihan dan janji palsu.', en: 'Is full of hype and false promises.' }, explanation: { id: 'Klaim palsu merusak kepercayaan brand.', en: 'False claims damage brand trust.' } },
        { text: { id: 'Punya hook pembuka jelas dan satu ide utama.', en: 'Has a clear opening hook and one main idea.' }, explanation: { id: 'Fokus dan hook membuat caption mudah dicerna.', en: 'Focus and a hook make captions easy to grasp.' } },
        { text: { id: 'Memakai ajakan yang sama persis tiap kali.', en: 'Uses the exact same call to action every time.' }, explanation: { id: 'Variasi mencegah audiens bosan.', en: 'Variety keeps the audience from tuning out.' } },
        { text: { id: 'Sepanjang mungkin tanpa fokus.', en: 'Is as long as possible with no focus.' }, explanation: { id: 'Tanpa fokus, pesan jadi kabur.', en: 'Without focus the message blurs.' } },
      ],
    },
  ],
  expert: [
    {
      id: 'exp-1',
      prompt: { id: 'Kenapa VA spesialis biasanya bisa memasang harga lebih tinggi?', en: 'Why can a specialist VA usually charge more?' },
      correct: 1,
      options: [
        { text: { id: 'Karena mereka bekerja lebih lama tiap hari.', en: 'Because they work longer hours each day.' }, explanation: { id: 'Nilai datang dari hasil, bukan jam panjang.', en: 'Value comes from results, not long hours.' } },
        { text: { id: 'Karena keahlian fokus memberi hasil yang lebih bernilai bagi klien.', en: 'Because focused expertise delivers more valuable results for the client.' }, explanation: { id: 'Spesialis dibayar untuk hasil, bukan waktu.', en: 'Specialists are paid for outcomes, not time.' } },
        { text: { id: 'Karena memakai banyak tools mahal.', en: 'Because they use many expensive tools.' }, explanation: { id: 'Tools bukan alasan harga premium.', en: 'Tools are not the reason for premium pricing.' } },
        { text: { id: 'Karena menolak semua negosiasi.', en: 'Because they refuse all negotiation.' }, explanation: { id: 'Harga premium soal nilai, bukan kekakuan.', en: 'Premium pricing is about value, not rigidity.' } },
      ],
    },
    {
      id: 'exp-2',
      prompt: { id: 'Cara paling efektif menjaga klien jangka panjang adalah...', en: 'The most effective way to keep clients long term is...' },
      correct: 0,
      options: [
        { text: { id: 'Komunikasi proaktif dan menunjukkan nilai secara rutin.', en: 'Proactive communication and showing value regularly.' }, explanation: { id: 'Klien bertahan saat merasa diurus dan melihat hasil.', en: 'Clients stay when cared for and shown results.' } },
        { text: { id: 'Menunggu klien komplain baru bertindak.', en: 'Wait for a complaint before acting.' }, explanation: { id: 'Reaktif membuat klien merasa diabaikan.', en: 'Being reactive makes clients feel ignored.' } },
        { text: { id: 'Selalu menurunkan harga tiap bulan.', en: 'Keep cutting price every month.' }, explanation: { id: 'Diskon terus menggerus nilai dan margin.', en: 'Constant discounts erode value and margin.' } },
        { text: { id: 'Menghindari kontak agar tidak mengganggu.', en: 'Avoid contact so as not to bother them.' }, explanation: { id: 'Sunyi membuat klien lupa nilai kita.', en: 'Silence makes clients forget your value.' } },
      ],
    },
    {
      id: 'exp-3',
      prompt: { id: 'Untuk naik ke penghasilan jauh lebih besar, langkah kuncinya adalah...', en: 'To scale to much higher income, a key step is...' },
      correct: 1,
      options: [
        { text: { id: 'Mengerjakan semuanya sendiri selamanya.', en: 'Do everything yourself forever.' }, explanation: { id: 'Kapasitas solo terbatas oleh jam kerja.', en: 'Solo capacity is capped by your hours.' } },
        { text: { id: 'Mendelegasikan lewat SOP dan memakai AI untuk menggandakan output.', en: 'Delegate via SOPs and use AI to multiply output.' }, explanation: { id: 'Delegasi dan AI melepas batas jam kerja.', en: 'Delegation and AI lift the hours ceiling.' } },
        { text: { id: 'Menerima semua klien tanpa seleksi.', en: 'Take every client with no selection.' }, explanation: { id: 'Tanpa seleksi, kualitas dan margin turun.', en: 'Without selection, quality and margin fall.' } },
        { text: { id: 'Berhenti belajar setelah merasa mahir.', en: 'Stop learning once you feel skilled.' }, explanation: { id: 'Pasar berubah; belajar terus menjaga nilai.', en: 'Markets shift; learning keeps your value.' } },
      ],
    },
  ],
}

export const TOTAL_LEVEL_QUESTIONS = Object.values(LEVEL_QUIZZES).reduce(
  (n, qs) => n + qs.length,
  0,
)

/** Daftar pertanyaan kuis untuk satu level (kosong bila tak ada). */
export function levelQuiz(level: LevelId): QuizQuestion[] {
  return LEVEL_QUIZZES[level] ?? []
}
