export type CoverId =
  | 'hell' | 'reise' | 'einfach' | 'farbig' | 'schlicht' | 'einband'
  | 'fluessig' | 'goood' | 'kabel' | 'samen' | 'www' | 'pinsel' | 'punkte' | 'blumen'
  | 'checkbox' | 'staebe' | 'wellen' | 'zickzack' | 'geometrisch' | 'mathe' | 'linien'
  | 'bluete' | 'leuchten' | 'schaetze'

export const COVER_COLORS = ['#0a7aff', '#f08a8a', '#7d2e8f', '#d40000', '#7d4e30', '#6cc12a', '#111111', '#ffffff', '#c8c8cc']

const W = 200, H = 285
const wrap = (inner: string, bg: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>`
let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const dots = (n: number, fg: string, r0: number, r1: number) => { seed = 7; let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${rnd() * W}" cy="${rnd() * H}" r="${r0 + rnd() * (r1 - r0)}" fill="${fg}"/>`; return s }
const zig = (fg: string, bg2: string) => { let s = ''; for (let y = 0; y < H; y += 24) for (let x = -20; x < W + 20; x += 40) s += `<path d="M${x} ${y + 24}l20 -24l20 24z" fill="${(y / 24) % 2 ? fg : bg2}"/>`; return s }

