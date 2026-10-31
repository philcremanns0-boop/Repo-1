import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * Data model — every line is plain data, so colour / width can be
 * changed at any time and the canvas simply re-renders from state.
 * ------------------------------------------------------------------ */

export interface StrokePoint {
  x: number // page-space px
  y: number
  /** width multiplier derived from stylus pressure (1 for mouse / touch) */
  w: number
}

export interface Stroke {
  id: number
  tool: 'pen' | 'highlighter'
  color: string
  /** base width in page-space px */
  width: number
  points: StrokePoint[]
}

export type DrawTool = 'pen' | 'highlighter' | 'eraser'

export const WIDTHS: Record<DrawTool, [number, number, number]> = {
  pen: [1.5, 3, 5.5],
  highlighter: [10, 16, 24],
  eraser: [10, 20, 36],
}
export const HIGHLIGHTER_ALPHA = 0.35

/** What the canvas needs from the notebook store (current page only). */
export interface StrokeStore {
  strokes: Stroke[]
  /** commit a finished stroke as one undoable step */
  add: (s: Stroke) => void
  /** replace strokes without recording history (live erase preview) */
  preview: (next: Stroke[]) => void
  /** record `base` as the undo step for the current strokes (end of erase) */
  checkpoint: (base: Stroke[]) => void
  undo: () => void
  redo: () => void
}

/* ------------------------------------------------------------------ *
 * Rendering — midpoint quadratic Béziers give C1-smooth curves through
 * noisy pointer samples (no jagged polylines).
 * ------------------------------------------------------------------ */

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const pts = s.points
  if (!pts.length) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color

  if (s.tool === 'highlighter') {
    // One single path at constant width + one alpha → no darker self-overlap.
    ctx.globalAlpha = HIGHLIGHTER_ALPHA
    ctx.lineWidth = s.width
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.01, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2
      const my = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
    }
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.stroke()
    ctx.restore()
    return
  }

  // Pen: per-segment width for pressure sensitivity (opaque, so overlaps are invisible)
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, (s.width * pts[0].w) / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return
  }
  let start = { x: pts[0].x, y: pts[0].y }
  for (let i = 1; i < pts.length; i++) {
    const last = i === pts.length - 1
    const end = last
      ? { x: pts[i].x, y: pts[i].y }
      : { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }
    ctx.lineWidth = s.width * ((pts[i - 1].w + pts[i].w) / 2)
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    if (last) ctx.lineTo(end.x, end.y)
    else ctx.quadraticCurveTo(pts[i].x, pts[i].y, end.x, end.y)
    ctx.stroke()
    start = end
  }
  ctx.restore()
}

function distToSegment(px: number, py: number, a: StrokePoint, b: StrokePoint) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2)) : 0
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy))
}

