export type PaperColor = 'white' | 'yellow' | 'black' | 'blue' | 'pink' | 'green'
export type SizeId = 'a4p' | 'a4l' | 'a5p' | 'a5l' | 'lp' | 'll' | 'wb'
export type TemplateId =
  | 'blank' | 'dots' | 'grid' | 'narrow' | 'wide'
  | 'cornell' | 'notepad' | 'mixed' | 'onecol' | 'twocolL' | 'twocolR' | 'twocol' | 'threecol'
  | 'todo' | 'monthly' | 'music' | 'guitar' | 'tabs' | 'flashcard'
  | 'mm' | 'iso' | 'hex' | 'daily' | 'weekly' | 'storyboard' | 'quad' | 'legal'

export const SIZES: Record<SizeId, { w: number; h: number; label: string }> = {
  a4p: { w: 794, h: 1123, label: 'A4, Hochformat' },
  a4l: { w: 1123, h: 794, label: 'A4, Querformat' },
  a5p: { w: 559, h: 794, label: 'A5, Hochformat' },
  a5l: { w: 794, h: 559, label: 'A5, Querformat' },
  lp: { w: 816, h: 1056, label: 'Letter, Hochformat' },
  ll: { w: 1056, h: 816, label: 'Letter, Querformat' },
  wb: { w: 2400, h: 1600, label: 'Whiteboard' },
}
export const PAPER_COLORS: Record<PaperColor, { bg: string; line: string; label: string }> = {
  yellow: { bg: '#fbf6dc', line: '#d8d0ac', label: 'Gelb' },
  white: { bg: '#ffffff', line: '#e5e7eb', label: 'Weiß' },
  black: { bg: '#17171a', line: '#46464c', label: 'Schwarz' },
  blue: { bg: '#e6f0fb', line: '#c9dcef', label: 'Blau' },
  pink: { bg: '#fbe8ec', line: '#e3bcc6', label: 'Rosa' },
  green: { bg: '#e7f5e4', line: '#b9d8b4', label: 'Grün' },
}
/** colours offered per template (blank has extra ones, like the "+3" in the picker) */
export const colorsFor = (t: TemplateId): PaperColor[] => (t === 'blank' ? ['yellow', 'white', 'black', 'blue', 'pink', 'green'] : ['yellow', 'white', 'black'])

export const TEMPLATE_GROUPS: { title: string; items: { id: TemplateId; label: string }[] }[] = [
  { title: 'Herkömmlich', items: [
    { id: 'blank', label: 'Leer' }, { id: 'dots', label: 'Gepunktet' }, { id: 'grid', label: 'Kariert' },
    { id: 'narrow', label: 'Liniert schmal' }, { id: 'wide', label: 'Liniert breit' }, { id: 'mm', label: 'Millimeterpapier' },
    { id: 'iso', label: 'Isometrisch' }, { id: 'hex', label: 'Hexagon' } ] },
  { title: 'Schreibpapier', items: [
    { id: 'cornell', label: 'Cornell' }, { id: 'notepad', label: 'Notizblock' }, { id: 'mixed', label: 'Eine Spalte gemischt' },
    { id: 'onecol', label: 'Eine Spalte' }, { id: 'twocolL', label: 'Zwei Spalten links' }, { id: 'twocolR', label: 'Zwei Spalten rechts' },
    { id: 'twocol', label: 'Zwei Spalten' }, { id: 'threecol', label: 'Drei Spalten' }, { id: 'legal', label: 'Legal Pad' }, { id: 'quad', label: 'Vier Felder' },
    { id: 'storyboard', label: 'Storyboard' } ] },
  { title: 'Planung', items: [{ id: 'todo', label: 'To-Dos' }, { id: 'daily', label: 'Tagesplaner' }, { id: 'weekly', label: 'Wochenplaner' }, { id: 'monthly', label: 'Monatsplaner C' }] },
  { title: 'Lernen', items: [{ id: 'flashcard', label: 'Lernkarte' }] },
  { title: 'Musik', items: [{ id: 'music', label: 'Musikpapier' }, { id: 'guitar', label: 'Noten für Gitarre' }, { id: 'tabs', label: 'Tabs für Gitarre' }] },
]
export const templateLabel = (id: TemplateId) => TEMPLATE_GROUPS.flatMap((g) => g.items).find((i) => i.id === id)?.label ?? id

const H = (y: number, x0: number, x1: number) => `M${x0} ${y + 0.5}H${x1}`
const V = (x: number, y0: number, y1: number) => `M${x + 0.5} ${y0}V${y1}`
const rows = (start: number, step: number, end: number, x0: number, x1: number) => { let d = ''; for (let k = 0, y = start; y <= end; k++, y = start + k * step) d += H(Math.round(y), x0, x1); return d }
/** 96 dpi page units per millimetre – lets every template use real stationery measurements. */
export const MM = 96 / 25.4
/** Line pitch of real notebook paper: college/narrow 7.1 mm, wide 8.7 mm, grid 5 mm, dot grid 5 mm. */
export const PITCH = { narrow: 7.1 * MM, wide: 8.7 * MM, grid: 5 * MM, dots: 5 * MM }

