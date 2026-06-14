// src/ai/templates.ts
// Template tugas freelance. Tiap template memberi persona/instruksi sistem
// dan teks awal (starter) yang muncul di kolom input untuk diisi user.

export const BASE_SYSTEM_PROMPT =
  'Kamu Pendar, asisten AI untuk pekerja lepas (freelancer). ' +
  'Tujuanmu membantu menyelesaikan pekerjaan klien: menulis, merapikan, ' +
  'meringkas, dan menyusun komunikasi yang profesional. Tulis dengan jelas, ' +
  'ringkas, sopan, dan siap pakai. Balas dalam bahasa yang dipakai user ' +
  '(Indonesia atau Inggris). Jika informasi penting kurang, beri hasil ' +
  'terbaik lalu sebutkan singkat bagian mana yang sebaiknya user lengkapi.'

export interface Template {
  id: string
  title: string
  desc: string
  /** Ditambahkan setelah BASE_SYSTEM_PROMPT saat template dipilih. */
  system: string
  /** Teks yang dimasukkan ke kolom input agar user tinggal melengkapi. */
  starter: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'proposal',
    title: 'Proposal proyek',
    desc: 'Susun proposal penawaran yang meyakinkan',
    system:
      'Buat proposal proyek yang terstruktur: ringkasan pemahaman kebutuhan, ' +
      'pendekatan/solusi, lingkup pekerjaan, timeline, dan ajakan lanjut. ' +
      'Nada percaya diri namun tidak berlebihan.',
    starter:
      'Buatkan proposal untuk klien.\n\n- Jenis proyek: \n- Klien/bisnis: \n- Kebutuhan utama: \n- Estimasi waktu: \n- Anggaran (opsional): ',
  },
  {
    id: 'reply-client',
    title: 'Balas pesan klien',
    desc: 'Balasan profesional & ramah',
    system:
      'Tulis balasan chat/email ke klien yang profesional, hangat, dan to the ' +
      'point. Pertahankan hubungan baik meski menyampaikan kabar kurang enak.',
    starter:
      'Bantu balas pesan klien berikut secara profesional:\n\n"""\n[tempel pesan klien di sini]\n"""\n\nPoin yang ingin kusampaikan: ',
  },
  {
    id: 'quote',
    title: 'Penawaran harga',
    desc: 'Rincian harga & paket jasa',
    system:
      'Susun penawaran harga yang rapi: rincian item pekerjaan, paket (mis. ' +
      'Basic/Standard/Premium bila relevan), total, dan syarat singkat ' +
      '(revisi, termin pembayaran). Format mudah dibaca.',
    starter:
      'Buatkan penawaran harga.\n\n- Jasa: \n- Lingkup pekerjaan: \n- Kisaran harga / rate: \n- Jumlah revisi: \n- Termin pembayaran: ',
  },
  {
    id: 'brief',
    title: 'Ringkas brief',
    desc: 'Ubah brief jadi poin aksi',
    system:
      'Ringkas brief klien menjadi: tujuan, deliverable, poin penting, ' +
      'pertanyaan yang perlu dikonfirmasi, dan daftar tugas (action items).',
    starter:
      'Ringkas brief klien berikut menjadi poin aksi yang jelas:\n\n"""\n[tempel brief di sini]\n"""',
  },
  {
    id: 'follow-up',
    title: 'Follow-up',
    desc: 'Tindak lanjut tanpa terkesan memaksa',
    system:
      'Tulis pesan follow-up yang sopan dan tidak memaksa untuk menindaklanjuti ' +
      'penawaran, invoice, atau percakapan yang belum dibalas.',
    starter:
      'Buatkan pesan follow-up.\n\n- Konteks: \n- Sudah berapa lama tanpa balasan: \n- Tujuan follow-up: ',
  },
  {
    id: 'social',
    title: 'Caption sosmed',
    desc: 'Konten Instagram/LinkedIn/X',
    system:
      'Buat caption media sosial yang menarik sesuai platform. Sertakan 1 hook ' +
      'pembuka, isi padat, ajakan (CTA), dan beberapa hashtag relevan.',
    starter:
      'Buatkan caption media sosial.\n\n- Platform: \n- Topik/produk: \n- Tujuan (awareness/penjualan/dll): \n- Nada (santai/profesional): ',
  },
  {
    id: 'polish',
    title: 'Perbaiki & terjemah',
    desc: 'Rapikan tata bahasa / terjemah ID↔EN',
    system:
      'Perbaiki ejaan, tata bahasa, dan kejelasan teks tanpa mengubah makna. ' +
      'Bila diminta terjemahan, terjemahkan dengan natural antara Indonesia ' +
      'dan Inggris. Tampilkan hasil akhir saja kecuali diminta menjelaskan.',
    starter:
      'Rapikan / terjemahkan teks berikut:\n\n"""\n[tempel teks di sini]\n"""',
  },
  {
    id: 'gig',
    title: 'Deskripsi jasa',
    desc: 'Gig Fiverr/Upwork yang menjual',
    system:
      'Tulis deskripsi jasa (gig) yang menjual untuk marketplace freelance: ' +
      'judul menarik, manfaat untuk klien, apa yang didapat, alasan memilih ' +
      'kamu, dan CTA. Hindari klaim berlebihan.',
    starter:
      'Buatkan deskripsi jasa untuk marketplace freelance.\n\n- Jenis jasa: \n- Keunggulanku: \n- Yang didapat klien: \n- Platform (Fiverr/Upwork/dll): ',
  },
]
