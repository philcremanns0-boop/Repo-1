import { useEffect, useRef, useState } from 'react'
import {
  drawStroke, hitStroke, inPoly, measureText, newId, pixelErase, pointWeight, recognize, recognizeShape, strokePts,
  type Content, type PenOpts, type PenType, type Pt, type Selection, type ShapeKind, type Stroke,
} from '../lib/draw'
import type { PageStore } from '../store/useNotebook'

export interface CanvasTool {
  kind: 'pen' | 'highlighter' | 'tape' | 'eraser' | 'shape' | 'lasso' | 'none'
  color: string
  width: number
  pen: PenType
  opts: PenOpts
  stab: number
  eraser: 'precision' | 'standard' | 'stroke'
  eraserSize: number
  erFilter: { pen: boolean; highlighter: boolean; tape: boolean }
  shape: ShapeKind
  fill: boolean
  autoShape: boolean
  lassoMode: 'free' | 'rect'
  lassoStrokes: boolean
  lassoObjects: boolean
  /** highlighter draws straight lines (Goodnotes: 'Gerade Linie zeichnen') */
  hlStraight: boolean
}
export interface Ruler { pageId: string; x: number; y: number; angle: number }
export const RULER_LEN = 720
export const RULER_H = 76

interface Props {
  pageId: string
  store: PageStore
  tool: CanvasTool
  zoom: number
  width: number
  height: number
  ruler: Ruler | null
  onSelect: (s: Selection | null) => void
  /** lasso tap on empty space (Goodnotes shows 'Einfügen' there) */
  onLassoTap?: (p: Pt, client: { x: number; y: number }) => void
  onActivate: () => void
}
interface Gesture {
  pointerId: number
  kind: 'draw' | 'erase' | 'lasso'
  stroke?: Stroke
  base?: Content
  erased?: Content
  lastErase?: Pt
  lastW: number
  lastT: number
  lastP: Pt
  filt?: Pt
  lasso?: Pt[]
  hold?: ReturnType<typeof setTimeout>
  snapped?: boolean
  line?: { o: Pt; d: Pt }
  shapeTool?: boolean
  straight?: boolean
}

const category = (s: Stroke): 'pen' | 'highlighter' | 'tape' => (s.tool === 'highlighter' ? 'highlighter' : s.tool === 'shape' && s.shape === 'tape' ? 'tape' : 'pen')
/** Goodnotes-style eraser styles: stroke = whole stroke, standard = a short segment, precision = only what is inside the circle. */
function eraseStep(c: Content, x: number, y: number, r: number, kind: CanvasTool['eraser'], filter: CanvasTool['erFilter']): Content {
  let changed = false
  const strokes: Stroke[] = []
  for (const s of c.strokes) {
    if (!filter[category(s)]) { strokes.push(s); continue }
    if (kind === 'stroke') { if (hitStroke(s, x, y, r)) changed = true; else strokes.push(s) }
    else { const res = pixelErase(s, x, y, kind === 'standard' ? r * 1.8 + 6 : r); if (res === null) strokes.push(s); else { changed = true; strokes.push(...res) } }
  }
  return changed ? { ...c, strokes } : c
}

