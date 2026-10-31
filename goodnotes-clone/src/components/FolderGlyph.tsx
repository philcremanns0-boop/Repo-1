import { Book, BookOpen, Briefcase, GraduationCap, Heart, Music, Star, type LucideIcon } from 'lucide-react'

export const FOLDER_ICONS: Record<string, LucideIcon | null> = { none: null, star: Star, book: Book, read: BookOpen, school: GraduationCap, work: Briefcase, heart: Heart, music: Music }
/** strong tones + the soft GN tones (Matcha, Sky, Lavender, Candy Floss) */
export const FOLDER_COLORS = ['#a3222a', '#f59a2c', '#f2c94c', '#6cc12a', '#45bfdb', '#0a7aff', '#7d2e8f', '#8e8e93', '#cfe6b8', '#bfdcf5', '#b4aed0', '#f6c6d8']

/** Folder illustration (tab + body), tinted with the folder colour. */
export function FolderGlyph({ color, icon, className = '', width = 150 }: { color: string; icon?: string; className?: string; width?: number }) {
  const Icon = icon ? FOLDER_ICONS[icon] : null
  return (
    <svg viewBox="0 0 160 124" width={width} height={(width * 124) / 160} className={className} aria-hidden>
      <path d="M8 22a10 10 0 0110-10h38c5 0 7 2 10 6s5 6 10 6h66a10 10 0 0110 10v82a10 10 0 01-10 10H18a10 10 0 01-10-10z" fill={color} />
      <path d="M8 22a10 10 0 0110-10h38c5 0 7 2 10 6s5 6 10 6h66a10 10 0 0110 10v4H8z" fill="#000" opacity=".18" />
      <rect x="8" y="40" width="144" height="76" rx="10" fill={color} />
      <rect x="8" y="40" width="144" height="76" rx="10" fill="url(#g)" opacity=".0" />
      <path d="M8 40h144" stroke="#fff" strokeOpacity=".22" strokeWidth="2" />
      {Icon && (
        <g transform="translate(64 62)" stroke="#fff" strokeOpacity=".9" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Icon x={0} y={0} width={32} height={32} /></g>
      )}
    </svg>
  )
}
