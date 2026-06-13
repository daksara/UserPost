// src/lib/airdropParser.ts
//
// Mengubah teks mentah airdrop (yang biasa di-copy dari grup Telegram) menjadi
// data terstruktur: nama, reward, link daftar, dan daftar tugas.
//
// Contoh input:
//   New Airdrops : Worm WTF
//   🏷 Reward : $200,000
//   🪂 Register : https://t.me/wormcupbot?startapp=NWDRYEH
//   ➖️ Complete Task
//   ➖️ Predict Score
//   ➖ Earn Points
//
// Parser ini sengaja "longgar" (best-effort) — hasilnya tetap bisa diedit user
// sebelum disimpan, jadi tak perlu sempurna untuk semua format.

export interface ParsedAirdrop {
  name: string
  reward: string
  registerUrl: string
  tasks: string[]
}

// URL http(s) atau link t.me (kadang ditulis tanpa http).
const URL_RE = /(https?:\/\/[^\s]+|(?:https?:\/\/)?t\.me\/[^\s]+)/i

// Buang semua simbol/emoji/spasi/bullet di awal baris, sisakan teks bermakna.
function stripLead(line: string): string {
  return line.replace(/^[^\p{L}\p{N}]+/u, '').trim()
}

export function parseAirdrop(raw: string): ParsedAirdrop {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  let name = ''
  let reward = ''
  let registerUrl = ''
  const tasks: string[] = []

  for (const line of lines) {
    const text = stripLead(line)
    const lower = text.toLowerCase()

    // Baris nama: "New Airdrops : X" atau "Airdrop: X"
    if (!name && /^(new\s+)?airdrops?\b/i.test(lower)) {
      name = text.replace(/^(new\s+)?airdrops?\s*:?\s*/i, '').trim()
      continue
    }
    // Baris reward (hindari "register" yang juga mengandung "re").
    if (!reward && lower.includes('reward')) {
      reward = text.replace(/^.*?reward\s*:?\s*/i, '').trim()
      continue
    }
    // Baris berisi link daftar — ambil URL pertama yang ditemukan.
    const urlMatch = line.match(URL_RE)
    if (!registerUrl && urlMatch) {
      registerUrl = urlMatch[0]
      continue
    }
    // Sisanya dianggap tugas — kecuali kalau nama belum terdeteksi sama sekali,
    // maka baris polos pertama dipakai sebagai nama (post tanpa label "Airdrop").
    if (text) {
      if (!name) name = text
      else tasks.push(text)
    }
  }

  return { name, reward, registerUrl, tasks }
}
