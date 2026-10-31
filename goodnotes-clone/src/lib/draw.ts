/* Vector model + rendering helpers shared by canvas, thumbnails and export. */

export type PenType = 'fountain' | 'ballpoint' | 'brush'
export type ShapeKind = 'line' | 'arrow' | 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'tape' | 'poly'
export interface Pt { x: number; y: number }
export interface StrokePoint extends Pt { w: number }
/** sharp/press: 0-100, round: 0-3, speed: width follows pen speed */
export interface PenOpts { sharp: number; press: number; round: number; speed: boolean }

export interface Stroke {
  id: number
  tool: 'pen' | 'highlighter' | 'shape'
  color: string
  width: number
  points: StrokePoint[]
  pen?: PenType
  opts?: PenOpts
  shape?: ShapeKind
  fill?: boolean
}
export interface TextObj {
  id: number; x: number; y: number; w: number; text: string
  font: string; size: number; color: string; bold: boolean; italic: boolean
  align: 'left' | 'center' | 'right'; lh: number; note?: boolean
  /** Textfeld-Stil: box fill / border colour (null = none) */
  fill?: string | null; border?: string | null
}
export interface ImageObj { id: number; x: number; y: number; w: number; h: number; src: string }
/** Hyperlink area on a page (Goodnotes: Lasso → Link hinzufügen). */
export interface LinkObj { id: number; x: number; y: number; w: number; h: number; to: { page: string } | { url: string } }
export interface Content { strokes: Stroke[]; texts: TextObj[]; images: ImageObj[]; links?: LinkObj[] }
export interface Selection { pageId: string; strokes: number[]; texts: number[]; images: number[] }

export const emptyContent = (): Content => ({ strokes: [], texts: [], images: [] })
let lastId = 0
export const newId = () => (lastId = Math.max(Date.now() * 1000, lastId + 1))

export const HIGHLIGHTER_ALPHA = 0.38
export const DEFAULT_OPTS: Record<PenType, PenOpts> = {
  fountain: { sharp: 50, press: 50, round: 0, speed: true },
  ballpoint: { sharp: 50, press: 0, round: 0, speed: false },
  brush: { sharp: 50, press: 50, round: 0, speed: true },
}
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Width multiplier for one input sample (pressure for styluses, speed for mouse/touch). */
export function pointWeight(pen: PenType, o: PenOpts, type: string, pressure: number, speed: number, prev: number) {
  if (pen === 'ballpoint') return 1
  const k = o.press / 50
  let t = 1
  if (type === 'pen') {
    const p = pressure > 0 ? pressure : 0.5
    t = pen === 'brush' ? 0.2 + 1.8 * p : 0.4 + 1.2 * p
  } else if (pen === 'brush') t = clamp(1.7 - speed * 0.9, 0.3, 1.7)
  else if (o.speed) t = clamp(1.35 - speed * 0.5, 0.6, 1.2)
  const target = 1 + (t - 1) * k
  return prev ? prev * 0.6 + target * 0.4 : target
}

/* ------------------------------ shapes ------------------------------ */

export function shapeOutline(s: Stroke): Pt[] {
  const [a, b] = [s.points[0], s.points[s.points.length - 1]]
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y)
  switch (s.shape) {
    case 'rect': return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 }]
    case 'triangle': return [{ x: (x0 + x1) / 2, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: (x0 + x1) / 2, y: y0 }]
    case 'diamond': return [{ x: (x0 + x1) / 2, y: y0 }, { x: x1, y: (y0 + y1) / 2 }, { x: (x0 + x1) / 2, y: y1 }, { x: x0, y: (y0 + y1) / 2 }, { x: (x0 + x1) / 2, y: y0 }]
    case 'ellipse': {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2
      return Array.from({ length: 49 }, (_, i) => ({ x: cx + rx * Math.cos((i / 48) * Math.PI * 2), y: cy + ry * Math.sin((i / 48) * Math.PI * 2) }))
    }
    case 'poly': return [...s.points.map((p) => ({ x: p.x, y: p.y })), { x: s.points[0].x, y: s.points[0].y }]
    default: return [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]
  }
}
export const strokePts = (s: Stroke): Pt[] => (s.tool === 'shape' ? shapeOutline(s) : s.points)

