import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineString } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

const BOT_UID = defineString('BOT_UID')
const WHALE_THRESHOLD_USD = defineString('WHALE_THRESHOLD_USD', { default: '10000' })
const DEAD_VOLUME_THRESHOLD_USD = defineString('DEAD_VOLUME_THRESHOLD_USD', { default: '100' })
const DEAD_HOURS_REQUIRED = defineString('DEAD_HOURS_REQUIRED', { default: '24' })
const MIN_LIQUIDITY_USD = defineString('MIN_LIQUIDITY_USD', { default: '5000' })

// ── Types ──────────────────────────────────────────────────────────

interface BotState {
  symbol: string
  name: string
  chain: string
  pairUrl: string
  priceUsd: number
  volume24h: number
  volume1h: number
  priceChange24h: number
  priceChange1h: number
  buys24h: number
  sells24h: number
  buys1h: number
  lastChecked: Timestamp
  firstDeadAt?: Timestamp | null
  lastAlertAt?: Timestamp
  lastAlertType?: string
}

interface DexPair {
  chainId: string
  url: string
  baseToken: { address: string; name: string; symbol: string }
  priceUsd?: string
  txns: {
    h1: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: { h24: number; h1: number }
  priceChange: { h1: number; h24: number }
  liquidity?: { usd: number }
}

// ── Helpers ────────────────────────────────────────────────────────

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function formatChange(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

async function dexGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return await res.json() as T
  } catch (err) {
    console.error(`dexGet(${url}) error:`, err)
    return null
  }
}

// ── Auto-discovery dari DexScreener (tanpa watchlist manual) ───────

interface DexProfile {
  tokenAddress: string
  chainId: string
}

async function discoverTokens(): Promise<{ address: string; chainId: string }[]> {
  const seen = new Map<string, string>() // address → chainId

  // Sumber 1: Token yang baru-baru ini aktif / diberi profil di DexScreener
  const profiles = await dexGet<DexProfile[]>(
    'https://api.dexscreener.com/token-profiles/latest/v1'
  )
  if (Array.isArray(profiles)) {
    for (const p of profiles.slice(0, 25)) {
      if (p.tokenAddress) seen.set(p.tokenAddress.toLowerCase(), p.chainId)
    }
  }

  // Sumber 2: Token yang sedang di-boost (populer di DexScreener)
  const boosts = await dexGet<DexProfile[]>(
    'https://api.dexscreener.com/token-boosts/top/v1'
  )
  if (Array.isArray(boosts)) {
    for (const b of boosts.slice(0, 15)) {
      if (b.tokenAddress) seen.set(b.tokenAddress.toLowerCase(), b.chainId)
    }
  }

  return [...seen.entries()].map(([address, chainId]) => ({ address, chainId }))
}

// Ambil token yang pernah kita catat sebagai "mati" dari bot_state —
// ini untuk mendeteksi dead token revival setelah bot sudah berjalan beberapa saat
async function getTrackedDeadTokens(): Promise<string[]> {
  const snap = await db
    .collection('bot_state')
    .where('firstDeadAt', '!=', null)
    .limit(20)
    .get()
  return snap.docs.map(d => d.id)
}

// Fetch pair terbaik (likuiditas tertinggi) untuk satu token address
async function fetchBestPair(address: string): Promise<DexPair | null> {
  const data = await dexGet<{ pairs?: DexPair[] }>(
    `https://api.dexscreener.com/latest/dex/tokens/${address}`
  )
  if (!data?.pairs?.length) return null
  return data.pairs.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
  )
}

// ── Kirim post sebagai bot ─────────────────────────────────────────

async function postAsBot(
  botUid: string,
  body: string,
  contractAddress?: string,
  linkUrl?: string,
): Promise<void> {
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
}

// ── Proses satu token: cek kondisi, posting alert kalau perlu ──────

