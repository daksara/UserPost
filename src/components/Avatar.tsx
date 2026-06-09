// src/components/Avatar.tsx
// Avatar menggunakan DiceBear Micah — tidak perlu install package apapun,
// cukup gunakan URL API publik mereka.

interface AvatarProps {
  username: string
  size?: number
  className?: string
}

/**
 * Menghasilkan URL avatar DiceBear Micah berdasarkan username.
 * Seed = username sehingga setiap user punya avatar unik & konsisten.
 */
export function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export default function Avatar({ username, size = 36, className = '' }: AvatarProps) {
  return (
    <img
      src={getAvatarUrl(username)}
      alt={username}
      width={size}
      height={size}
      className={`avatar-img ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'block',
        objectFit: 'cover',
        background: '#eeeeff',
      }}
      // Fallback: tampilkan inisial jika gambar gagal load
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement
        el.style.display = 'none'
        const fallback = el.nextElementSibling as HTMLElement | null
        if (fallback) fallback.style.display = 'flex'
      }}
    />
  )
}

/** Fallback inisial jika DiceBear tidak bisa diakses */
export function AvatarFallback({ username, size = 36 }: { username: string; size?: number }) {
  function hashStr(s: string) {
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff; return h
  }
  const hue = hashStr(username) % 360
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${hue},60%,65%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.38,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {username[0].toUpperCase()}
    </div>
  )
}

/** Komponen lengkap: DiceBear + fallback inisial */
export function UserAvatar({ username, size = 36 }: { username: string; size?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size, flexShrink: 0 }}>
      <img
        src={getAvatarUrl(username)}
        alt={username}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'block',
          objectFit: 'cover',
          background: '#eeeeff',
        }}
        onError={(e) => {
          const img = e.currentTarget
          img.style.display = 'none'
          const sibling = img.nextElementSibling as HTMLElement | null
          if (sibling) sibling.style.display = 'flex'
        }}
      />
      {/* Fallback tersembunyi, tampil jika img error */}
      <AvatarFallback username={username} size={size} />
    </span>
  )
}
