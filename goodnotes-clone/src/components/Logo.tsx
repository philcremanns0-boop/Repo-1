/** Goodnotes app logo, rebuilt as vector from the official icon (teal #02BDE4, ink #0F1010). */
export function GoodnotesLogo({ size = 28, className = '', tile = false }: { size?: number; className?: string; tile?: boolean }) {
  return (
    <svg viewBox="250 250 800 800" width={size} height={size} className={className} role="img" aria-label="Goodnotes">
      {tile && <rect x="250" y="250" width="800" height="800" rx="180" fill="#F7F7F7" />}
      <rect x="314" y="342" width="477" height="61" rx="21" fill="#02BDE4" />
      <rect x="315" y="545" width="387" height="61" rx="21" fill="#02BDE4" />
      <path d="M345 756A209.2 209.2 0 0 0 718 852" fill="none" stroke="#02BDE4" strokeWidth="60" strokeLinecap="round" />
      <path d="M884 352C904 304 978 300 996 358c3 13 2 27-4 40L870 682c-4 9-9 17-16 24l-79 77c-8 8-23 4-23-8l3-114c0-11 3-21 7-30z" fill="var(--gn-logo-ink, #0F1010)" />
    </svg>
  )
}