async function processToken(
  address: string,
  botUid: string,
  config: {
    whaleThreshold: number
    deadVolumeThreshold: number
    deadHoursRequired: number
    minLiquidity: number
  },
): Promise<void> {
  const pair = await fetchBestPair(address)
  if (!pair) return

  // Filter token tanpa cukup likuiditas — hindari scam/honeypot
  if ((pair.liquidity?.usd ?? 0) < config.minLiquidity) return

  const stateRef = db.collection('bot_state').doc(address.toLowerCase())
  const stateSnap = await stateRef.get()
  const prev = stateSnap.exists ? (stateSnap.data() as BotState) : null

  const now = Timestamp.now()
  const sym = pair.baseToken.symbol
  const name = pair.baseToken.name
  const priceUsd = parseFloat(pair.priceUsd ?? '0')
  const volume24h = pair.volume?.h24 ?? 0
  const volume1h = pair.volume?.h1 ?? 0
  const priceChange24h = pair.priceChange?.h24 ?? 0
  const priceChange1h = pair.priceChange?.h1 ?? 0
  const buys24h = pair.txns?.h24?.buys ?? 0
  const sells24h = pair.txns?.h24?.sells ?? 0
  const buys1h = pair.txns?.h1?.buys ?? 0

  // Lacak kapan token pertama kali "mati"
  const isDead = volume24h < config.deadVolumeThreshold
  const firstDeadAt = isDead ? (prev?.firstDeadAt ?? now) : null

  // Cooldown 4 jam per token agar tidak spam
  const alertCooldownMs = 4 * 60 * 60 * 1000
  const canAlert =
    !prev?.lastAlertAt ||
    now.toMillis() - prev.lastAlertAt.toMillis() > alertCooldownMs

  let alertType: string | null = null

  if (canAlert) {
    const deadMs = prev?.firstDeadAt
      ? now.toMillis() - (prev.firstDeadAt as Timestamp).toMillis()
      : 0
    const deadHours = deadMs / (1000 * 60 * 60)

    // 1. DEAD TOKEN BUYER — token lama tidak aktif, tiba-tiba ada yang beli
    if (prev?.firstDeadAt && deadHours >= config.deadHoursRequired && volume1h > config.deadVolumeThreshold * 5) {
      const deadDays = Math.floor(deadHours / 24)
      const deadLabel = deadDays >= 1 ? `${deadDays} hari` : `${Math.floor(deadHours)} jam`
      const body = [
        '[DEAD TOKEN BUYER]',
        `$${sym} — ${name}`,
        `Volume (1j): ${formatUsd(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${formatChange(priceChange1h)})`,
        `Token tidak aktif selama ${deadLabel}, sinyal beli pertama terdeteksi.`,
      ].join('\n')
      await postAsBot(botUid, body, pair.baseToken.address, pair.url)
      alertType = 'dead_token'
    }

    // 2. WHALE ALERT — volume 1 jam besar + harga naik signifikan
    else if (volume1h >= config.whaleThreshold && priceChange1h >= 2) {
      const body = [
        '[WHALE ALERT]',
        `$${sym} — ${name}`,
        `Volume (1j): ${formatUsd(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${formatChange(priceChange1h)})`,
        `Beli/Jual (24j): ${buys24h} / ${sells24h}`,
      ].join('\n')
      await postAsBot(botUid, body, pair.baseToken.address, pair.url)
      alertType = 'whale'
    }

    // 3. ACCUMULATION SIGNAL — harga flat, volume & jumlah beli naik
    else if (
      prev &&
      Math.abs(priceChange24h) < 3 &&
      volume24h > (prev.volume24h ?? 0) * 1.5 &&
      buys24h > (prev.buys24h ?? 0) * 1.3 &&
      volume24h > 1000
    ) {
      const volGrowth =
        prev.volume24h > 0
          ? `+${(((volume24h / prev.volume24h) - 1) * 100).toFixed(0)}%`
          : 'naik'
      const body = [
        '[ACCUMULATION SIGNAL]',
        `$${sym} — ${name}`,
        `Harga (24j): ${formatChange(priceChange24h)}  |  Volume (24j): ${formatUsd(volume24h)} (${volGrowth})`,
        `Harga sideways, jumlah beli meningkat — kemungkinan akumulasi.`,
      ].join('\n')
      await postAsBot(botUid, body, pair.baseToken.address, pair.url)
      alertType = 'accumulation'
    }
  }

  // Simpan state terbaru ke Firestore
  const newState: Partial<BotState> = {
    symbol: sym,
    name,
    chain: pair.chainId,
    pairUrl: pair.url,
    priceUsd,
    volume24h,
    volume1h,
    priceChange24h,
    priceChange1h,
    buys24h,
    sells24h,
    buys1h,
    lastChecked: now,
    firstDeadAt,
    ...(alertType ? { lastAlertAt: now, lastAlertType: alertType } : {}),
  }
  await stateRef.set(newState, { merge: true })
}

// ── Scheduled function — setiap 5 menit ───────────────────────────

export const pollMarketAlerts = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeoutSeconds: 240,
    memory: '512MiB',
  },
  async () => {
    const botUid = BOT_UID.value()
    if (!botUid) {
      console.error('BOT_UID belum diset. Jalankan: firebase functions:secrets:set BOT_UID')
      return
    }

    const config = {
      whaleThreshold: parseFloat(WHALE_THRESHOLD_USD.value()),
      deadVolumeThreshold: parseFloat(DEAD_VOLUME_THRESHOLD_USD.value()),
      deadHoursRequired: parseFloat(DEAD_HOURS_REQUIRED.value()),
      minLiquidity: parseFloat(MIN_LIQUIDITY_USD.value()),
    }

    // Kumpulkan token dari 2 sumber:
    // 1. Auto-discovery dari DexScreener (token baru / boosted)
    // 2. Token yang sudah kita catat sebagai "mati" sebelumnya
    const [discovered, deadTokenAddresses] = await Promise.all([
      discoverTokens(),
      getTrackedDeadTokens(),
    ])

    // Gabungkan, hindari duplikat
    const allAddresses = new Set<string>(discovered.map(t => t.address))
    for (const addr of deadTokenAddresses) allAddresses.add(addr)

    console.log(`Memproses ${allAddresses.size} token (${discovered.length} discovery + ${deadTokenAddresses.length} tracked dead)`)

    // Proses semua token secara paralel
    const results = await Promise.allSettled(
      [...allAddresses].map(addr => processToken(addr, botUid, config))
    )

    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) console.warn(`${failed} token gagal diproses`)
    console.log(`Selesai. ${results.length - failed}/${results.length} token berhasil.`)
  }
)