export default function NoteCanvas({ pageId, store, tool, zoom, width, height, ruler, onSelect, onActivate, onLassoTap }: Props) {
  const baseRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const act = useRef<Gesture | null>(null)
  const raf = useRef(0)
  const [penSeen, setPenSeen] = useState(false)
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const scale = Math.min(zoom * dpr, 3)
  const cfg = useRef({ tool, zoom, store, ruler, pageId })
  cfg.current = { tool, zoom, store, ruler, pageId }
  const drawing = tool.kind !== 'none'

  const setup = (c: HTMLCanvasElement) => {
    const w = Math.round(width * scale), h = Math.round(height * scale)
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h }
    const ctx = c.getContext('2d')!
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)
    return ctx
  }
  useEffect(() => {
    const ctx = setup(baseRef.current!)
    for (const s of store.content.strokes) drawStroke(ctx, s)
    if (!act.current?.stroke) setup(liveRef.current!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.content.strokes, scale, width, height])

  const toPage = (e: { clientX: number; clientY: number }): Pt => {
    const r = baseRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / cfg.current.zoom, y: (e.clientY - r.top) / cfg.current.zoom }
  }
  const renderLive = () => {
    raf.current = 0
    const a = act.current
    if (!a) return
    const ctx = setup(liveRef.current!)
    if (a.stroke) drawStroke(ctx, a.stroke)
    if (a.lasso && a.lasso.length > 1) {
      ctx.save(); ctx.setLineDash([7, 6]); ctx.lineWidth = 1.6 / cfg.current.zoom * 1.2; ctx.strokeStyle = '#2f8cf0'; ctx.fillStyle = 'rgba(47,140,240,.08)'
      ctx.beginPath(); ctx.moveTo(a.lasso[0].x, a.lasso[0].y); a.lasso.slice(1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
    }
    if (a.kind === 'erase' && a.lastErase) ring(ctx, a.lastErase)
  }
  const ring = (ctx: CanvasRenderingContext2D, p: Pt) => {
    ctx.save(); ctx.strokeStyle = 'rgba(120,120,128,.9)'; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2 / cfg.current.zoom
    ctx.beginPath(); ctx.arc(p.x, p.y, cfg.current.tool.eraserSize / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore()
  }
  const schedule = () => { raf.current ||= requestAnimationFrame(renderLive) }

  const eraseAt = (p: Pt) => {
    const a = act.current!
    const t = cfg.current.tool
    const r = t.eraserSize / 2
    const from = a.lastErase ?? p
    const n = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / Math.max(1, r / 2)))
    let cur = a.erased ?? cfg.current.store.content
    const before = cur
    for (let i = 1; i <= n; i++) cur = eraseStep(cur, from.x + ((p.x - from.x) * i) / n, from.y + ((p.y - from.y) * i) / n, r, t.eraser, t.erFilter)
    a.lastErase = p
    if (cur !== before) { a.erased = cur; cfg.current.store.live(() => cur) }
  }

  /** Constrain to ruler edge (pen/highlighter starting next to the ruler). */
  const rulerLine = (p: Pt) => {
    const r = cfg.current.ruler
    if (!r || r.pageId !== cfg.current.pageId) return undefined
    const d = { x: Math.cos(r.angle), y: Math.sin(r.angle) }, nrm = { x: -d.y, y: d.x }
    const rel = { x: p.x - r.x, y: p.y - r.y }
    const along = rel.x * d.x + rel.y * d.y, off = rel.x * nrm.x + rel.y * nrm.y
    if (Math.abs(along) > RULER_LEN / 2 + 30 || Math.abs(off) > RULER_H / 2 + 36) return undefined
    const s = off >= 0 ? 1 : -1
    return { o: { x: r.x + nrm.x * s * (RULER_H / 2), y: r.y + nrm.y * s * (RULER_H / 2) }, d }
  }
  const project = (p: Pt, l: { o: Pt; d: Pt }): Pt => {
    const t = (p.x - l.o.x) * l.d.x + (p.y - l.o.y) * l.d.y
    return { x: l.o.x + l.d.x * t, y: l.o.y + l.d.y * t }
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onActivate()
    if (act.current) {
      // a second finger turns the gesture into pinch / multi-finger tap: drop the stroke in progress
      if (e.pointerType === 'touch' && act.current.pointerId !== e.pointerId) {
        const a = act.current
        act.current = null; clearTimeout(a.hold); cancelAnimationFrame(raf.current); raf.current = 0
        if (a.kind === 'erase' && a.base) { const b = a.base; cfg.current.store.live(() => b) }
        setup(liveRef.current!)
      }
      return
    }
    if (!drawing) return
    if (e.pointerType === 'pen') setPenSeen(true)
    else if (penSeen && e.pointerType === 'touch') return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = tool
    const p = toPage(e)
    const a: Gesture = { pointerId: e.pointerId, kind: 'draw', lastW: 0, lastT: performance.now(), lastP: p }
    act.current = a
    if (t.kind === 'eraser') { a.kind = 'erase'; a.base = store.content; eraseAt(p); schedule(); return }
    if (t.kind === 'lasso') { a.kind = 'lasso'; a.lasso = [p]; onSelect(null); return }
    const w = t.kind === 'pen' ? pointWeight(t.pen, t.opts, e.pointerType, e.pressure, 0, 0) : 1
    a.lastW = w
    a.filt = p
    const id = newId()
    if (t.kind === 'pen') {
      a.line = rulerLine(p)
      a.stroke = { id, tool: 'pen', pen: t.pen, opts: { ...t.opts }, color: t.color, width: t.width, points: [{ ...p, w }] }
    } else if (t.kind === 'highlighter') {
      a.line = rulerLine(p)
      a.straight = t.hlStraight && !a.line
      a.stroke = { id, tool: 'highlighter', color: t.color, width: t.width, points: a.straight ? [{ ...p, w: 1 }, { ...p, w: 1 }] : [{ ...p, w: 1 }] }
    } else if (t.kind === 'tape') {
      a.stroke = { id, tool: 'shape', shape: 'tape', color: t.color, width: t.width, points: [{ ...p, w: 1 }, { ...p, w: 1 }] }
    } else {
      // Shapes tool: draw freehand, recognised into a clean shape on lift (Goodnotes behaviour)
      a.shapeTool = true
      a.stroke = { id, tool: 'pen', pen: 'ballpoint', opts: { sharp: 0, press: 0, round: 0, speed: false }, color: t.color, width: t.width, points: [{ ...p, w: 1 }] }
    }
    schedule()
  }

  const armHold = (a: Gesture) => {
    clearTimeout(a.hold)
    if (!cfg.current.tool.autoShape || !a.stroke || a.stroke.tool === 'shape' || a.line) return
    a.hold = setTimeout(() => {
      const s = a.stroke
      if (!s || act.current !== a || a.snapped) return
      const r = recognize(s.points)
      if (!r) return
      a.snapped = true
      a.stroke = { ...s, tool: 'shape', shape: r.shape, points: [{ ...r.a, w: 1 }, { ...r.b, w: 1 }], pen: undefined, opts: undefined }
      schedule()
    }, 550)
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = act.current
    if (!a) {
      if (tool.kind === 'eraser' && e.pointerType !== 'touch') { // hover ring
        const ctx = setup(liveRef.current!); ring(ctx, toPage(e))
      }
      return
    }
    if (a.pointerId !== e.pointerId) return
    const evs = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of evs.length ? evs : [e.nativeEvent]) {
      let p = toPage(ev)
      if (a.kind === 'erase') { eraseAt(p); continue }
      if (a.kind === 'lasso') {
        if (tool.lassoMode === 'rect') { const s = a.lasso![0]; a.lasso = [s, { x: p.x, y: s.y }, p, { x: s.x, y: p.y }] }
        else a.lasso!.push(p)
        continue
      }
      const s = a.stroke!
      if (a.straight) { s.points[1] = { ...p, w: 1 }; continue }
      if (s.tool === 'shape' && !a.snapped) { s.points[1] = { ...p, w: 1 }; continue }
      if (a.snapped) { if (s.shape === 'line') s.points[1] = { ...p, w: 1 }; continue }
      if (a.line) p = project(p, a.line)
      else if (tool.stab > 0) { // stroke stabilisation: low-pass filter
        const k = 1 - 0.88 * (tool.stab / 100)
        a.filt = { x: a.filt!.x + (p.x - a.filt!.x) * k, y: a.filt!.y + (p.y - a.filt!.y) * k }
        p = a.filt
      }
      const last = s.points[s.points.length - 1]
      const d = Math.hypot(p.x - last.x, p.y - last.y)
      if (d < 0.6) continue
      const now = performance.now()
      const speed = d / Math.max(1, now - a.lastT)
      a.lastT = now
      if (s.tool === 'pen') a.lastW = pointWeight(s.pen!, s.opts!, ev.pointerType, ev.pressure, speed, a.lastW)
      s.points.push({ ...p, w: s.tool === 'pen' ? a.lastW : 1 })
      a.lastP = p
    }
    if (a.kind !== 'lasso' || true) schedule()
    if (a.stroke) armHold(a)
  }

  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = act.current
    if (!a || a.pointerId !== e.pointerId) return
    act.current = null
    clearTimeout(a.hold)
    cancelAnimationFrame(raf.current); raf.current = 0
    const st = cfg.current.store
    if (a.kind === 'draw' && a.stroke) {
      let s = a.stroke
      if (a.shapeTool) {
        const r = recognizeShape(s.points)
        if (r) s = { id: s.id, tool: 'shape', shape: r.shape, points: r.points, color: s.color, width: s.width, fill: cfg.current.tool.fill }
      }
      if (s.tool === 'shape' && s.points.length === 2 && Math.hypot(s.points[1].x - s.points[0].x, s.points[1].y - s.points[0].y) < 2) { setup(liveRef.current!); return }
      st.commit((c) => ({ ...c, strokes: [...c.strokes, s] }))
    } else if (a.kind === 'erase') {
      if (a.erased && a.base) st.checkpoint(a.base)
      setup(liveRef.current!)
    } else if (a.kind === 'lasso') {
      const poly = a.lasso ?? []
      setup(liveRef.current!)
      const pxs = poly.map((q) => q.x), pys = poly.map((q) => q.y)
      if (poly.length && Math.max(...pxs) - Math.min(...pxs) < 6 && Math.max(...pys) - Math.min(...pys) < 6) { onLassoTap?.(poly[0], { x: e.clientX, y: e.clientY }); return }
      if (poly.length < 3) return
      const c = st.content, t = cfg.current.tool
      const sel: Selection = { pageId: cfg.current.pageId, strokes: [], texts: [], images: [] }
      if (t.lassoStrokes) for (const s of c.strokes) {
        const pts = strokePts(s)
        if (pts.filter((q) => inPoly(q, poly)).length >= Math.max(1, pts.length * 0.5)) sel.strokes.push(s.id)
      }
      if (t.lassoObjects) {
        for (const i of c.images) if (inPoly({ x: i.x + i.w / 2, y: i.y + i.h / 2 }, poly)) sel.images.push(i.id)
        for (const x of c.texts) { const m = measureText(x); if (inPoly({ x: x.x + m.w / 2, y: x.y + m.h / 2 }, poly)) sel.texts.push(x.id) }
      }
      onSelect(sel.strokes.length + sel.texts.length + sel.images.length ? sel : null)
    }
  }

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: penSeen ? 'pan-x pan-y pinch-zoom' : drawing ? 'none' : 'auto', cursor: drawing ? 'crosshair' : 'default', pointerEvents: drawing ? 'auto' : 'none' }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={finish} onPointerCancel={finish}
      onPointerLeave={() => { if (!act.current && tool.kind === 'eraser') setup(liveRef.current!) }}
    >
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={liveRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
}
