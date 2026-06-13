// src/components/Logo.tsx
//
// Logo Pendar — sebuah titik inti yang memancarkan sinar (radiance / "pendar").
// Empat sinar utama (tegas) + empat sinar diagonal (lebih lembut/transparan)
// memberi kesan cahaya yang berpendar. Warna default mengikuti --accent.
export function Logo({ size = 24, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 192 192"
      fill="none" role="img" aria-label="Pendar"
    >
      {/* Sinar utama (atas/bawah/kiri/kanan) */}
      <g stroke={color} strokeWidth="12" strokeLinecap="round">
        <line x1="96" y1="62" x2="96" y2="26" />
        <line x1="96" y1="130" x2="96" y2="166" />
        <line x1="62" y1="96" x2="26" y2="96" />
        <line x1="130" y1="96" x2="166" y2="96" />
      </g>
      {/* Sinar diagonal — lebih tipis & transparan (efek berpendar) */}
      <g stroke={color} strokeWidth="9" strokeLinecap="round" opacity="0.5">
        <line x1="118" y1="74" x2="138" y2="54" />
        <line x1="74" y1="74" x2="54" y2="54" />
        <line x1="74" y1="118" x2="54" y2="138" />
        <line x1="118" y1="118" x2="138" y2="138" />
      </g>
      {/* Inti */}
      <circle cx="96" cy="96" r="22" fill={color} />
    </svg>
  )
}
