import { onSchedule } from 'firebase-functions/v2/scheduler'
import { defineString } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

// Konfigurasi via: firebase functions:config:set (atau .env di Functions v2)
const BOT_UID = defineString('BOT_UID')
const WHALE_THRESHOLD_USD = defineString('WHALE_THRESHOLD_USD', { default: '10000' })
const DEAD_VOLUME_THRESHOLD_USD = defineString('DEAD_VOLUME_THRESHOLD_USD', { default: '100' })
const DEAD_HOURS_REQUIRED = defineString('DEAD_HOURS_REQUIRED', { default: '24' })

// ── Types ──────────────────────────────────────────────────────────

interface WatchlistToken {
  address: string
  chain: string
  symbol?: string
  name?: string
}

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
  firstDeadAt?: Timestamp
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

async function fetchBestPair(address: string): Promise<DexPair | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json() as { pairs?: DexPair[] }
    if (!data.pairs?.length) return null
    // Ambil pair dengan likuiditas tertinggi
    return data.pairs.reduce((best, p) =>
      (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
    )
  } catch (err) {
    console.error(`fetchBestPair(${address}) error:`, err)
    return null
  }
}

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

// ── Alert deteksi per token ────────────────────────────────────────

async function processToken(
  token: WatchlistToken,
  botUid: string,
  config: { whaleThreshold: number; deadVolumeThreshold: number; deadHoursRequired: number },
): Promise<void> {
  const pair = await fetchBestPair(token.address)
  if (!pair) return

  const stateRef = db.collection('bot_state').doc(token.address.toLowerCase())
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

  // Lacak kapan token pertama kali "mati" (volume < threshold)
  const isDead = volume24h < config.deadVolumeThreshold
  let firstDeadAt: Timestamp | undefined
  if (isDead) {
    firstDeadAt = prev?.firstDeadAt ?? now
  }

  // Cooldown 4 jam per token — hindari spam alert yang sama
  const alertCooldownMs = 4 * 60 * 60 * 1000
  const canAlert = !prev?.lastAlertAt ||
    (now.toMillis() - prev.lastAlertAt.toMillis()) > alertCooldownMs

  let alertType: string | null = null

  if (canAlert) {
    const prevWasDead = !!prev?.firstDeadAt
    const deadMs = prev?.firstDeadAt
      ? now.toMillis() - prev.firstDeadAt.toMillis()
      : 0
    const deadHours = deadMs / (1000 * 60 * 60)

    // 1. DEAD TOKEN BUYER
    // Token tidak aktif cukup lama, lalu tiba-tiba ada aktivitas beli
    if (prevWasDead && deadHours >= config.deadHoursRequired && volume1h > config.deadVolumeThreshold * 5) {
      const deadDays = Math.floor(deadHours / 24)
      const deadLabel = deadDays >= 1
        ? `${deadDays} hari tidak aktif`
        : `${Math.floor(deadHours)} jam tidak aktif`
      const body = [
        '[DEAD TOKEN BUYER]',
        `$${sym} — ${name}`,
        `Volume (1j): ${formatUsd(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${formatChange(priceChange1h)})`,
        `Token ${deadLabel}, sinyal beli pertama terdeteksi.`,
      ].join('\n')
      await postAsBot(botUid, body, token.address, pair.url)
      alertType = 'dead_token'
    }

    // 2. WHALE ALERT
    // Volume 1 jam melampaui threshold + harga naik signifikan
    else if (volume1h >= config.whaleThreshold && priceChange1h >= 2) {
      const body = [
        '[WHALE ALERT]',
        `$${sym} — ${name}`,
        `Volume (1j): ${formatUsd(volume1h)}  |  Harga: $${priceUsd.toPrecision(4)} (${formatChange(priceChange1h)})`,
        `Beli/Jual (24j): ${buys24h} / ${sells24h}`,
      ].join('\n')
      await postAsBot(botUid, body, token.address, pair.url)
      alertType = 'whale'
    }

    // 3. SIDEWAYS ACCUMULATION
    // Harga flat tapi volume dan jumlah beli naik signifikan
    else if (
      prev &&
      Math.abs(priceChange24h) < 3 &&
      volume24h > (prev.volume24h ?? 0) * 1.5 &&
      buys24h > (prev.buys24h ?? 0) * 1.3 &&
      volume24h > 1000
    ) {
      const volGrowth = prev.volume24h > 0
        ? `+${(((volume24h / prev.volume24h) - 1) * 100).toFixed(0)}%`
        : 'naik'
      const body = [
        '[ACCUMULATION SIGNAL]',
        `$${sym} — ${name}`,
        `Harga (24j): ${formatChange(priceChange24h)}  |  Volume (24j): ${formatUsd(volume24h)} (${volGrowth})`,
        `Harga bergerak sideways, jumlah beli meningkat — kemungkinan akumulasi.`,
      ].join('\n')
      await postAsBot(botUid, body, token.address, pair.url)
      alertType = 'accumulation'
    }
  }

  // Simpan state terbaru
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
    ...(firstDeadAt ? { firstDeadAt } : { firstDeadAt: null }),
    ...(alertType ? { lastAlertAt: now, lastAlertType: alertType } : {}),
  }
  await stateRef.set(newState, { merge: true })
}

// ── Scheduled function — setiap 5 menit ───────────────────────────

export const pollMarketAlerts = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    const botUid = BOT_UID.value()
    if (!botUid) {
      console.error('BOT_UID belum dikonfigurasi. Jalankan: firebase functions:secrets:set BOT_UID')
      return
    }

    const whaleThreshold = parseFloat(WHALE_THRESHOLD_USD.value())
    const deadVolumeThreshold = parseFloat(DEAD_VOLUME_THRESHOLD_USD.value())
    const deadHoursRequired = parseFloat(DEAD_HOURS_REQUIRED.value())

    // Baca watchlist dari Firestore: bot_config/watchlist { tokens: [...] }
    const watchlistSnap = await db.collection('bot_config').doc('watchlist').get()
    if (!watchlistSnap.exists) {
      console.log('Watchlist belum ada. Buat dokumen bot_config/watchlist dengan field tokens: []')
      return
    }

    const tokens: WatchlistToken[] = watchlistSnap.data()?.tokens ?? []
    if (tokens.length === 0) {
      console.log('Watchlist kosong. Tambahkan token di Firestore: bot_config/watchlist')
      return
    }

    console.log(`Memproses ${tokens.length} token dari watchlist...`)

    // Proses semua token secara paralel, error satu tidak hentikan yang lain
    const results = await Promise.allSettled(
      tokens.map(t => processToken(t, botUid, { whaleThreshold, deadVolumeThreshold, deadHoursRequired }))
    )

    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) console.warn(`${failed} token gagal diproses`)
  }
)
