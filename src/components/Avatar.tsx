// src/components/Avatar.tsx
import { useState } from 'react'

export function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

function hashStr(s: string) {
  let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff; return h
}

export function UserAvatar({ username, size = 36, photoUrl }: { username: string; size?: number; photoUrl?: string | null }) {
  const [error, setError] = useState(false)
  const hue = hashStr(username) % 360
  const src = (!error && photoUrl) ? photoUrl : (!error ? getAvatarUrl(username) : null)

  if (error && !photoUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `hsl(${hue},60%,65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.38, color: '#fff',
      }}>
        {username[0].toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src ?? getAvatarUrl(username)}
      alt={username}
      width={size}
      height={size}
      style={{
        width: size, height: size, borderRadius: '50%',
        flexShrink: 0, display: 'block', objectFit: 'cover',
        background: 'var(--accent-soft)',
      }}
      onError={() => setError(true)}
    />
  )
}

export default UserAvatar