function hits(s: Stroke, x: number, y: number, r: number) {
  const reach = r + (s.tool === 'highlighter' ? s.width / 2 : (s.width * 0.5))
  if (s.points.length === 1) return Math.hypot(s.points[0].x - x, s.points[0].y - y) <= reach
  for (let i = 1; i < s.points.length; i++) {
    if (distToSegment(x, y, s.points[i - 1], s.points[i]) <= reach) return true
  }
  return false
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

interface Props {
  store: StrokeStore
  tool: string
  color: string
  /** thickness preset index 0..2 */
  thickness: 0 | 1 | 2
  width: number // page width (px)
  height: number
  zoom: number
}

let lastId = 0
/** Unique, monotonically increasing ids that survive reloads. */
const newStrokeId = () => (lastId = Math.max(Date.now() * 1000, lastId + 1))

interface ActiveGesture {
  pointerId: number
  stroke?: Stroke
  eraseBase?: Stroke[]
  erased?: Stroke[]
  lastW: number
  lastErase?: { x: number; y: number }
}

export default function NoteCanvas({ store, tool, color, thickness, width, height, zoom }: Props) {
  const baseRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef<HTMLCanvasElement>(null)
  const active = useRef<ActiveGesture | null>(null)
  const raf = useRef(0)
  const [penSeen, setPenSeen] = useState(false)

  const drawing = tool === 'pen' || tool === 'highlighter' || tool === 'eraser'
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1

  // keep latest props accessible from stable handlers
  const cfg = useRef({ tool, color, thickness, zoom, store })
  cfg.current = { tool, color, thickness, zoom, store }

  const setup = (c: HTMLCanvasElement) => {
    const s = zoom * dpr
    const w = Math.round(width * s)
    const h = Math.round(height * s)
    if (c.width !== w || c.height !== h) {
      c.width = w
      c.height = h
    }
    const ctx = c.getContext('2d')!
    ctx.setTransform(s, 0, 0, s, 0, 0)
    ctx.clearRect(0, 0, width, height)
    return ctx
  }

  // Re-render committed strokes whenever data / zoom changes.
  useEffect(() => {
    const ctx = setup(baseRef.current!)
    for (const s of store.strokes) drawStroke(ctx, s)
    // clear the live layer after the base has caught up (no flicker)
    if (!active.current?.stroke) setup(liveRef.current!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.strokes, zoom, dpr, width, height])

  // Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || (e.target as HTMLElement)?.isContentEditable) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        e.shiftKey ? cfg.current.store.redo() : cfg.current.store.undo()
      } else if (k === 'y') {
        e.preventDefault()
        cfg.current.store.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toPage = (e: { clientX: number; clientY: number }) => {
    const r = baseRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / cfg.current.zoom, y: (e.clientY - r.top) / cfg.current.zoom }
  }

  const renderLive = () => {
    raf.current = 0
    const st = active.current?.stroke
    if (!st) return
    drawStroke(setup(liveRef.current!), st)
  }

  const factor = (e: PointerEvent | React.PointerEvent, prev: number) => {
    if (e.pointerType !== 'pen') return 1
    const p = e.pressure > 0 ? e.pressure : 0.5
    const target = 0.4 + 1.2 * p
    return prev ? prev * 0.6 + target * 0.4 : target // low-pass for stable width
  }

  /**
   * Stroke eraser: delete every whole stroke touched by the eraser. The path
   * between consecutive samples is interpolated so fast swipes can't skip a stroke.
   */
  const eraseAt = (x: number, y: number) => {
    const a = active.current!
    const r = WIDTHS.eraser[cfg.current.thickness] / 2
    const from = a.lastErase ?? { x, y }
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (r / 2)))
    let cur = a.erased ?? cfg.current.store.strokes
    for (let i = 1; i <= steps; i++) {
      const px = from.x + ((x - from.x) * i) / steps
      const py = from.y + ((y - from.y) * i) / steps
      cur = cur.filter((s) => !hits(s, px, py, r))
    }
    a.lastErase = { x, y }
    if (cur.length !== (a.erased ?? cfg.current.store.strokes).length) {
      a.erased = cur
      cfg.current.store.preview(cur)
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || active.current) return
    if (e.pointerType === 'pen') setPenSeen(true)
    else if (penSeen && e.pointerType === 'touch') return // palm / finger → scroll
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = toPage(e)
    const a: ActiveGesture = { pointerId: e.pointerId, lastW: 0 }
    active.current = a
    if (tool === 'eraser') {
      a.eraseBase = store.strokes
      eraseAt(x, y)
    } else {
      a.lastW = factor(e, 0)
      a.stroke = {
        id: newStrokeId(),
        tool: tool as 'pen' | 'highlighter',
        color: COLOR_HEX[color] ?? color,
        width: WIDTHS[tool as DrawTool][thickness],
        points: [{ x, y, w: tool === 'pen' ? a.lastW : 1 }],
      }
      raf.current ||= requestAnimationFrame(renderLive)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = active.current
    if (!a || a.pointerId !== e.pointerId) return
    // coalesced events = every sampled stylus point, not just one per frame
    const evs = e.nativeEvent.getCoalescedEvents?.() ?? []
    const list = evs.length ? evs : [e.nativeEvent]
    for (const ev of list) {
      const { x, y } = toPage(ev)
      if (a.stroke) {
        const pts = a.stroke.points
        const last = pts[pts.length - 1]
        if (Math.hypot(x - last.x, y - last.y) < 0.6) continue // drop jitter
        a.lastW = factor(ev, a.lastW)
        pts.push({ x, y, w: a.stroke.tool === 'pen' ? a.lastW : 1 })
      } else eraseAt(x, y)
    }
    if (a.stroke) raf.current ||= requestAnimationFrame(renderLive)
  }

  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = active.current
    if (!a || a.pointerId !== e.pointerId) return
    active.current = null
    cancelAnimationFrame(raf.current)
    raf.current = 0
    if (a.stroke) store.add(a.stroke)
    else if (a.erased && a.eraseBase) store.checkpoint(a.eraseBase)
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        touchAction: penSeen ? 'pan-x pan-y pinch-zoom' : drawing ? 'none' : 'auto',
        cursor: drawing ? 'crosshair' : 'default',
        pointerEvents: drawing ? 'auto' : 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      <canvas ref={baseRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={liveRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  )
}

const COLOR_HEX: Record<string, string> = {
  black: '#1c1c1e',
  blue: '#1f6fe5',
  red: '#e5372e',
}