export const COVERS: { id: CoverId; label: string; group: string; build: (c: string) => string }[] = [
  { id: 'hell', label: 'Hell', group: 'Einfach', build: (c) => wrap(`<rect x="162" width="16" height="${H}" fill="#000" opacity=".22"/>`, c) },
  { id: 'reise', label: 'Reise', group: 'Einfach', build: (c) => wrap(`<path d="M30 0C0 60 30 110 80 100S150 150 130 210 200 250 200 250" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/><rect x="40" y="105" width="115" height="38" rx="4" fill="#fff"/>`, '#1e2142') },
  { id: 'einfach', label: 'Einfach', group: 'Einfach', build: (c) => wrap(`<rect x="0" width="12" height="${H}" fill="#fff" opacity=".25"/><path d="M30 100H175" stroke="#000" opacity=".3"/><path d="M150 230h25M150 238h25M150 246h25" stroke="#000" opacity=".25"/>`, c === '#ffffff' ? '#e9e9ec' : c) },
  { id: 'farbig', label: 'Farbig', group: 'Einfach', build: (c) => wrap(`<rect x="165" width="12" height="${H}" fill="${c}"/>`, '#ffffff') },
  { id: 'schlicht', label: 'Schlicht', group: 'Einfach', build: (c) => wrap(`<rect x="30" y="100" width="170" height="185" fill="${c}" opacity=".35"/><rect x="0" y="130" width="200" height="155" fill="${c}" opacity=".35"/>`, '#ffffff') },
  { id: 'einband', label: 'Einband', group: 'Einfach', build: (c) => wrap(`<rect y="95" width="200" height="190" fill="${c}"/>`, '#f7f7f8') },
  { id: 'fluessig', label: 'Flüssig', group: 'Bunt', build: (c) => wrap(`<rect y="140" width="200" height="145" fill="${c}" opacity=".5"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 7} 0V140" stroke="${c}" opacity=".35"/>`).join('')}`, '#ecefd0') },
  { id: 'goood', label: 'GOOOD', group: 'Bunt', build: (c) => wrap(Array.from({ length: 14 }, (_, i) => `<path d="M0 ${i * 22}Q50 ${i * 22 - 20} 100 ${i * 22}T200 ${i * 22}" fill="none" stroke="${c}" opacity=".8"/>`).join(''), '#1c2142') },
  { id: 'kabel', label: 'Kabel', group: 'Bunt', build: (c) => wrap(Array.from({ length: 9 }, (_, i) => `<rect x="${(i % 2) * 30 - 10}" y="${i * 32 + 6}" width="190" height="14" rx="3" fill="${i % 3 === 0 ? '#f4f0d6' : '#d8c98c'}" transform="rotate(${i % 2 ? 4 : -4} 100 ${i * 32})"/>`).join(''), c === '#0a7aff' ? '#6a2224' : c) },
  { id: 'samen', label: 'Samen', group: 'Bunt', build: (c) => wrap(Array.from({ length: 20 }, (_, i) => `<path d="M${(i % 4) * 55 + (Math.floor(i / 4) % 2) * 25} ${Math.floor(i / 4) * 60 + 10}q18 22 0 44q-18 -22 0 -44z" fill="none" stroke="${c}" stroke-width="4"/>`).join(''), '#1d2145') },
  { id: 'www', label: 'WWW', group: 'Bunt', build: (c) => wrap(zig(c, '#233a6b'), '#f3d66b') },
  { id: 'pinsel', label: 'Pinsel', group: 'Bunt', build: (c) => wrap(`<path d="M0 30L170 0V60L0 90z" fill="#e6cf7a"/><path d="M60 100L200 80V200L40 230z" fill="${c}" opacity=".6"/><rect x="0" y="180" width="130" height="50" fill="#bcd0d9"/>`, '#f6f1e9') },
  { id: 'punkte', label: 'Punkte', group: 'Bunt', build: (c) => wrap(dots(36, c, 2, 16), '#efeeea') },
  { id: 'blumen', label: 'Blumen', group: 'Bunt', build: () => wrap(dots(18, '#f0746b', 8, 20) + dots(14, '#f4b942', 6, 16) + dots(16, '#2a6f6a', 5, 12), '#fbf3e4') },
  { id: 'checkbox', label: 'Checkbox', group: 'Geometrisch', build: (c) => wrap(`<pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 0L40 40M40 0L0 40M20 0V40M0 20H40" stroke="${c}" opacity=".5" fill="none"/></pattern><rect width="200" height="285" fill="url(#g)"/>`, '#fff') },
  { id: 'staebe', label: 'Stäbe', group: 'Geometrisch', build: (c) => wrap(Array.from({ length: 22 }, (_, i) => { seed = i + 3; return `<rect x="${rnd() * 190}" y="${rnd() * 275}" width="34" height="5" fill="${c}" transform="rotate(${rnd() * 180} 100 140)"/>` }).join(''), '#fff') },
  { id: 'wellen', label: 'Wellen', group: 'Geometrisch', build: (c) => wrap(Array.from({ length: 6 }, (_, i) => `<path d="M-10 ${i * 50 + 30}Q50 ${i * 50 - 20} 100 ${i * 50 + 25}T210 ${i * 50 + 10}" fill="none" stroke="${c}" stroke-width="7" opacity=".7"/>`).join(''), '#fff') },
  { id: 'zickzack', label: 'Zickzack', group: 'Geometrisch', build: (c) => wrap(zig(c, '#f4f2ee'), '#f4f2ee') },
  { id: 'geometrisch', label: 'Geometrisch', group: 'Geometrisch', build: (c) => wrap(Array.from({ length: 10 }, (_, i) => `<path d="M${60 + i * 6} 285L200 ${180 - i * 4}" stroke="${c}" opacity=".6"/>`).join('') + Array.from({ length: 6 }, (_, i) => `<path d="M0 ${200 + i * 8}H120" stroke="${c}" opacity=".35"/>`).join(''), '#f7f7f7') },
  { id: 'mathe', label: 'Mathe', group: 'Geometrisch', build: () => wrap(`<text x="78" y="130" font-size="20" fill="#555" font-family="sans-serif">+ ×</text><text x="78" y="156" font-size="20" fill="#555" font-family="sans-serif">− ÷</text>`, '#f4f4f4') },
  { id: 'linien', label: 'Linien', group: 'Geometrisch', build: (c) => wrap(Array.from({ length: 26 }, (_, i) => `<path d="M${i * 8 - 40} 285L${100 + i * 8 - 40} 185" stroke="${c}" opacity=".8"/>`).join(''), '#f5f5f5') },
  { id: 'bluete', label: 'Blüte', group: 'Feierlichkeiten', build: (c) => wrap(`<rect width="200" height="190" fill="#215a58"/><rect y="190" width="200" height="95" fill="#fff"/>${dots(10, c === '#0a7aff' ? '#e1503f' : c, 5, 12).replace(/cy="(\d+\.?\d*)"/g, (_, y) => `cy="${190 + (+y % 95)}"`)}`, '#215a58') },
  { id: 'leuchten', label: 'Leuchten', group: 'Feierlichkeiten', build: () => wrap(`<rect width="200" height="190" fill="#6a2427"/><rect y="190" width="200" height="95" fill="#ddd08c"/><ellipse cx="60" cy="238" rx="22" ry="26" fill="none" stroke="#7a6a2a"/><ellipse cx="140" cy="240" rx="18" ry="28" fill="none" stroke="#7a6a2a"/>`, '#6a2427') },
  { id: 'schaetze', label: 'Schätze', group: 'Feierlichkeiten', build: () => wrap(`<rect y="190" width="200" height="95" fill="#dcd38c"/>${dots(5, '#fff', 14, 24).replace(/cy="(\d+\.?\d*)"/g, (_, y) => `cy="${200 + (+y % 75)}"`)}`, '#f1ebd0') },
]
export const coverUri = (id: CoverId, color: string) => {
  const c = COVERS.find((x) => x.id === id) ?? COVERS[0]
  return `data:image/svg+xml;utf8,${encodeURIComponent(c.build(color))}`
}
