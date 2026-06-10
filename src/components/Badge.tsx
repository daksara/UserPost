import type { BadgeGrantType } from '../lib/firebase'

export type BadgeDisplayType = 'official' | BadgeGrantType

interface BadgeConfig { label: string; icon: JSX.Element }

const CFG: Record<BadgeDisplayType, BadgeConfig> = {
  official: {
    label: 'Official',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
      </svg>
    ),
  },
  partner: {
    label: 'Partner',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  contributor: {
    label: 'Contributor',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  verified: {
    label: 'Verified',
    icon: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
}

export const BADGE_GRANT_TYPES: BadgeGrantType[] = ['partner', 'contributor', 'verified']

export function BadgeChip({ type }: { type: BadgeDisplayType }) {
  const { label, icon } = CFG[type]
  // Icon-only agar clean — makna badge tetap tersedia via tooltip/screen reader
  return <span className={`badge-${type}`} title={label} aria-label={label}>{icon}</span>
}
