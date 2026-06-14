// src/learn/roleplay.ts
// Latihan Klien sebagai roleplay percakapan bertahap dengan pilihan jawaban.
// Tiap skenario punya beberapa giliran: klien mengirim pesan, learner memilih
// balasan A/B/C/D, lalu mendapat penjelasan ala guru pada setiap opsi. Statis,
// dwibahasa, tanpa AI, tanpa ketik. Logika murni & dapat diuji; UI terpisah.
import type { Language } from '../ai/templates'
import { SCENARIOS } from './scenarios'

type Loc = Record<Language, string>

export interface RoleplayOption {
  text: Loc
  explanation: Loc
}

export interface RoleplayStep {
  /** Pesan klien pada giliran ini. */
  client: Loc
  options: RoleplayOption[]
  /** Indeks balasan terbaik (0-3). */
  correct: number
}

const O = (
  idText: string,
  enText: string,
  idExp: string,
  enExp: string,
): RoleplayOption => ({
  text: { id: idText, en: enText },
  explanation: { id: idExp, en: enExp },
})

/** Dialog roleplay per skenario (kunci = id skenario). 3 giliran tiap skenario. */
export const ROLEPLAYS: Record<string, RoleplayStep[]> = {
  'brief-vague': [
    {
      client: { id: 'Tolong buatin konten ya, yang bagus.', en: 'Make me some good content, ok.' },
      correct: 1,
      options: [
        O('Langsung bikin 10 konten random biar cepat.', 'Just make 10 random posts to be fast.', 'Tanpa arah, hasilnya kemungkinan besar meleset.', 'Without direction the result likely misses.'),
        O('Boleh, biar pas: ini buat platform apa, tujuannya apa, dan kapan butuhnya?', 'Sure, to nail it: which platform, what goal, and when do you need it?', 'Dua-tiga pertanyaan inti bikin hasil tepat sasaran.', 'A few key questions keep the output on target.'),
        O('Siap, beres nanti malam!', 'Got it, done tonight!', 'Janji sebelum tahu kebutuhan = overpromise.', 'Promising before knowing the need is overpromising.'),
        O('Kirim form 20 pertanyaan dulu ya.', 'Fill this 20-question form first.', 'Terlalu membebani klien yang sibuk.', 'Too heavy for a busy client.'),
      ],
    },
    {
      client: { id: 'Oh iya, buat promo produk baru minggu depan, di Instagram.', en: 'Oh right, for a new product promo next week, on Instagram.' },
      correct: 2,
      options: [
        O('Pasti viral deh pokoknya.', 'It will definitely go viral.', 'Klaim hasil yang tak bisa dijamin.', 'Claiming results you cannot guarantee.'),
        O('Oke aku kerjakan sekarang.', 'Ok I will start now.', 'Belum tahu audiens & tanggal launch, rawan meleset.', 'Audience and launch date still unknown.'),
        O('Sip. Target audiensnya siapa dan launch tanggal berapa? Aku usul 3 konten teaser + 1 hari-H.', 'Great. Who is the audience and the launch date? I suggest 3 teasers + 1 launch-day post.', 'Konfirmasi inti lalu usul rencana konkret.', 'Confirms essentials then proposes a concrete plan.'),
        O('Terserah kamu aja konsepnya.', 'Up to you on the concept.', 'Melempar balik tanggung jawab ke klien.', 'Pushes the thinking back to the client.'),
      ],
    },
    {
      client: { id: 'Oke, kira-kira kapan aku bisa lihat draftnya?', en: 'Ok, when can I see the draft?' },
      correct: 0,
      options: [
        O('Konsep besok, draft lengkap 2 hari setelah kamu approve arah kontennya.', 'Concept tomorrow, full draft 2 days after you approve the direction.', 'Estimasi realistis + minta approval konsep dulu.', 'Realistic estimate and approves direction first.'),
        O('Semua jadi hari ini kok.', 'All done today.', 'Overpromise yang berisiko gagal ditepati.', 'Overpromising you may not keep.'),
        O('Nanti kalau sempat ya.', 'Whenever I get to it.', 'Tak memberi kepastian; klien cemas.', 'Gives no certainty; the client worries.'),
        O('Pokoknya cepat, tenang aja.', 'Soon, do not worry.', 'Samar, tanpa komitmen jelas.', 'Vague, no clear commitment.'),
      ],
    },
  ],
  'first-contact': [
    {
      client: { id: 'Kamu bisa bantu apa aja sih sebagai VA?', en: 'So what can you actually help with as a VA?' },
      correct: 1,
      options: [
        O('Bisa semua kok, apa aja deh.', 'I can do anything, whatever you want.', 'Terlalu kabur dan terkesan overpromise.', 'Too vague and sounds like overpromising.'),
        O('Aku bantu admin, email, jadwal, dan sosmed. Sekarang yang paling makan waktu kamu apa?', 'I help with admin, email, scheduling, and social. What eats most of your time right now?', 'Sebut layanan inti lalu fokus ke kebutuhan klien.', 'Names core services then centers the client need.'),
        O('Kirim daftar 30 layanan tanpa konteks.', 'Send a list of 30 services with no context.', 'Membanjiri; klien bingung mana yang relevan.', 'Overwhelming; the client cannot see what fits.'),
        O('Langsung kirim daftar harga.', 'Immediately send a price list.', 'Terlalu cepat; kebutuhan belum dipahami.', 'Too soon; the need is not understood yet.'),
      ],
    },
    {
      client: { id: 'Aku sibuk banget, takutnya malah nambah kerjaan ngatur kamu.', en: 'I am very busy, I worry managing you adds more work.' },
      correct: 3,
      options: [
        O('Tenang, aku gak ngerepotin kok.', 'Relax, I will not bother you.', 'Menenangkan tapi tanpa bukti cara kerja.', 'Reassuring but shows no method.'),
        O('Ya mau gimana lagi, namanya juga kerja.', 'Well, that is just how work goes.', 'Defensif dan tidak membantu.', 'Defensive and unhelpful.'),
        O('Kalau gitu kamu yang atur aku ya.', 'Then you manage me, ok.', 'Justru menambah beban yang dia takutkan.', 'Adds exactly the burden he fears.'),
        O('Aku pakai update rutin singkat dan satu titik kontak, jadi kamu cukup terima laporan.', 'I use short regular updates and one point of contact, so you just receive reports.', 'Menjawab kekhawatiran dengan sistem kerja jelas.', 'Answers the worry with a clear working system.'),
      ],
    },
    {
      client: { id: 'Oke menarik. Coba kasih contoh gimana kita mulai.', en: 'Ok interesting. Show me how we would start.' },
      correct: 0,
      options: [
        O('Mulai dari 1 tugas kecil minggu ini sebagai uji coba, lalu kita evaluasi.', 'Start with one small task this week as a trial, then we review.', 'Langkah pertama kecil & berisiko rendah membangun kepercayaan.', 'A small low-risk first step builds trust.'),
        O('Tanda tangan kontrak 6 bulan dulu.', 'Sign a 6-month contract first.', 'Terlalu menekan di kontak pertama.', 'Too pushy at first contact.'),
        O('Bayar di muka penuh ya.', 'Pay in full upfront.', 'Menutup pintu sebelum kepercayaan terbangun.', 'Closes the door before trust exists.'),
        O('Nanti aku pikirkan dulu.', 'Let me think about it later.', 'Pasif; kehilangan momentum.', 'Passive; loses momentum.'),
      ],
    },
  ],
  'progress-update': [
    {
      client: { id: 'Gimana progres yang kemarin?', en: 'How is the task from yesterday going?' },
      correct: 2,
      options: [
        O('Hampir selesai kok (padahal belum).', 'Almost done (but it is not).', 'Membesarkan progres merusak kepercayaan.', 'Inflating progress breaks trust.'),
        O('Lagi dikerjain.', 'Working on it.', 'Terlalu samar; tak memberi kepastian.', 'Too vague; gives no certainty.'),
        O('Sudah 60%: bagian A & B beres, sisa C, perkiraan selesai besok sore.', 'About 60% done: A and B finished, C left, expect done tomorrow afternoon.', 'Jujur, jelas, dan menenangkan.', 'Honest, clear, and reassuring.'),
        O('Diam dulu sampai semua beres.', 'Stay silent until everything is finished.', 'Klien jadi cemas tanpa kabar.', 'The client grows anxious without news.'),
      ],
    },
    {
      client: { id: 'Oke. Yang bagian C kenapa lama?', en: 'Ok. Why is part C slow?' },
      correct: 0,
      options: [
        O('C butuh data dari kamu yang belum masuk; kalau hari ini dikirim, besok beres.', 'C needs data from you that is missing; if sent today, done tomorrow.', 'Jelaskan penyebab jujur + langkah membuka jalan.', 'Honest cause plus the step that unblocks it.'),
        O('Ya namanya kerjaan susah.', 'Well, the work is just hard.', 'Tak menjelaskan apa-apa.', 'Explains nothing.'),
        O('Maaf aku lambat banget.', 'Sorry I am so slow.', 'Minta maaf berlebihan tanpa solusi.', 'Over-apologizing without a fix.'),
        O('C nya aku skip aja ya.', 'Let me just skip C.', 'Menghilangkan bagian kerja tanpa izin.', 'Drops scope without permission.'),
      ],
    },
    {
      client: { id: 'Siap, datanya aku kirim sekarang. Makasih updatenya.', en: 'Ok, sending the data now. Thanks for the update.' },
      correct: 1,
      options: [
        O('Oke.', 'Ok.', 'Terlalu datar untuk menutup.', 'Too flat to close on.'),
        O('Sip, sudah kuterima. Aku kabari lagi begitu C selesai besok sore.', 'Got it, received. I will update you once C is done tomorrow afternoon.', 'Konfirmasi terima + komitmen tindak lanjut.', 'Confirms receipt and commits to follow up.'),
        O('Jangan lupa bayar ya.', 'Do not forget to pay.', 'Tidak relevan dan kasar di momen ini.', 'Irrelevant and rude here.'),
        O('Semoga aja keburu.', 'Hopefully it makes it.', 'Menanam keraguan, bukan kepastian.', 'Plants doubt instead of certainty.'),
      ],
    },
  ],
  'schedule-admin': [
    {
      client: { id: 'Tolong atur jadwal meeting aku minggu depan sama 3 orang ini.', en: 'Please set up my meetings next week with these 3 people.' },
      correct: 1,
      options: [
        O('Tanyakan semua detail satu per satu panjang lebar.', 'Ask every detail one by one at length.', 'Bertele-tele; klien sibuk tak suka.', 'Long-winded; a busy client dislikes it.'),
        O('Siap. Aku butuh 3 hal: durasi tiap meeting, online/offline, dan rentang jam yang kamu hindari.', 'On it. I need 3 things: duration each, online/offline, and hours you want avoided.', 'Kumpulkan info penting secara ringkas & proaktif.', 'Collects the essentials concisely and proactively.'),
        O('Aku tebak aja jamnya dan kirim undangan.', 'I will guess the times and send invites.', 'Berisiko salah jadwal/zona waktu.', 'Risks wrong time or timezone.'),
        O('Kamu atur sendiri aja ya.', 'You arrange it yourself.', 'Itu justru tugas VA.', 'That is exactly the VA job.'),
      ],
    },
    {
      client: { id: 'Masing-masing 30 menit, online, hindari sebelum jam 10 pagi.', en: '30 minutes each, online, avoid before 10am.' },
      correct: 3,
      options: [
        O('Oke, langsung kukunci tanpa cek ketersediaan mereka.', 'Ok, I will lock it without checking their availability.', 'Bisa bentrok dengan jadwal peserta.', 'May clash with attendees schedules.'),
        O('Berarti gak bisa minggu depan dong.', 'Then next week is impossible.', 'Negatif tanpa alasan.', 'Negative for no reason.'),
        O('Aku butuh nomor mereka buat telepon satu-satu.', 'I need their numbers to call each one.', 'Tidak efisien untuk penjadwalan.', 'Inefficient for scheduling.'),
        O('Sip. Aku kirim 3 opsi slot ke mereka via email lalu kunci yang cocok.', 'Got it. I will email them 3 slot options then lock the match.', 'Cara standar & rapi menjadwalkan lintas orang.', 'Standard, tidy way to schedule across people.'),
      ],
    },
    {
      client: { id: 'Bagus. Nanti undangannya kamu yang kirim ya.', en: 'Good. You send the invites, ok.' },
      correct: 0,
      options: [
        O('Siap, undangan kalender + link meeting kukirim, dan kukabari kalau semua sudah konfirmasi.', 'Sure, I will send calendar invites + meeting links, and tell you once all confirm.', 'Tuntas sampai konfirmasi, klien tinggal terima.', 'Sees it through to confirmation; client just receives.'),
        O('Kirim sendiri ya, aku cuma nyusun.', 'You send them, I only arranged.', 'Setengah jalan; bukan layanan penuh.', 'Half done; not full service.'),
        O('Undangannya besok-besok aja.', 'Invites some other day.', 'Menunda hal yang mendesak.', 'Delays a time-sensitive task.'),
        O('Pakai aplikasi apa ya enaknya?', 'Which app should I even use?', 'Menunjukkan ketidaksiapan dasar.', 'Shows basic unreadiness.'),
      ],
    },
  ],
  'price-nego': [
    {
      client: { id: 'Harganya kemahalan, bisa turun 50%? Nanti aku kasih banyak kerjaan.', en: 'Too expensive, can you drop 50%? I will give you lots of work later.' },
      correct: 3,
      options: [
        O('Oke deh, turun 50%.', 'Ok, 50% off.', 'Merendahkan nilai dan sulit dinaikkan lagi.', 'Undercuts your value and is hard to raise back.'),
        O('Gak bisa, segitu harganya.', 'No, that is the price.', 'Benar soal nilai tapi nadanya kaku.', 'Right on value but the tone is rigid.'),
        O('Kenapa sih kamu nawar terus?', 'Why do you keep haggling?', 'Defensif memperburuk negosiasi.', 'Defensiveness worsens the negotiation.'),
        O('Harga ini sepadan hasilnya. Tapi aku bisa buat paket lebih ringan agar sesuai budget sekarang.', 'The price matches the results. But I can offer a lighter package to fit your budget now.', 'Tahan nilai sambil tawarkan opsi, bukan diskon buta.', 'Holds value while offering options, not blind discounts.'),
      ],
    },
    {
      client: { id: 'Hmm. Kalau kerjaan banyak nanti, masa gak ada diskon?', en: 'Hmm. If there is lots of work later, no discount at all?' },
      correct: 1,
      options: [
        O('Ya udah, spesial buat kamu setengah harga.', 'Fine, special half price for you.', 'Menyerah; melatih klien menawar terus.', 'Caving; trains endless haggling.'),
        O('Untuk volume rutin, aku bisa kasih rate retainer bulanan yang lebih efisien.', 'For steady volume, I can offer a more efficient monthly retainer rate.', 'Diskon dikaitkan komitmen nyata, bukan janji.', 'Ties a discount to real commitment, not a promise.'),
        O('Diskon itu pamali.', 'Discounts are taboo.', 'Kaku dan tidak profesional.', 'Rigid and unprofessional.'),
        O('Tergantung mood aku sih.', 'Depends on my mood.', 'Tak profesional dan membingungkan.', 'Unprofessional and confusing.'),
      ],
    },
    {
      client: { id: 'Oke, paket retainer itu kedengarannya masuk akal.', en: 'Ok, that retainer package sounds reasonable.' },
      correct: 2,
      options: [
        O('Tapi DP dulu 100% ya.', 'But 100% deposit first.', 'Tiba-tiba menekan, merusak momentum.', 'Suddenly pushy, kills momentum.'),
        O('Yaudah kalau gitu.', 'Ok then, whatever.', 'Datar; tak menutup dengan baik.', 'Flat; closes poorly.'),
        O('Mantap. Aku kirim rincian paket + lingkup kerjanya hari ini biar jelas.', 'Great. I will send the package details and scope today so it is clear.', 'Menutup dengan langkah konkret & lingkup jelas.', 'Closes with a concrete step and clear scope.'),
        O('Jangan lupa promosiin aku ke teman ya.', 'Do not forget to promote me to friends.', 'Belum waktunya; terkesan memaksa.', 'Wrong time; feels pushy.'),
      ],
    },
  ],
  'inbox-triage': [
    {
      client: { id: 'Inbox aku 200 email belum dibaca, tolong beresin dan kasih tahu mana yang penting.', en: 'I have 200 unread emails, please sort them and tell me what matters.' },
      correct: 2,
      options: [
        O('Beres hari ini, tenang aja.', 'Done today, no worries.', 'Overpromise sebelum tahu bebannya.', 'Overpromising before knowing the load.'),
        O('Kamu pilah dulu deh yang penting.', 'You sort the important ones first.', 'Memindahkan tugas balik ke klien.', 'Pushes the task back to the client.'),
        O('Aku pakai sistem label: penting/tindak lanjut/arsip. Boleh aku diberi akses inbox-nya?', 'I will use labels: important/follow-up/archive. Can I get access to the inbox?', 'Rencana jelas lalu minta bahan dulu.', 'Clear plan, then asks for the input first.'),
        O('Aku hapus yang lama biar cepat.', 'I will delete old ones to be fast.', 'Berisiko menghapus yang penting.', 'Risks deleting important ones.'),
      ],
    },
    {
      client: { id: 'Oke aksesnya aku kasih. Yang paling aku takut itu kelewat email klien.', en: 'Ok I will give access. My biggest fear is missing a client email.' },
      correct: 0,
      options: [
        O('Aku prioritaskan email dari klien & yang ada deadline, kutandai khusus dan kuringkas harian.', 'I will prioritize client and deadline emails, flag them, and summarize daily.', 'Menjawab langsung ketakutan utamanya.', 'Directly answers his core fear.'),
        O('Semua email sama aja pentingnya kok.', 'All emails matter equally anyway.', 'Mengabaikan prioritas yang dia minta.', 'Ignores the priority he asked for.'),
        O('Nanti kalau kelewat ya maaf.', 'If I miss one, sorry in advance.', 'Menanam keraguan, bukan kepercayaan.', 'Plants doubt, not confidence.'),
        O('Kamu pantau sendiri yang klien ya.', 'You watch the client ones yourself.', 'Justru tugas yang dia delegasikan.', 'Exactly the task he delegated.'),
      ],
    },
    {
      client: { id: 'Mantap. Kapan aku dapat ringkasan pertamanya?', en: 'Great. When do I get the first summary?' },
      correct: 3,
      options: [
        O('Entar-entar lah.', 'Sometime later.', 'Samar; tak memberi kepastian.', 'Vague; no certainty.'),
        O('Sekarang juga semua 200 kuringkas.', 'I will summarize all 200 right now.', 'Tak realistis; rawan gagal.', 'Unrealistic; likely to fail.'),
        O('Tergantung nanti ya.', 'Depends, we will see.', 'Tidak profesional.', 'Unprofessional.'),
        O('Sore ini ringkasan email penting & mendesak, sisanya kurapikan besok.', 'This afternoon a summary of urgent/important ones, the rest tidied tomorrow.', 'Realistis & bertahap, tetap cepat untuk yang genting.', 'Realistic and staged, still fast for the urgent ones.'),
      ],
    },
  ],
  'scope-creep': [
    {
      client: { id: 'Sekalian revisi ke-5 ya, kan gampang.', en: 'Just do a 5th revision too, it is easy right.' },
      correct: 2,
      options: [
        O('Iya deh, gratis aja.', 'Fine, for free.', 'Membiasakan ekstra gratis tanpa batas.', 'Trains endless free extras.'),
        O('Revisi habis, gak bisa.', 'Revisions used up, no.', 'Benar soal batas tapi nadanya kasar.', 'Right on limits but harsh tone.'),
        O('Paketmu termasuk 2 revisi dan sudah terpakai. Revisi tambahan bisa, dengan biaya kecil per putaran.', 'Your package includes 2 revisions, now used. Extra revisions are fine for a small per-round fee.', 'Batas jelas sekaligus menjaga hubungan.', 'Clear boundary while keeping the relationship.'),
        O('Diamkan saja permintaannya.', 'Just ignore the request.', 'Tidak profesional dan merusak kepercayaan.', 'Unprofessional and breaks trust.'),
      ],
    },
    {
      client: { id: 'Yah masa gitu, kan cuma ganti dikit doang.', en: 'Come on, it is just a tiny change.' },
      correct: 0,
      options: [
        O('Aku paham kelihatannya kecil. Tetap kucatat sebagai revisi tambahan agar adil buat kita berdua.', 'I get that it looks small. I still log it as an extra revision to be fair to us both.', 'Empati + konsisten pada batas yang sudah jelas.', 'Empathy plus consistency on the agreed boundary.'),
        O('Oke khusus ini gratis lagi.', 'Ok this one free again.', 'Melanggar batas yang baru dibuat.', 'Breaks the boundary you just set.'),
        O('Kamu ini maunya gratis terus.', 'You always want everything free.', 'Menyerang klien; merusak hubungan.', 'Attacks the client; harms the relationship.'),
        O('Ya sudah terserah.', 'Whatever, fine.', 'Pasif-agresif dan tidak jelas.', 'Passive-aggressive and unclear.'),
      ],
    },
    {
      client: { id: 'Oke deh, aku bayar yang tambahan. Kirim ya.', en: 'Ok, I will pay for the extra. Send it.' },
      correct: 1,
      options: [
        O('Nah gitu dong dari tadi.', 'See, should have said so earlier.', 'Menyindir; tak perlu.', 'Snide; unnecessary.'),
        O('Sip, aku kirim rincian biaya kecilnya lalu langsung kukerjakan revisinya.', 'Great, I will send the small fee details then do the revision right away.', 'Profesional: konfirmasi biaya lalu eksekusi.', 'Professional: confirm fee then execute.'),
        O('Bayar dulu baru aku mau ngomong.', 'Pay first before I even talk.', 'Kaku dan tidak ramah.', 'Rigid and unfriendly.'),
        O('Gratis aja deh akhirnya.', 'Actually just free then.', 'Membatalkan batas; melatih scope creep.', 'Cancels the boundary; trains scope creep.'),
      ],
    },
  ],
  'late-payment': [
    {
      client: { id: '(Invoice sudah lewat 2 minggu, klien belum bayar dan belum menyinggungnya.)', en: '(The invoice is 2 weeks overdue; the client has not paid or mentioned it.)' },
      correct: 1,
      options: [
        O('Diamkan saja, gak enak nagih.', 'Just stay quiet, chasing feels awkward.', 'Hakmu hilang; klien lupa.', 'You lose your due; the client forgets.'),
        O('Halo Pak, mengingatkan invoice #123 jatuh tempo 2 minggu lalu. Boleh dibantu prosesnya?', 'Hi, a reminder that invoice #123 was due 2 weeks ago. Could you help process it?', 'Sopan, jelas, menyebut nomor & jatuh tempo.', 'Polite, clear, cites the number and due date.'),
        O('Pak kok belum bayar?! Sudah telat!', 'Why have you not paid?! It is late!', 'Nada menuduh merusak hubungan.', 'Accusatory tone damages the relationship.'),
        O('Kalau gak bayar aku stop kerja.', 'Pay or I stop working.', 'Mengancam terlalu dini.', 'Threatening too early.'),
      ],
    },
    {
      client: { id: 'Aduh maaf banget, kelupaan! Invoice nomor berapa tadi ya?', en: 'Oh I am so sorry, I forgot! What was the invoice number again?' },
      correct: 3,
      options: [
        O('Yang itu lho, masa lupa.', 'That one, how could you forget.', 'Menyindir saat klien kooperatif.', 'Snide while the client is cooperating.'),
        O('Gak apa-apa, santai aja kapan-kapan.', 'No problem, whenever is fine.', 'Mengaburkan urgensi yang sah.', 'Blurs a legitimate urgency.'),
        O('Cari sendiri ya di email.', 'Look it up in your email.', 'Mempersulit klien yang mau bayar.', 'Makes it hard for a willing payer.'),
        O('Invoice #123, Rp X, ini kukirim ulang PDF + detail transfernya ya.', 'Invoice #123, total X, resending the PDF and transfer details now.', 'Permudah pembayaran: kirim ulang lengkap.', 'Makes paying easy: resends full details.'),
      ],
    },
    {
      client: { id: 'Oke sudah aku transfer barusan. Maaf ya telat.', en: 'Ok I just transferred it. Sorry it was late.' },
      correct: 0,
      options: [
        O('Sudah kuterima, terima kasih! Lancar terus ya kerja samanya.', 'Received, thank you! Looking forward to our continued work.', 'Tutup hangat, jaga hubungan jangka panjang.', 'Warm close, protects the long-term relationship.'),
        O('Lain kali jangan telat lagi ya.', 'Do not be late again next time.', 'Menggurui setelah selesai baik.', 'Lecturing after a good resolution.'),
        O('Akhirnya.', 'Finally.', 'Menyindir; merusak nada.', 'Snide; sours the tone.'),
        O('Belum masuk tuh, cek lagi.', 'Not in yet, check again.', 'Menuduh sebelum verifikasi.', 'Accusing before verifying.'),
      ],
    },
  ],
  'content-complaint': [
    {
      client: { id: 'Caption yang kamu buat jelek, gak ada yang nge-like. Ini gimana?', en: 'Your caption was bad, nobody liked it. What now?' },
      correct: 1,
      options: [
        O('Itu kan karena algoritma, bukan salah caption.', 'That is the algorithm, not the caption.', 'Defensif; klien merasa tak didengar.', 'Defensive; the client feels unheard.'),
        O('Maaf hasilnya belum sesuai harapan. Boleh aku lihat datanya biar tahu apa yang perlu diperbaiki?', 'Sorry it did not meet expectations. Can I see the data so I know what to fix?', 'Empati dulu, lalu cari fakta sebelum solusi.', 'Empathy first, then facts before solutions.'),
        O('Ya kamu sih briefnya kurang jelas.', 'Well your brief was unclear.', 'Menyalahkan klien; memperburuk.', 'Blames the client; makes it worse.'),
        O('Aku ganti semua deh pokoknya.', 'I will just redo everything.', 'Reaktif tanpa memahami masalah.', 'Reactive without understanding the issue.'),
      ],
    },
    {
      client: { id: 'Datanya ya... reach turun, padahal produk lagi mau dijual.', en: 'The data... reach dropped, even though we are trying to sell.' },
      correct: 2,
      options: [
        O('Berarti produknya yang kurang menarik.', 'Then the product is just not appealing.', 'Menyalahkan; tidak membantu.', 'Blaming; unhelpful.'),
        O('Sabar ya, nanti juga naik sendiri.', 'Be patient, it will rise on its own.', 'Pasif; klien butuh rencana.', 'Passive; the client needs a plan.'),
        O('Aku dengar, jualan lagi jadi prioritas. Aku usul 3 caption baru dengan hook & ajakan beli yang jelas.', 'I hear you, selling is the priority. I propose 3 new captions with stronger hooks and clear CTAs.', 'Tunjukkan paham tujuan + rencana perbaikan konkret.', 'Shows you grasp the goal plus a concrete fix.'),
        O('Ya aku coba-coba aja deh.', 'I will just experiment.', 'Tanpa arah; tak meyakinkan.', 'No direction; not reassuring.'),
      ],
    },
    {
      client: { id: 'Oke, coba deh. Tapi aku mau lihat bedanya kali ini.', en: 'Ok, try it. But I want to see a difference this time.' },
      correct: 0,
      options: [
        O('Setuju. Kita ukur reach & klik 1 minggu, lalu aku laporkan apa yang berhasil.', 'Agreed. We will track reach and clicks for a week, then I report what worked.', 'Janji terukur & transparan, bukan klaim kosong.', 'A measurable, transparent promise, not empty claims.'),
        O('Pasti naik drastis kok.', 'It will definitely spike.', 'Klaim hasil yang tak bisa dijamin.', 'Claims results you cannot guarantee.'),
        O('Kalau gagal ya bukan salahku.', 'If it fails it is not my fault.', 'Defensif & menanam keraguan.', 'Defensive and plants doubt.'),
        O('Aku gak janji apa-apa ya.', 'I promise nothing.', 'Terlalu pasif; klien butuh keyakinan.', 'Too passive; the client needs confidence.'),
      ],
    },
  ],
  'urgent-afterhours': [
    {
      client: { id: '(Jam 9 malam) Butuh ini SEKARANG, besok pagi harus jadi!', en: '(9pm) I need this NOW, must be ready by morning!' },
      correct: 2,
      options: [
        O('Oke aku begadang kerjain semuanya!', 'Ok I will pull an all-nighter on everything!', 'Overpromise; membakar diri & menjanjikan terlalu banyak.', 'Overpromising; burns you out.'),
        O('Ini di luar jam kerja, besok aja ya.', 'This is after hours, tomorrow then.', 'Benar soal batas tapi mengabaikan kepanikannya.', 'Right on boundary but ignores the panic.'),
        O('Aku bantu. Biar pas: bagian mana yang paling kritis buat besok pagi?', 'I will help. To focus: which part is most critical for the morning?', 'Tenang, set batas, lalu cari inti yang benar-benar perlu.', 'Calm, sets a boundary, finds what truly must ship.'),
        O('Kenapa gak dari tadi sih?', 'Why not earlier?', 'Menyalahkan saat klien panik.', 'Blaming while the client panics.'),
      ],
    },
    {
      client: { id: 'Yang penting slide pembuka buat meeting jam 9 pagi. Sisanya bisa nanti.', en: 'Mainly the opening slides for the 9am meeting. The rest can wait.' },
      correct: 0,
      options: [
        O('Oke, malam ini aku selesaikan slide pembuka, sisanya kukerjakan besok siang.', 'Ok, tonight I finish the opening slides, the rest tomorrow midday.', 'Fokus ke yang kritis + rencana realistis.', 'Focuses the critical part with a realistic plan.'),
        O('Semuanya kuselesaikan malam ini kok.', 'I will finish all of it tonight.', 'Kembali overpromise padahal tak perlu.', 'Overpromising again when unnecessary.'),
        O('Slide gampang lah, santai.', 'Slides are easy, relax.', 'Meremehkan; bisa salah.', 'Dismissive; may backfire.'),
        O('Coba minta orang lain aja.', 'Maybe ask someone else.', 'Melempar tanggung jawab.', 'Dodges responsibility.'),
      ],
    },
    {
      client: { id: 'Oke makasih banyak, kamu penyelamat.', en: 'Ok thank you so much, you are a lifesaver.' },
      correct: 3,
      options: [
        O('Iya makanya, untung ada aku.', 'Yeah, lucky you have me.', 'Sombong; merusak nada.', 'Arrogant; sours the tone.'),
        O('Lain kali bayar lebih ya buat lembur.', 'Next time pay more for overtime.', 'Menagih di momen yang salah.', 'Billing at the wrong moment.'),
        O('Ya gitu deh.', 'Eh, whatever.', 'Datar; menyia-nyiakan momen baik.', 'Flat; wastes the goodwill.'),
        O('Sama-sama. Slide kukirim sebelum jam 8 pagi, dan kita atur jam kerja darurat ke depannya ya.', 'You are welcome. Slides before 8am, and let us agree on emergency hours going forward.', 'Hangat + tetapkan ekspektasi agar tak terulang.', 'Warm plus sets expectations to prevent repeats.'),
      ],
    },
  ],
  'content-plan': [
    {
      client: { id: 'Buatin rencana konten Instagram sebulan dong.', en: 'Make me a one-month Instagram content plan.' },
      correct: 1,
      options: [
        O('Oke, isinya jualan terus tiap hari ya.', 'Ok, daily sales posts the whole month.', 'Jualan terus bikin audiens jenuh.', 'Nonstop selling tires the audience.'),
        O('Siap. Tujuan utamanya apa, dan siapa pembeli idealmu, biar kontennya tepat?', 'Sure. What is the main goal and who is your ideal buyer, so the content fits?', 'Klarifikasi tujuan & audiens sebelum menyusun.', 'Clarifies goal and audience before planning.'),
        O('Aku contek punya kompetitor aja.', 'I will just copy a competitor.', 'Meniru mentah tak membangun brand.', 'Blind copying builds no brand.'),
        O('Terserah aku ya temanya.', 'I will pick whatever theme.', 'Mengabaikan tujuan bisnis klien.', 'Ignores the client business goal.'),
      ],
    },
    {
      client: { id: 'Mau lebih banyak pesanan kue. Pembelinya ibu-ibu yang suka lihat proses bikin.', en: 'I want more cake orders. Buyers are moms who enjoy seeing the baking process.' },
      correct: 3,
      options: [
        O('Berarti foto produk doang tiap hari.', 'So just product photos every day.', 'Monoton; tak sesuai minat audiens.', 'Monotonous; ignores audience interest.'),
        O('Pakai tren joget biar viral.', 'Use dance trends to go viral.', 'Tak relevan dengan tujuan jualan.', 'Irrelevant to the sales goal.'),
        O('Aku gak janji nambah pesanan ya.', 'I do not promise more orders.', 'Terlalu pasif di tahap perencanaan.', 'Too passive at the planning stage.'),
        O('Pas. Aku susun campuran: proses bikin, testimoni, tips, dan ajakan pesan, 4-5 post/minggu.', 'Great. I will mix behind-the-scenes, testimonials, tips, and order CTAs, 4-5 posts/week.', 'Bauran konten sesuai minat + tujuan jualan.', 'A content mix matched to interest and the sales goal.'),
      ],
    },
    {
      client: { id: 'Oke aku suka idenya. Lanjut!', en: 'Ok I like the idea. Go ahead!' },
      correct: 0,
      options: [
        O('Aku kirim kalender konten minggu 1 besok buat kamu approve dulu.', 'I will send week 1 of the calendar tomorrow for your approval first.', 'Langkah konkret + minta approval bertahap.', 'A concrete step with staged approval.'),
        O('Langsung kupost semua tanpa cek kamu.', 'I will post everything without checking with you.', 'Berisiko meleset tanpa persetujuan.', 'Risky without sign-off.'),
        O('Nanti deh kalau sempat.', 'Later if I have time.', 'Menghilangkan momentum.', 'Kills momentum.'),
        O('Dijamin laris keras ya.', 'Guaranteed to sell like crazy.', 'Klaim hasil berlebihan.', 'Overpromising results.'),
      ],
    },
  ],
  'out-of-skill': [
    {
      client: { id: 'Aku butuh editing video kompleks dengan animasi 3D. Bayarannya gede.', en: 'I need complex video editing with 3D animation. Pays well.' },
      correct: 2,
      options: [
        O('Bisa kok, gampang itu! (padahal belum pernah)', 'Sure, easy! (though never done it)', 'Mengarang kompetensi; berisiko gagal & rusak nama.', 'Faking skill; risks failure and reputation.'),
        O('Gak bisa, cari orang lain aja.', 'Cannot, find someone else.', 'Benar jujur tapi menutup tanpa solusi.', 'Honest but closes with no help.'),
        O('Jujur, animasi 3D di luar keahlianku. Tapi aku bisa bantu naskah & koordinasi editor 3D terpercaya.', 'Honestly, 3D animation is outside my skill. But I can handle the script and coordinate a trusted 3D editor.', 'Jujur soal batas + tawarkan jalan keluar.', 'Honest about limits plus offers a path forward.'),
        O('Ya coba-coba dulu deh nanti.', 'I will just wing it later.', 'Tak profesional untuk kerja bernilai tinggi.', 'Unprofessional for high-value work.'),
      ],
    },
    {
      client: { id: 'Oh gitu. Kupikir kamu bisa semua. Editor itu nambah biaya dong?', en: 'Oh. I thought you did everything. That editor adds cost, right?' },
      correct: 0,
      options: [
        O('Iya ada biaya editor, tapi kujelaskan di muka & kucarikan yang sesuai budget. Kualitas lebih terjamin.', 'Yes, there is an editor fee, but I will lay it out upfront and find one in budget. Quality is safer.', 'Transparan soal biaya + jaga kualitas hasil.', 'Transparent on cost while protecting quality.'),
        O('Ya pokoknya mahal, terima aja.', 'It is just expensive, deal with it.', 'Kasar dan tak menjelaskan nilai.', 'Rude and explains no value.'),
        O('Yaudah aku paksain sendiri deh gratis.', 'Fine I will force it myself for free.', 'Kembali mengarang kompetensi.', 'Back to faking competence.'),
        O('Gak usah video deh kalau gitu.', 'Forget the video then.', 'Membuang peluang tanpa usaha.', 'Throws away the opportunity.'),
      ],
    },
    {
      client: { id: 'Oke, aku hargai kejujurannya. Bantu koordinasi ya, dan kerjaan lain tetap kamu.', en: 'Ok, I appreciate the honesty. Help coordinate, and keep the other work too.' },
      correct: 1,
      options: [
        O('Tuh kan, harusnya percaya aku.', 'See, you should trust me.', 'Menyombong; tak perlu.', 'Boastful; unnecessary.'),
        O('Siap, aku pegang naskah & koordinasi editor, dan lanjut tugas rutinmu seperti biasa.', 'Got it, I will own the script and editor coordination, and continue your routine tasks as usual.', 'Tegaskan peran jelas; kejujuran berbuah kerja.', 'Confirms a clear role; honesty earned the work.'),
        O('Bayar dulu semua di muka ya.', 'Pay everything upfront first.', 'Menekan setelah momen baik.', 'Pushy after a good moment.'),
        O('Yaudah aku coba 3D-nya sendiri deh.', 'Actually let me try the 3D myself.', 'Mengingkari kejujuran yang baru dipuji.', 'Undoes the honesty just praised.'),
      ],
    },
  ],
  'retainer-close': [
    {
      client: { id: 'Coba yakinkan aku kenapa harus pakai kamu jangka panjang.', en: 'Convince me why I should retain you long-term.' },
      correct: 3,
      options: [
        O('Karena aku paling murah.', 'Because I am the cheapest.', 'Bersaing di harga merendahkan nilai.', 'Competing on price lowers your value.'),
        O('Karena aku bisa kerja 24 jam.', 'Because I can work 24 hours.', 'Janji tak sehat & tak realistis.', 'An unhealthy, unrealistic promise.'),
        O('Ya pokoknya percaya aja deh.', 'Just trust me.', 'Tanpa bukti; tak meyakinkan.', 'No evidence; unconvincing.'),
        O('Karena aku jaga operasionalmu jalan tiap minggu, proaktif, dan kamu hemat waktu untuk fokus tumbuh.', 'Because I keep your operations running weekly, proactively, so you save time to focus on growth.', 'Bingkai nilai & hasil, bukan sekadar jam kerja.', 'Frames value and outcomes, not just hours.'),
      ],
    },
    {
      client: { id: 'Menarik. Tapi gimana aku tahu kamu konsisten tiap bulan?', en: 'Interesting. But how do I know you are consistent each month?' },
      correct: 1,
      options: [
        O('Ya percaya aja pokoknya.', 'Just trust me, period.', 'Mengabaikan kebutuhan bukti.', 'Ignores the need for proof.'),
        O('Aku kirim laporan bulanan ringkas: yang dikerjakan, hasilnya, dan rencana bulan depan.', 'I send a concise monthly report: what was done, the results, and next month plan.', 'Konsistensi dibuktikan lewat pelaporan jelas.', 'Proves consistency through clear reporting.'),
        O('Kalau gak puas ya udah berhenti aja.', 'If unhappy just quit.', 'Defensif; menanam keraguan.', 'Defensive; plants doubt.'),
        O('Aku gak bisa janji konsisten sih.', 'I cannot promise consistency.', 'Melemahkan kepercayaan diri sendiri.', 'Undermines your own credibility.'),
      ],
    },
    {
      client: { id: 'Oke, aku tertarik coba 3 bulan dulu.', en: 'Ok, I am keen to try 3 months first.' },
      correct: 0,
      options: [
        O('Bagus. Aku kirim proposal retainer 3 bulan dengan lingkup & jadwal laporan hari ini.', 'Great. I will send a 3-month retainer proposal with scope and reporting schedule today.', 'Menutup percaya diri dengan langkah konkret.', 'Closes confidently with a concrete step.'),
        O('Harus setahun, gak bisa 3 bulan.', 'Must be a year, not 3 months.', 'Kaku; menolak komitmen yang ditawarkan.', 'Rigid; rejects the offered commitment.'),
        O('Yaudah nanti aku susulin.', 'Ok I will follow up sometime.', 'Pasif; bisa kehilangan deal.', 'Passive; may lose the deal.'),
        O('Dijamin omzetmu naik 3x.', 'Guaranteed 3x revenue.', 'Klaim hasil yang tak bisa dijamin.', 'Claims results you cannot guarantee.'),
      ],
    },
  ],
  'angry-cancel': [
    {
      client: { id: 'Aku mau berhenti dan minta refund, hasilnya mengecewakan!', en: 'I want to quit and get a refund, the results were disappointing!' },
      correct: 1,
      options: [
        O('Refund gak bisa, sudah ada di kontrak.', 'No refund, it is in the contract.', 'Memicu konflik; klien makin marah.', 'Triggers conflict; the client gets angrier.'),
        O('Maaf kamu kecewa. Boleh aku tahu bagian mana yang paling tidak sesuai harapan?', 'Sorry you are disappointed. Can I understand which parts missed the mark most?', 'Redakan dulu dengan empati & dengar masalahnya.', 'De-escalates with empathy and hears the issue.'),
        O('Itu kan karena kamu sendiri telat kasih bahan.', 'That is because you sent materials late.', 'Menyalahkan saat klien marah.', 'Blaming while the client is angry.'),
        O('Yaudah aku refund semua sekarang.', 'Fine, full refund now.', 'Menyerah tanpa memahami; bisa rugi tak perlu.', 'Caving blindly; may lose unnecessarily.'),
      ],
    },
    {
      client: { id: 'Laporannya telat dua kali dan ada angka yang salah. Aku jadi malu di rapat.', en: 'Reports were late twice and had a wrong figure. I was embarrassed in a meeting.' },
      correct: 0,
      options: [
        O('Itu salahku dan aku minta maaf. Yang telat & angka keliru memang valid, akan kuperbaiki.', 'That was my fault and I apologize. The lateness and wrong figure are valid; I will fix them.', 'Akui kesalahan yang sah dengan jujur.', 'Owns the valid mistakes honestly.'),
        O('Ah cuma sekali kok kayaknya.', 'It was just once I think.', 'Menyangkal fakta; memperburuk.', 'Denies facts; makes it worse.'),
        O('Semua orang juga bisa salah.', 'Everyone makes mistakes.', 'Meremehkan keluhan yang sah.', 'Dismisses a valid complaint.'),
        O('Kalau gitu ya sudah kita stop.', 'Then let us just stop.', 'Menyerah tanpa upaya perbaikan.', 'Gives up without trying to recover.'),
      ],
    },
    {
      client: { id: 'Jujur aku masih ragu mau lanjut atau enggak.', en: 'Honestly I am still unsure whether to continue.' },
      correct: 2,
      options: [
        O('Yaudah terserah kamu.', 'Whatever you decide.', 'Pasif; melepas klien yang masih bisa diselamatkan.', 'Passive; lets a salvageable client go.'),
        O('Pokoknya jangan berhenti ya.', 'Just please do not quit.', 'Memohon tanpa rencana; tak meyakinkan.', 'Begging without a plan; unconvincing.'),
        O('Aku usul: 2 minggu perbaikan dengan laporan tepat waktu & double-check angka, gratis. Lalu kamu putuskan.', 'I propose: a 2-week fix with on-time reports and double-checked figures, free. Then you decide.', 'Tawarkan rencana pemulihan nyata & beri kendali.', 'Offers a real recovery plan and gives them control.'),
        O('Refund-nya sebagian aja ya biar adil.', 'Just a partial refund to be fair.', 'Loncat ke uang sebelum mencoba memperbaiki.', 'Jumps to money before trying to fix.'),
      ],
    },
  ],
  'lead-team': [
    {
      client: { id: 'Atur 2 VA lain buat proyek ini ya, aku mau hasilnya rapi.', en: 'Manage 2 other VAs for this project, I want clean results.' },
      correct: 2,
      options: [
        O('Biar mereka jalan sendiri-sendiri aja.', 'Let each VA just do their own thing.', 'Tanpa koordinasi, hasil tak konsisten.', 'Without coordination, results are inconsistent.'),
        O('Kamu aja yang atur mereka.', 'You manage them yourself.', 'Justru yang ingin klien hindari.', 'Exactly what the client wants to avoid.'),
        O('Siap, aku jadi satu titik tanggung jawab: bagi tugas, tenggat, dan satukan hasil ke kamu.', 'Got it, I will be the single point of accountability: assign tasks, set deadlines, and consolidate to you.', 'Tawarkan kepemilikan jelas yang dia inginkan.', 'Offers the clear ownership he wants.'),
        O('Aku gak bisa mimpin orang sih.', 'I cannot lead people.', 'Menolak peran inti yang ditawarkan.', 'Rejects the core role offered.'),
      ],
    },
    {
      client: { id: 'Bagus. Aku gak mau dibanjiri pertanyaan dari 3 orang ya.', en: 'Good. I do not want to be flooded with questions from 3 people.' },
      correct: 0,
      options: [
        O('Tenang, semua pertanyaan lewat aku dulu; kamu cukup terima ringkasan & keputusan penting.', 'No worries, all questions go through me first; you only get summaries and key decisions.', 'Lindungi waktu klien dengan satu kanal.', 'Protects the client time with one channel.'),
        O('Ya nanti mereka chat kamu langsung aja.', 'They will just message you directly.', 'Persis beban yang dia tolak.', 'Exactly the burden he refused.'),
        O('Aku gak janji bisa nyaring.', 'I cannot promise to filter.', 'Melemahkan peran koordinator.', 'Weakens the coordinator role.'),
        O('Bikin grup rame aja biar cepat.', 'Just make one big noisy group.', 'Menambah kebisingan, bukan mengurangi.', 'Adds noise instead of reducing it.'),
      ],
    },
    {
      client: { id: 'Oke. Kapan aku dapat update progres tim?', en: 'Ok. When do I get team progress updates?' },
      correct: 3,
      options: [
        O('Pas selesai semua aja.', 'Only when everything is done.', 'Terlalu lama tanpa kabar; klien cemas.', 'Too long with no news; the client worries.'),
        O('Tiap jam kukabari.', 'I will update you every hour.', 'Berlebihan; justru membanjiri.', 'Excessive; floods him again.'),
        O('Nanti kalau ada aja.', 'Whenever, if anything.', 'Samar; tak ada kepastian.', 'Vague; no certainty.'),
        O('Tiap Jumat aku kirim ringkasan: progres, hambatan, dan rencana minggu depan.', 'Every Friday I send a summary: progress, blockers, and next week plan.', 'Irama laporan jelas & dapat diandalkan.', 'A clear, reliable reporting cadence.'),
      ],
    },
  ],
  'strategic-discovery': [
    {
      client: { id: 'Aku mau tumbuh tahun ini, bantu aku.', en: 'I want to grow this year, help me.' },
      correct: 2,
      options: [
        O('Oke, langsung kubuatin paket konten standar.', 'Ok, I will pitch a standard content package.', 'Lompat ke eksekusi tanpa tahu tujuan.', 'Jumps to execution without the goal.'),
        O('Siap, nanti aku pikirkan.', 'Sure, I will think about it.', 'Pasif; tak menunjukkan pemikiran strategis.', 'Passive; shows no strategic thinking.'),
        O('Tumbuh dari sisi mana yang paling penting: omzet, pelanggan baru, atau efisiensi waktumu?', 'Growth in which sense matters most: revenue, new customers, or freeing your time?', 'Pertanyaan strategis menggali tujuan sebenarnya.', 'A strategic question uncovers the real objective.'),
        O('Minta budget besar dulu baru kita bahas.', 'Give a big budget first, then we talk.', 'Menaruh uang di atas kebutuhan klien.', 'Puts money ahead of the client need.'),
      ],
    },
    {
      client: { id: 'Omzet sih. Tapi aku juga kewalahan ngurus operasional sendiri.', en: 'Revenue. But I am also overwhelmed running operations alone.' },
      correct: 0,
      options: [
        O('Berarti ada 2 lapis: dorong omzet + lepas operasional dari kamu. Mana yang mau kita beresin dulu?', 'So two layers: drive revenue and take ops off your plate. Which do we tackle first?', 'Memetakan masalah nyata & memberi prioritas.', 'Maps the real problem and sets priorities.'),
        O('Yaudah aku urus semua sekaligus.', 'I will just handle it all at once.', 'Tak fokus; rawan gagal.', 'Unfocused; likely to fail.'),
        O('Operasional bukan urusan VA.', 'Operations is not a VA job.', 'Salah; justru inti peran VA.', 'Wrong; that is core VA work.'),
        O('Omzet naik gampang kok.', 'Revenue growth is easy.', 'Meremehkan; klaim kosong.', 'Dismissive; an empty claim.'),
      ],
    },
    {
      client: { id: 'Lepasin operasional dulu deh, biar aku bisa fokus jualan.', en: 'Take ops off me first, so I can focus on selling.' },
      correct: 1,
      options: [
        O('Oke langsung kukerjakan tanpa rencana.', 'Ok I will start with no plan.', 'Tanpa pemetaan tugas, hasil berantakan.', 'Without mapping tasks, results are messy.'),
        O('Aku usul kita list tugas operasional rutinmu minggu ini, lalu kuambil alih bertahap dengan SOP.', 'I suggest we list your routine ops tasks this week, then I take them over in stages with SOPs.', 'Rencana bertahap & terdokumentasi, profesional.', 'A staged, documented plan; professional.'),
        O('Dijamin kamu bebas total besok.', 'Guaranteed fully free tomorrow.', 'Overpromise yang tak realistis.', 'Unrealistic overpromising.'),
        O('Itu sih kamu aja yang atur.', 'You arrange that yourself.', 'Menolak pekerjaan yang diminta.', 'Refuses the requested work.'),
      ],
    },
  ],
}

export const TOTAL_ROLEPLAY_STEPS = Object.values(ROLEPLAYS).reduce(
  (n, steps) => n + steps.length,
  0,
)

/** Daftar giliran roleplay untuk sebuah skenario (kosong bila tak ada). */
export function roleplaySteps(scenarioId: string): RoleplayStep[] {
  return ROLEPLAYS[scenarioId] ?? []
}

/** Skenario yang punya dialog roleplay, urut sesuai definisi SCENARIOS. */
export const ROLEPLAY_SCENARIO_IDS = SCENARIOS.map((s) => s.id).filter((id) => ROLEPLAYS[id])
