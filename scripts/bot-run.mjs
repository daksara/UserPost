/**
 * Bot script — dijalankan oleh GitHub Actions setiap 30 menit.
 * Mengambil data token dari DexScreener lalu memposting alert ke feed.
 *
 * Environment variables yang dibutuhkan (GitHub Secrets):
 *   FIREBASE_SERVICE_ACCOUNT  – isi JSON service account Firebase (satu baris)
 *   BOT_UID                   – UID akun userpostbot di Firebase Auth
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ── Init Firebase ──────────────────────────────────────────────────

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
const botUid = process.env.BOT_UID

if (!serviceAccount || !botUid) {
  console.error('FIREBASE_SERVICE_ACCOUNT dan BOT_UID harus diset di GitHub Secrets.')
  process.exit(1)
}

initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
const db = getFirestore()

// ── Config ─────────────────────────────────────────────────────────

const WHALE_THRESHOLD    = parseFloat(process.env.WHALE_THRESHOLD_USD    ?? '10000')
const DEAD_VOL_THRESHOLD = parseFloat(process.env.DEAD_VOLUME_THRESHOLD_USD ?? '100')
const DEAD_HOURS         = parseFloat(process.env.DEAD_HOURS_REQUIRED    ?? '24')
const MIN_LIQUIDITY      = parseFloat(process.env.MIN_LIQUIDITY_USD      ?? '5000')
const ALERT_COOLDOWN_MS  = 4 * 60 * 60 * 1000  // 4 jam

// ── Types (JSDoc) ──────────────────────────────────────────────────

/**
 * @typedef {{ tokenAddress: string, chainId: string }} DexProfile
 * @typedef {{
 *   chainId: string, url: string,
 *   baseToken: { address: string, name: string, symbol: string },
 *   priceUsd?: string,
 *   txns: { h1: { buys: number, sells: number }, h24: { buys: number, sells: number } },
 *   volume: { h24: number, h1: number },
 *   priceChange: { h1: number, h24: number },
 *   liquidity?: { usd: number }
 * }} DexPair
 */

// ── Helpers ────────────────────────────────────────────────────────

function fmt$(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

async function dexGet(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.warn(`dexGet(${url}) error:`, e.message)
    return null
  }
}

// ── Auto-discovery token dari DexScreener ─────────────────────────

async function discoverTokens() {
  const seen = new Map()

  // Sumber 1: Token yang baru aktif / diberi profil di DexScreener
  const profiles = await dexGet('https://api.dexscreener.com/token-profiles/latest/v1')
  if (Array.isArray(profiles)) {
    for (const p of profiles.slice(0, 25)) {
      if (p?.tokenAddress) seen.set(p.tokenAddress.toLowerCase(), p.chainId)
    }
  }

  // Sumber 2: Token yang sedang di-boost (trending di DexScreener)
  const boosts = await dexGet('https://api.dexscreener.com/token-boosts/top/v1')
  if (Array.isArray(boosts)) {
    for (const b of boosts.slice(0, 15)) {
      if (b?.tokenAddress) seen.set(b.tokenAddress.toLowerCase(), b.chainId)
    }
  }

  return [...seen.keys()]
}

async function getTrackedDeadAddresses() {
  const snap = await db
    .collection('bot_state')
    .where('firstDeadAt', '!=', null)
    .limit(20)
    .get()
  return snap.docs.map(d => d.id)
}

// ── Ambil pair terbaik untuk satu token ───────────────────────────

async function fetchBestPair(address) {
  const data = await dexGet(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
  if (!data?.pairs?.length) return null
  return data.pairs.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
  )
}

// ── Post ke feed sebagai bot ───────────────────────────────────────

async function postAsBot(body, contractAddress, linkUrl) {
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  await db.collection('posts').add({
    user_id: botUid,
    body,
    contract_address: contractAddress ?? null,
    link_url: linkUrl ?? null,
    expires_at: expiresAt,
    created_at: Timestamp.now(),
    like_count: 0,
    comment_count: 0,
  })
  console.log('Posted:', body.split('\n')[0])
}

// ── Proses satu token ─────────────────────────────────────────────

