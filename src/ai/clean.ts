// src/ai/clean.ts
// Normalisasi ringan & aman-markdown untuk jawaban AI sebelum dirender. Tidak
// lagi membuang penanda markdown atau emoji (renderer markdown menanganinya),
// dan tidak menyentuh indentasi awal baris agar blok kode & daftar tetap utuh.
// Hanya merapikan karakter "tak terlihat" (tanda hubung/spasi khusus), spasi
// nyasar di akhir baris, dan baris kosong berlebih.
export function cleanText(input: string): string {
  return input
    // Normalkan akhir baris
    .replace(/\r\n?/g, '\n')
    // Tanda hubung khusus (hyphen, non-breaking hyphen, figure dash) -> "-"
    .replace(/[\u2010\u2011\u2012]/g, '-')
    // Spasi khusus (non-breaking, figure, thin, narrow no-break) -> spasi biasa
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ')
    // Buang spasi/tab nyasar di akhir tiap baris (indentasi awal dipertahankan)
    .replace(/[ \t]+$/gm, '')
    // Maksimal satu baris kosong berturut-turut
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
