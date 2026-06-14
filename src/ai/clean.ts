// src/ai/clean.ts
// Pembersih ringan untuk jawaban AI: buang sisa markdown/hiasan & emoji, lalu
// normalkan karakter "tak terlihat" (tanda hubung/spasi khusus) agar teks
// benar-benar bersih dan siap salin-tempel. Isi tetap dipertahankan.
export function cleanText(input: string): string {
  return input
    // Bold/italic markdown: **x**, __x__, *x*, _x_  -> x
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*/g, '$1$2')
    // Backtick kode: `x` / ```x``` -> x
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    // Heading markdown di awal baris: ## Judul -> Judul
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Bullet "*" atau bullet-dot di awal baris -> "- "
    .replace(/^\s*[*\u2022]\s+/gm, '- ')
    // Emoji / piktograf
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Tanda hubung khusus (hyphen, non-breaking hyphen, figure dash) -> "-"
    .replace(/[\u2010\u2011\u2012]/g, '-')
    // Spasi khusus (non-breaking, figure, thin, narrow no-break) -> spasi biasa
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ')
    // Buang spasi/tab nyasar di awal & akhir tiap baris
    .replace(/^[ \t]+/gm, '')
    .replace(/[ \t]+$/gm, '')
    // Maksimal satu baris kosong berturut-turut
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
