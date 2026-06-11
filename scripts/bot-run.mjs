/**
 * Bot script — runs via GitHub Actions every 30 minutes.
 * Discovers tokens from DexScreener and updates the live pinned alert.
 *
 * Required environment variables (GitHub Secrets):
 *   FIREBASE_SERVICE_ACCOUNT  – Firebase service account JSON (single line)
 *   BOT_UID                   – UID of the userpostbot Firebase Auth account
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

// ── Init Firebase ──────────────────────────────────────────────────

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
const botUid = process.env.BOT_UID

if (!serviceAccount || !botUid) {
  console.error('FIREBASE_SERVICE_ACCOUNT and BOT_UID must be set in GitHub Secrets.')
  process.exit(1)
}

initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
const db = getFirestore()

// ── Config ─────────────────────────────────────────────────────────

const WHALE_THRESHOLD    = parseFloat(process.env.WHALE_THRESHOLD_USD        ?? '10000')
const DEAD_VOL_THRESHOLD = parseFloat(process.env.DEAD_VOLUME_THRESHOLD_USD  ?? '100')
const DEAD_HOURS         = parseFloat(process.env.DEAD_HOURS_REQUIRED        ?? '24')
const MIN_LIQUIDITY      = parseFloat(process.env.MIN_LIQUIDITY_USD          ?? '5000')
const NEW_LISTING_VOL    = parseFloat(process.env.NEW_LISTING_VOL_THRESHOLD_USD ?? '5000')
const NEW_LISTING_PUMP   = parseFloat(process.env.NEW_LISTING_PUMP_PCT       ?? '5')
const ALERT_COOLDOWN_MS  = 4 * 60 * 60 * 1000  // 4 hours

// ── Types (JSDoc) ──────────────────────────────────────────────────

/**
 * @typedef {{ tokenAddress: string, chainId: string }} DexProfile
 * @typedef {{
 *   chainId: string, url: string,
 *   baseToken: { address: string, name: string, symbol: string },
 *   priceUsd?: string,
 *   fdv?: number,
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

function fmtMC(n) {
  if (!n || n <= 0) return null
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B MC`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M MC`
  if (n >= 1_000)         return `${Math.round(n / 1_000)}K MC`
  return null
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

// ── Token discovery ────────────────────────────────────────────────

async function discoverTokens() {
  const seen = new Map()

  const profiles = await dexGet('https://api.dexscreener.com/token-profiles/latest/v1')
  if (Array.isArray(profiles)) {
    for (const p of profiles.slice(0, 25)) {
      if (p?.tokenAddress) seen.set(p.tokenAddress.toLowerCase(), p.chainId)
    }
  }

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

// ── Fetch best pair for a token ────────────────────────────────────

async function fetchBestPair(address) {
  const data = await dexGet(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
  if (!data?.pairs?.length) return null
  return data.pairs.reduce((best, p) =>
    (p.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? p : best
  )
}

// ── Update pinned alerts (one slot per alert type) ─────────────────

async function setPinnedAlert(type, headline, detail, contractAddress, linkUrl, chain, priceUsd) {
  const data = {
    type,
    headline,
    detail,
    chain: chain ?? null,
    contract_address: contractAddress ?? null,
    link_url: linkUrl ?? null,
    price_usd_at_alert: priceUsd > 0 ? priceUsd : null,
    followup_pct: null,
    followup_at: null,
    updated_at: Timestamp.now(),
  }
  // Each alert type gets its own slot so a whale alert doesn't overwrite a
  // still-relevant dead-token alert. The legacy 'live' doc mirrors the most
  // recent alert for clients that haven't been redeployed yet.
  await Promise.all([
    db.collection('pinned_feed').doc(type).set(data),
    db.collection('pinned_feed').doc('live').set(data),
  ])
  console.log('Pinned alert:', headline)
}

// Pinned alerts keyed by contract address, loaded once per run so each token
// can update the "% since alert" follow-up on the slot it triggered.
async function getPinnedAlertsByAddress() {
  const snap = await db.collection('pinned_feed').get()
  const map = new Map()
  for (const d of snap.docs) {
    if (d.id === 'live') continue
    const data = d.data()
    const addr = data.contract_address?.toLowerCase()
    if (!addr || !(data.price_usd_at_alert > 0)) continue
    if (!map.has(addr)) map.set(addr, [])
    map.get(addr).push({ ref: d.ref, priceAtAlert: data.price_usd_at_alert })
  }
  return map
}

let pinnedByAddress = new Map()

// ── Process one token ──────────────────────────────────────────────

async function processToken(address) {
  const pair = await fetchBestPair(address)
  if (!pair) return
  if ((pair.liquidity?.usd ?? 0) < MIN_LIQUIDITY) return

  const stateRef  = db.collection('bot_state').doc(address.toLowerCase())
  const stateSnap = await stateRef.get()
  const prev      = stateSnap.exists ? stateSnap.data() : null

  const now        = Timestamp.now()
  const sym        = pair.baseToken.symbol
  const priceUsd   = parseFloat(pair.priceUsd ?? '0')
  const volume24h  = pair.volume?.h24     ?? 0
  const volume1h   = pair.volume?.h1      ?? 0
  const change24h  = pair.priceChange?.h24 ?? 0
  const change1h   = pair.priceChange?.h1  ?? 0
  const buys24h    = pair.txns?.h24?.buys  ?? 0
  const fdv        = pair.fdv              ?? 0
  const liq        = pair.liquidity?.usd   ?? 0
  const chain      = pair.chainId

  const mc         = fmtMC(fdv)
  const mcLabel    = mc ? ` at ${mc}` : ''

  const isDead     = volume24h < DEAD_VOL_THRESHOLD
  const firstDeadAt = isDead ? (prev?.firstDeadAt ?? now) : null

  // Follow-up tracking: if this token is still pinned, record how its price
  // moved since the alert fired. A fresh alert below resets these fields.
  const pinnedSlots = pinnedByAddress.get(address.toLowerCase()) ?? []
  if (priceUsd > 0) {
    await Promise.all(pinnedSlots.map(slot =>
      slot.ref.set({
        followup_pct: ((priceUsd / slot.priceAtAlert) - 1) * 100,
        followup_at: now,
      }, { merge: true })
    ))
  }

  const canAlert = !prev?.lastAlertAt ||
    (now.toMillis() - prev.lastAlertAt.toMillis()) > ALERT_COOLDOWN_MS

  let alertType = null

  if (canAlert) {
    const deadMs    = prev?.firstDeadAt ? now.toMillis() - prev.firstDeadAt.toMillis() : 0
    const deadHours = deadMs / (1000 * 60 * 60)

    // 1. DEAD TOKEN BUYER
    if (prev?.firstDeadAt && deadHours >= DEAD_HOURS && volume1h > DEAD_VOL_THRESHOLD * 5) {
      const deadDays = Math.floor(deadHours / 24)
      const inactive = deadDays >= 1 ? `${deadDays}d inactive` : `${Math.floor(deadHours)}h inactive`
      await setPinnedAlert(
        'dead_token',
        `Someone bought $${sym} in dead market${mcLabel}`,
        `${inactive} · 1h vol ${fmt$(volume1h)} · liq ${fmt$(liq)}`,
        pair.baseToken.address,
        pair.url,
        chain,
        priceUsd,
      )
      alertType = 'dead_token'
    }

    // 2. WHALE ALERT
    else if (volume1h >= WHALE_THRESHOLD && change1h >= 1) {
      await setPinnedAlert(
        'whale',
        `Whale buying $${sym}${mcLabel}`,
        `${fmt$(volume1h)} in 1h · ${fmtPct(change1h)} · liq ${fmt$(liq)}`,
        pair.baseToken.address,
        pair.url,
        chain,
        priceUsd,
      )
      alertType = 'whale'
    }

    // 3. NEW LISTING BREAKOUT — first time the bot sees this token and it's
    // already trading hot (high 1h volume + pumping)
    else if (!prev && volume1h >= NEW_LISTING_VOL && change1h >= NEW_LISTING_PUMP) {
      await setPinnedAlert(
        'new_listing',
        `New token $${sym} breaking out${mcLabel}`,
        `${fmt$(volume1h)} in 1h · ${fmtPct(change1h)} · liq ${fmt$(liq)}`,
        pair.baseToken.address,
        pair.url,
        chain,
        priceUsd,
      )
      alertType = 'new_listing'
    }

    // 4. ACCUMULATION SIGNAL
    else if (
      prev &&
      Math.abs(change24h) < 3 &&
      volume24h > (prev.volume24h ?? 0) * 1.5 &&
      buys24h > (prev.buys24h ?? 0) * 1.3 &&
      volume24h > 1000
    ) {
      const growth = prev.volume24h > 0
        ? `+${(((volume24h / prev.volume24h) - 1) * 100).toFixed(0)}%`
        : 'rising'
      await setPinnedAlert(
        'accumulation',
        `Someone buying $${sym} in accumulation${mcLabel}`,
        `Vol ${growth} · ${buys24h.toLocaleString()} buys · liq ${fmt$(liq)}`,
        pair.baseToken.address,
        pair.url,
        chain,
        priceUsd,
      )
      alertType = 'accumulation'
    }
  }

  await stateRef.set({
    symbol: sym, chain: pair.chainId, pairUrl: pair.url,
    priceUsd, volume24h, volume1h,
    priceChange24h: change24h, priceChange1h: change1h,
    buys24h,
    lastChecked: now,
    firstDeadAt,
    ...(alertType ? { lastAlertAt: now, lastAlertType: alertType } : {}),
  }, { merge: true })
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('Bot started:', new Date().toISOString())

  const [discovered, deadAddresses, pinned] = await Promise.all([
    discoverTokens(),
    getTrackedDeadAddresses(),
    getPinnedAlertsByAddress(),
  ])
  pinnedByAddress = pinned

  // Pinned tokens stay in the processing set so follow-ups keep updating
  // even after the token drops out of DexScreener discovery.
  const all = new Set([...discovered, ...deadAddresses, ...pinned.keys()])
  console.log(`Processing ${all.size} tokens (${discovered.length} discovered + ${deadAddresses.length} dead tracked + ${pinned.size} pinned)`)

  const results = await Promise.allSettled(
    [...all].map(addr => processToken(addr))
  )

  const ok     = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  console.log(`Done: ${ok} OK, ${failed} failed`)

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