function drawShape(ctx: CanvasRenderingContext2D, s: Stroke) {
  const a = s.points[0], b = s.points[s.points.length - 1]
  ctx.save()
  ctx.strokeStyle = s.color; ctx.fillStyle = s.color
  ctx.lineWidth = s.width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
  if (s.shape === 'tape') {
    const len = Math.hypot(b.x - a.x, b.y - a.y), h = s.width
    ctx.translate(a.x, a.y); ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x))
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    const n = h * 0.22
    ctx.moveTo(0, -h / 2); ctx.lineTo(len, -h / 2); ctx.lineTo(len - n, -h / 4); ctx.lineTo(len, 0); ctx.lineTo(len - n, h / 4); ctx.lineTo(len, h / 2)
    ctx.lineTo(0, h / 2); ctx.lineTo(n, h / 4); ctx.lineTo(0, 0); ctx.lineTo(n, -h / 4); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 0.28; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
    for (let x = n * 2; x < len - n; x += 9) { ctx.beginPath(); ctx.moveTo(x, -h / 2); ctx.lineTo(x - h / 3, h / 2); ctx.stroke() }
  } else if (s.shape === 'ellipse') {
    ctx.beginPath()
    ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2)
    if (s.fill) { ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1 }
    ctx.stroke()
  } else {
    const o = shapeOutline(s)
    ctx.beginPath(); ctx.moveTo(o[0].x, o[0].y); o.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
    if (s.fill && s.shape !== 'line' && s.shape !== 'arrow') { ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1 }
    ctx.stroke()
    if (s.shape === 'arrow') {
      const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.max(12, s.width * 4)
      ctx.beginPath()
      ctx.moveTo(b.x - L * Math.cos(ang - 0.45), b.y - L * Math.sin(ang - 0.45)); ctx.lineTo(b.x, b.y)
      ctx.lineTo(b.x - L * Math.cos(ang + 0.45), b.y - L * Math.sin(ang + 0.45)); ctx.stroke()
    }
  }
  ctx.restore()
}

/* ------------------------------ strokes ------------------------------ */

export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.tool === 'shape') return drawShape(ctx, s)
  const pts = s.points
  if (!pts.length) return
  ctx.save()
  ctx.lineJoin = 'round'; ctx.strokeStyle = s.color; ctx.fillStyle = s.color

  if (s.tool === 'highlighter') {
    ctx.globalAlpha = HIGHLIGHTER_ALPHA; ctx.lineCap = 'square'; ctx.lineWidth = s.width
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2)
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.stroke(); ctx.restore(); return
  }

  const pen = s.pen ?? 'fountain'
  const o = s.opts ?? DEFAULT_OPTS[pen]
  ctx.lineCap = o.round > 0 ? 'square' : 'round'
  if (pts.length === 1) {
    ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, (s.width * pts[0].w) / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return
  }
  const L = pen === 'brush' ? 6 : pen === 'fountain' ? Math.round((o.sharp / 100) * 8) : 0
  const taper = (i: number) => { if (!L) return 1; const d = Math.min(i, pts.length - 1 - i); return d >= L ? 1 : 0.4 + 0.6 * (d / L) }
  let start = { x: pts[0].x, y: pts[0].y }
  for (let i = 1; i < pts.length; i++) {
    const last = i === pts.length - 1
    const end = last ? { x: pts[i].x, y: pts[i].y } : { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }
    ctx.lineWidth = Math.max(0.3, s.width * ((pts[i - 1].w + pts[i].w) / 2) * taper(i))
    ctx.beginPath(); ctx.moveTo(start.x, start.y)
    if (last) ctx.lineTo(end.x, end.y); else ctx.quadraticCurveTo(pts[i].x, pts[i].y, end.x, end.y)
    ctx.stroke(); start = end
  }
  ctx.restore()
}