/** Inner SVG markup of a template (no outer <svg>). `uid` keeps pattern ids unique when many pages share a document. */
export function paperInner(t: TemplateId, c: PaperColor, w: number, h: number, uid = 'p', lineOverride?: string): string {
  const line = lineOverride ?? PAPER_COLORS[c].line
  let d = ''
  let extra = ''
  switch (t) {
    case 'dots':
      { const g = PITCH.dots; extra = `<pattern id="${uid}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><circle cx="${g / 2}" cy="${g / 2}" r="1.1" fill="${line}"/></pattern><rect width="${w}" height="${h}" fill="url(#${uid})"/>` } break
    case 'grid':
      { const g = PITCH.grid; extra = `<pattern id="${uid}" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><path d="M${g} 0H0V${g}" fill="none" stroke="${line}" stroke-width=".75"/></pattern><rect width="${w}" height="${h}" fill="url(#${uid})"/>` } break
    case 'narrow': d = rows(PITCH.narrow * 2, PITCH.narrow, h - 30, 0, w); break
    case 'wide': d = rows(PITCH.wide * 2, PITCH.wide, h - 30, 0, w); break
    case 'cornell': {
      const hy = Math.round(h * 0.1), sy = Math.round(h * 0.8), cx = Math.round(w * 0.27)
      d = H(hy, 0, w) + H(sy, 0, w) + V(cx, hy, sy) + rows(hy + 28, 28, sy - 10, 0, w) + rows(sy + 28, 28, h - 20, 0, w); break
    }
    case 'notepad': d = rows(66, 27, h - 30, 0, w) + V(Math.round(w * 0.1), 0, h) + V(Math.round(w * 0.1) + 4, 0, h); break
    case 'mixed': d = rows(Math.round(h * 0.5), 27, h - 30, 0, w); break
    case 'onecol': d = rows(60, 28, h - 40, 48, w - 48); break
    case 'twocolL': d = rows(60, 28, h - 40, 0, w) + V(Math.round(w * 0.3), 0, h); break
    case 'twocolR': d = rows(60, 28, h - 40, 0, w) + V(Math.round(w * 0.7), 0, h); break
    case 'twocol': d = rows(60, 28, h - 40, 0, w) + V(Math.round(w / 2), 0, h); break
    case 'threecol': d = rows(60, 28, h - 40, 0, w) + V(Math.round(w / 3), 0, h) + V(Math.round((2 * w) / 3), 0, h); break
    case 'mm': {
      const g = MM
      extra = `<pattern id="${uid}a" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><path d="M${g} 0H0V${g}" fill="none" stroke="${line}" stroke-width=".35" opacity=".7"/></pattern>`
        + `<pattern id="${uid}b" width="${g * 10}" height="${g * 10}" patternUnits="userSpaceOnUse"><rect width="${g * 10}" height="${g * 10}" fill="url(#${uid}a)"/><path d="M${g * 10} 0H0V${g * 10}" fill="none" stroke="${line}" stroke-width="1"/></pattern>`
        + `<rect width="${w}" height="${h}" fill="url(#${uid}b)"/>`
      break
    }
    case 'iso': {
      // isometric dot grid (5 mm triangles)
      const a = 5 * MM, rh = a * Math.sqrt(3) / 2
      extra = `<pattern id="${uid}" width="${a}" height="${rh * 2}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1.1" fill="${line}"/><circle cx="${a}" cy="0" r="1.1" fill="${line}"/><circle cx="${a / 2}" cy="${rh}" r="1.1" fill="${line}"/><circle cx="0" cy="${rh * 2}" r="1.1" fill="${line}"/><circle cx="${a}" cy="${rh * 2}" r="1.1" fill="${line}"/></pattern><rect width="${w}" height="${h}" fill="url(#${uid})"/>`
      break
    }
    case 'hex': {
      const r = 6 * MM, hw = r * Math.sqrt(3), hh = r * 3
      const hexPath = (cx: number, cy: number) => Array.from({ length: 6 }, (_, i) => { const t = (Math.PI / 3) * i + Math.PI / 6; return `${i ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}` }).join('') + 'Z'
      extra = `<pattern id="${uid}" width="${hw}" height="${hh}" patternUnits="userSpaceOnUse"><path d="${hexPath(hw / 2, r)}${hexPath(0, r * 2.5)}${hexPath(hw, r * 2.5)}" fill="none" stroke="${line}" stroke-width=".8"/></pattern><rect width="${w}" height="${h}" fill="url(#${uid})"/>`
      break
    }
    case 'legal': d = rows(PITCH.wide * 3, PITCH.wide, h - 30, 0, w) + V(Math.round(w * 0.12), 0, h) + V(Math.round(w * 0.12) + 4, 0, h) + H(Math.round(PITCH.wide * 2), 0, w); break
    case 'quad': d = V(Math.round(w / 2), 30, h - 30) + H(Math.round(h / 2), 30, w - 30) + `M30 30h${w - 60}v${h - 60}h-${w - 60}z`; break
    case 'storyboard': {
      const cols = 2, rowsN = 3, gx = 40, gy = 50, fw = (w - gx * (cols + 1)) / cols, fh = (h - 80 - gy * rowsN) / rowsN * 0.62
      for (let r2 = 0; r2 < rowsN; r2++) for (let c2 = 0; c2 < cols; c2++) {
        const x = gx + c2 * (fw + gx), y = 60 + r2 * ((h - 80) / rowsN)
        d += `M${x} ${y}h${fw}v${fh}h-${fw}z` + H(Math.round(y + fh + 22), x, x + fw) + H(Math.round(y + fh + 44), x, x + fw)
      }
      break
    }
    case 'daily': {
      d = H(90, 40, w - 40)
      const top = 120, slots = 15, sh = (h - top - 60) / slots
      for (let i = 0; i <= slots; i++) d += H(Math.round(top + i * sh), 110, w - 40)
      d += V(100, top, h - 60)
      extra = Array.from({ length: slots }, (_, i) => `<text x="44" y="${(top + i * sh + 20).toFixed(0)}" font-family="-apple-system,sans-serif" font-size="13" fill="${line}">${String(7 + i).padStart(2, '0')}:00</text>`).join('')
      break
    }
    case 'weekly': {
      const days = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'], top = 80, rh2 = (h - top - 40) / 4
      d = `M30 ${top}h${w - 60}v${h - top - 40}h-${w - 60}z` + V(Math.round(w / 2), top, h - 40)
      for (let i = 1; i < 4; i++) d += H(Math.round(top + i * rh2), 30, w - 30)
      extra = days.map((dd, i) => `<text x="${i % 2 ? w / 2 + 12 : 42}" y="${(top + Math.floor(i / 2) * rh2 + 26).toFixed(0)}" font-family="-apple-system,sans-serif" font-size="15" font-weight="600" fill="${line}">${dd}</text>`).join('')
      break
    }
    case 'flashcard': {
      // front (question) top half, back (answer) bottom half – used by the study mode
      const m = Math.round(h / 2)
      d = `M24 24h${w - 48}v${h - 48}h-${w - 48}z` + H(m, 24, w - 24)
      extra = `<text x="40" y="58" font-family="-apple-system,sans-serif" font-size="18" fill="${line}" font-weight="600">VORDERSEITE</text><text x="40" y="${m + 34}" font-family="-apple-system,sans-serif" font-size="18" fill="${line}" font-weight="600">RÜCKSEITE</text>`
      break
    }
    case 'todo': {
      d = H(70, 40, w - 40)
      for (let y = 106; y < h - 40; y += 36) { d += H(y + 16, 70, w - 40); d += `M40 ${y}h14v14h-14z` }
      break
    }
    case 'monthly': {
      const top = 90, left = 30, cw = (w - 60) / 7, ch = (h - top - 40) / 6
      d = `M${left} ${top}h${w - 60}v${h - top - 40}h-${w - 60}z`
      for (let i = 1; i < 7; i++) d += V(Math.round(left + cw * i), top, h - 40)
      for (let i = 1; i < 6; i++) d += H(Math.round(top + ch * i), left, w - 30)
      break
    }
    case 'music': for (let g = 0; g < Math.floor((h - 120) / 84); g++) for (let k = 0; k < 5; k++) d += H(80 + g * 84 + k * 9, 40, w - 40); break
    case 'guitar': for (let g = 0; g < 4; g++) { for (let k = 0; k < 5; k++) d += H(120 + g * 220 + k * 9, 50, w - 40); d += V(50, 120 + g * 220, 120 + g * 220 + 36) } break
    case 'tabs': for (let g = 0; g < Math.floor((h - 120) / 100); g++) for (let k = 0; k < 6; k++) d += H(80 + g * 100 + k * 11, 40, w - 40); break
    default: break
  }
  return `${extra}${d ? `<path d="${d}" fill="none" stroke="${line}" stroke-width="1"/>` : ''}`
}
export const paperSvg = (t: TemplateId, c: PaperColor, w: number, h: number, line?: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${paperInner(t, c, w, h, 'p', line)}</svg>`
export const paperUri = (t: TemplateId, c: PaperColor, w: number, h: number, line?: string) => `data:image/svg+xml;utf8,${encodeURIComponent(paperSvg(t, c, w, h, line))}`
/** thumbnails are shown at ~15 % – a stronger line keeps the pattern readable */
export const THUMB_LINE: Record<PaperColor, string> = { white: '#9aa3b2', yellow: '#b5a873', black: '#6b6b73', blue: '#7f9fc6', pink: '#c48a9a', green: '#86b07e' }
export function paperStyle(t: TemplateId, c: PaperColor, w: number, h: number, thumb = false): React.CSSProperties {
  return { backgroundColor: PAPER_COLORS[c].bg, backgroundImage: t === 'blank' ? undefined : `url("${paperUri(t, c, w, h, thumb ? THUMB_LINE[c] : undefined)}")`, backgroundSize: '100% 100%' }
}
