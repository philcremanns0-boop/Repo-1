export type PaperColor = 'white' | 'yellow' | 'black' | 'blue' | 'pink' | 'green'
export type SizeId = 'a4p' | 'a4l' | 'a5p' | 'a5l' | 'lp' | 'll' | 'wb'
export type TemplateId =
  | 'blank' | 'dots' | 'grid' | 'narrow' | 'wide'
  | 'cornell' | 'notepad' | 'mixed' | 'onecol' | 'twocolL' | 'twocolR' | 'twocol' | 'threecol'
  | 'todo' | 'monthly' | 'music' | 'guitar' | 'tabs' | 'flashcard'

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
    { id: 'narrow', label: 'Liniert schmal' }, { id: 'wide', label: 'Liniert breit' } ] },
  { title: 'Schreibpapier', items: [
    { id: 'cornell', label: 'Cornell' }, { id: 'notepad', label: 'Notizblock' }, { id: 'mixed', label: 'Eine Spalte gemischt' },
    { id: 'onecol', label: 'Eine Spalte' }, { id: 'twocolL', label: 'Zwei Spalten links' }, { id: 'twocolR', label: 'Zwei Spalten rechts' },
    { id: 'twocol', label: 'Zwei Spalten' }, { id: 'threecol', label: 'Drei Spalten' } ] },
  { title: 'Planung', items: [{ id: 'todo', label: 'To-Dos' }, { id: 'monthly', label: 'Monatsplaner C' }] },
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
export function paperInner(t: TemplateId, c: PaperColor, w: number, h: number, uid = 'p'): string {
  const { line } = PAPER_COLORS[c]
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
export const paperSvg = (t: TemplateId, c: PaperColor, w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${paperInner(t, c, w, h)}</svg>`
export const paperUri = (t: TemplateId, c: PaperColor, w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(paperSvg(t, c, w, h))}`
export function paperStyle(t: TemplateId, c: PaperColor, w: number, h: number): React.CSSProperties {
  return { backgroundColor: PAPER_COLORS[c].bg, backgroundImage: t === 'blank' ? undefined : `url("${paperUri(t, c, w, h)}")`, backgroundSize: '100% 100%' }
}