async function processToken(address) {
  const pair = await fetchBestPair(address)
  if (!pair) return
  if ((pair.liquidity?.usd ?? 0) < MIN_LIQUIDITY) return

  const stateRef = db.collection('bot_state').doc(address.toLowerCase())
  const stateSnap = await stateRef.get()
  const prev = stateSnap.exists ? stateSnap.data() : null

  const now = Timestamp.now()
  const sym          = pair.baseToken.symbol
  const name         = pair.baseToken.name
  const priceUsd     = parseFloat(pair.priceUsd ?? '0')
  const volume24h    = pair.volume?.h24   ?? 0
  const volume1h     = pair.volume?.h1    ?? 0
  const change24h    = pair.priceChange?.h24 ?? 0
  const change1h     = pair.priceChange?.h1  ?? 0
  const buys24h      = pair.txns?.h24?.buys  ?? 0
  const sells24h     = pair.txns?.h24?.sells ?? 0

  const isDead       = volume24h < DEAD_VOL_THRESHOLD
  const firstDeadAt  = isDead ? (prev?.firstDeadAt ?? now) : null

  const canAlert = !prev?.lastAlertAt ||
    (now.toMillis() - prev.lastAlertAt.toMillis()) > ALERT_COOLDOWN_MS

  let alertType = null

  if (canAlert) {
    const deadMs    = prev?.firstDeadAt ? now.toMillis() - prev.firstDeadAt.toMillis() : 0
    const deadHours = deadMs / (1000 * 60 * 60)

    // 1. DEAD TOKEN BUYER
    if (prev?.firstDeadAt && deadHours >= DEAD_HOURS && volume1h > DEAD_VOL_THRESHOLD * 5) {
      const deadDays = Math.floor(deadHours / 24)
      const label    = deadDays >= 1 ? `${deadDays} hari` : `${Math.floor(deadHours)} jam`
      await postAsBot(
        `[DEAD TOKEN BUYER]\n$${sym} — ${name}\nVolume (1j): ${fmt$(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${fmtPct(change1h)})\nToken tidak aktif selama ${label}, sinyal beli pertama terdeteksi.`,
        pair.baseToken.address,
        pair.url,
      )
      alertType = 'dead_token'
    }

    // 2. WHALE ALERT
    else if (volume1h >= WHALE_THRESHOLD && change1h >= 2) {
      await postAsBot(
        `[WHALE ALERT]\n$${sym} — ${name}\nVolume (1j): ${fmt$(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${fmtPct(change1h)})\nBeli/Jual (24j): ${buys24h} / ${sells24h}`,
        pair.baseToken.address,
        pair.url,
      )
      alertType = 'whale'
    }

    // 3. ACCUMULATION SIGNAL
    else if (
      prev &&
      Math.abs(change24h) < 3 &&
      volume24h > (prev.volume24h ?? 0) * 1.5 &&
      buys24h > (prev.buys24h ?? 0) * 1.3 &&
      volume24h > 1000
    ) {
      const growth = prev.volume24h > 0
        ? `+${(((volume24h / prev.volume24h) - 1) * 100).toFixed(0)}%`
        : 'naik'
      await postAsBot(
        `[ACCUMULATION SIGNAL]\n$${sym} — ${name}\nHarga (24j): ${fmtPct(change24h)}  |  Volume (24j): ${fmt$(volume24h)} (${growth})\nHarga sideways, jumlah beli meningkat — kemungkinan akumulasi.`,
        pair.baseToken.address,
        pair.url,
      )
      alertType = 'accumulation'
    }
  }

  await stateRef.set({
    symbol: sym, name, chain: pair.chainId, pairUrl: pair.url,
    priceUsd, volume24h, volume1h,
    priceChange24h: change24h, priceChange1h: change1h,
    buys24h, sells24h,
    lastChecked: now,
    firstDeadAt,
    ...(alertType ? { lastAlertAt: now, lastAlertType: alertType } : {}),
  }, { merge: true })
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('Bot started:', new Date().toISOString())

  const [discovered, deadAddresses] = await Promise.all([
    discoverTokens(),
    getTrackedDeadAddresses(),
  ])

  const all = new Set([...discovered, ...deadAddresses])
  console.log(`Memproses ${all.size} token (${discovered.length} discovery + ${deadAddresses.length} dead tracked)`)

  const results = await Promise.allSettled(
    [...all].map(addr => processToken(addr))
  )

  const ok     = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  console.log(`Selesai: ${ok} OK, ${failed} gagal`)

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