/* ------------------------------ geometry ------------------------------ */

export function distToSeg(px: number, py: number, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy
  const t = l2 ? clamp(((px - a.x) * dx + (py - a.y) * dy) / l2, 0, 1) : 0
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy))
}
export function hitStroke(s: Stroke, x: number, y: number, r: number) {
  const reach = r + (s.tool === 'highlighter' ? s.width / 2 : s.width * 0.5)
  const p = strokePts(s)
  if (s.tool === 'shape' && s.fill && s.shape !== 'line' && s.shape !== 'arrow' && s.shape !== 'tape' && inPoly({ x, y }, p)) return true
  if (s.tool === 'shape' && s.shape === 'tape') return distToSeg(x, y, p[0], p[1]) <= reach + s.width / 2
  if (p.length === 1) return Math.hypot(p[0].x - x, p[0].y - y) <= reach
  for (let i = 1; i < p.length; i++) if (distToSeg(x, y, p[i - 1], p[i]) <= reach) return true
  return false
}
export function inPoly(p: Pt, poly: Pt[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}
function densify(pts: StrokePoint[], step: number) {
  const out: StrokePoint[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step))
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n, w: a.w + ((b.w - a.w) * k) / n })
  }
  return out
}
/** Pixel eraser: remove the part of a stroke under the eraser (may split it). null = untouched. */
export function pixelErase(s: Stroke, x: number, y: number, r: number): Stroke[] | null {
  if (s.tool === 'shape') return hitStroke(s, x, y, r) ? [] : null
  const reach = r + s.width * 0.5
  if (!hitStroke(s, x, y, r)) return null
  const d = densify(s.points, Math.max(1, reach / 2))
  const out: Stroke[] = []
  let run: StrokePoint[] = []
  const flush = () => { if (run.length) out.push({ ...s, id: newId(), points: run }); run = [] }
  for (const p of d) (Math.hypot(p.x - x, p.y - y) > reach ? run.push(p) : flush())
  flush()
  return out
}
export function translateStroke(s: Stroke, dx: number, dy: number): Stroke {
  return { ...s, points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) }
}
export function strokeBBox(s: Stroke) {
  const p = strokePts(s)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const q of p) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y) }
  const pad = (s.tool === 'highlighter' ? s.width : s.tool === 'shape' && s.shape === 'tape' ? s.width : s.width * 1.2) / 2
  return { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad }
}

/** Size of a text box as laid out in the DOM (page px), with a fallback estimate. */
export function measureText(t: TextObj) {
  const el = typeof document !== 'undefined' ? (document.querySelector(`[data-text-id="${t.id}"]`) as HTMLElement | null) : null
  if (el && el.offsetHeight) return { w: el.offsetWidth, h: el.offsetHeight }
  return { w: t.w, h: Math.max(1, t.text.split('\n').length) * t.size * t.lh * 1.2 + 8 }
}

export function selectionBBox(c: Content, sel: Selection) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  const add = (a: number, b: number, c2: number, d: number) => { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, c2); y1 = Math.max(y1, d) }
  c.strokes.filter((s) => sel.strokes.includes(s.id)).forEach((s) => { const b = strokeBBox(s); add(b.x0, b.y0, b.x1, b.y1) })
  c.images.filter((i) => sel.images.includes(i.id)).forEach((i) => add(i.x, i.y, i.x + i.w, i.y + i.h))
  c.texts.filter((t) => sel.texts.includes(t.id)).forEach((t) => { const m = measureText(t); add(t.x, t.y, t.x + m.w, t.y + m.h) })
  return x0 === Infinity ? null : { x0, y0, x1, y1 }
}

