// src/ai/clean.ts
// Pembersih ringan untuk jawaban AI: buang sisa markdown/hiasan dan emoji
// agar teks bersih dan siap salin-tempel. Tetap pertahankan isi.
export function cleanText(input: string): string {
  return input
    // Bold/italic markdown: **x**, __x__, *x*, _x_  → x
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[\s(])\*(?!\s)([^*\n]+?)\*/g, '$1$2')
    // Backtick kode: `x` / ```x``` → x
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    // Heading markdown di awal baris: ## Judul → Judul
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    // Bullet "*" atau "•" di awal baris → "- "
    .replace(/^(\s*)[*•]\s+/gm, '$1- ')
    // Emoji / piktograf
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Rapikan spasi sisa di akhir baris
    .replace(/[ \t]+$/gm, '')
}
