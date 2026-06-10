// Shared pure helpers (no Firebase imports so they stay unit-testable).

/** Relative age like "5s", "3m", "2h", "1d". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

/** Time until expiry like "5h left" / "12m left", or null when expired. */
export function expiresIn(iso: string, now: number = Date.now()): string | null {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h left` : `${m}m left`
}

/** Deterministic conversation id: sorted pair of user ids joined by '_'. */
export function convoId(a: string, b: string): string {
  return [a, b].sort().join('_')
}

/** Split an array into chunks of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** True when the identifier looks like an email rather than a username. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