/** Snap a freehand path to a line or ellipse (draw-and-hold). */
export function recognize(pts: Pt[]): { shape: 'line' | 'ellipse'; a: Pt; b: Pt } | null {
  if (pts.length < 6) return null
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  const a = pts[0], b = pts[pts.length - 1], chord = Math.hypot(b.x - a.x, b.y - a.y)
  if (len > 20 && chord / len > 0.9) return { shape: 'line', a, b }
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const diag = Math.hypot(x1 - x0, y1 - y0)
  if (diag > 30 && chord < diag * 0.3) {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 || 1, ry = (y1 - y0) / 2 || 1
    const rs = pts.map((p) => Math.hypot((p.x - cx) / rx, (p.y - cy) / ry))
    const mean = rs.reduce((q, v) => q + v, 0) / rs.length
    const sd = Math.sqrt(rs.reduce((q, v) => q + (v - mean) ** 2, 0) / rs.length)
    if (sd < 0.16 && mean > 0.8 && mean < 1.2) return { shape: 'ellipse', a: { x: x0, y: y0 }, b: { x: x1, y: y1 } }
  }
  return null
}

/* ------------------------------ shape tool recognition ------------------------------ */

function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts
  const a = pts[0], b = pts[pts.length - 1]
  let idx = 0, dmax = 0
  for (let i = 1; i < pts.length - 1; i++) { const d = distToSeg(pts[i].x, pts[i].y, a, b); if (d > dmax) { dmax = d; idx = i } }
  if (dmax <= eps) return [a, b]
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
}

/**
 * Shapes tool (Goodnotes behaviour): a freehand stroke is replaced by the clean shape it resembles –
 * line, circle / ellipse, triangle, rectangle or polygon. Returns null when nothing fits (stroke is kept as ink).
 */
export function recognizeShape(pts: Pt[]): Pick<Stroke, 'shape' | 'points'> | null {
  if (pts.length < 4) return null
  const P = (p: Pt): StrokePoint => ({ x: p.x, y: p.y, w: 1 })
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const diag = Math.hypot(x1 - x0, y1 - y0)
  if (diag < 12) return null
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  const a = pts[0], b = pts[pts.length - 1], gap = Math.hypot(b.x - a.x, b.y - a.y)
  if (gap / len > 0.9) return { shape: 'line', points: [P(a), P(b)] }
  const closed = gap < Math.max(24, diag * 0.28)
  if (!closed) return null
  // polygon test first: few straight edges
  const loop = [...pts, pts[0]]
  let corners = rdp(loop, diag * 0.07).slice(0, -1)
  // merge vertices that are very close
  corners = corners.filter((p, i) => i === 0 || Math.hypot(p.x - corners[i - 1].x, p.y - corners[i - 1].y) > diag * 0.12)
  if (corners.length > 2 && Math.hypot(corners[0].x - corners[corners.length - 1].x, corners[0].y - corners[corners.length - 1].y) < diag * 0.12) corners.pop()
  // ellipse fit quality
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 || 1, ry = (y1 - y0) / 2 || 1
  const rs = pts.map((p) => Math.hypot((p.x - cx) / rx, (p.y - cy) / ry))
  const mean = rs.reduce((q, v) => q + v, 0) / rs.length
  const sd = Math.sqrt(rs.reduce((q, v) => q + (v - mean) ** 2, 0) / rs.length)
  const roundish = sd < 0.11
  if (corners.length >= 3 && corners.length <= 6 && !(roundish && corners.length > 4)) {
    if (corners.length === 4) {
      const axis = corners.every((p, i) => { const q = corners[(i + 1) % 4]; const ang = Math.abs(Math.atan2(q.y - p.y, q.x - p.x)) % (Math.PI / 2); return Math.min(ang, Math.PI / 2 - ang) < 0.2 })
      if (axis) return { shape: 'rect', points: [P({ x: x0, y: y0 }), P({ x: x1, y: y1 })] }
    }
    return { shape: 'poly', points: corners.map(P) }
  }
  if (sd < 0.2) {
    if (Math.abs(rx - ry) / Math.max(rx, ry) < 0.14) { const r = (rx + ry) / 2; return { shape: 'ellipse', points: [P({ x: cx - r, y: cy - r }), P({ x: cx + r, y: cy + r })] } }
    return { shape: 'ellipse', points: [P({ x: x0, y: y0 }), P({ x: x1, y: y1 })] }
  }
  return null
}
