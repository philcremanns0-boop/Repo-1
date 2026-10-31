import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from './glyphs'
import { RULER_H, RULER_LEN, type Ruler } from './NoteCanvas'
import { useT } from '../context/Settings'
import type { ZoomRegion } from './editorTypes'

/* ----------------------------- Ruler (page space) ----------------------------- */
const MM = 96 / 25.4
const SNAPS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180].flatMap((d) => [d, -d])
const snapAngle = (rad: number) => {
  const deg = (rad * 180) / Math.PI
  for (const s of SNAPS) if (Math.abs(deg - s) < 2.5) return (s * Math.PI) / 180
  return rad
}
const norm = (rad: number) => { let d = ((rad * 180) / Math.PI) % 180; if (d > 90) d -= 180; if (d < -90) d += 180; return d }

/**
 * Goodnotes ruler: translucent bar with mm/cm scale and live angle readout.
 * One finger / mouse drags it, two fingers move + rotate it (snaps to 0°, 15°, 30°, 45° …),
 * the round handle rotates with a mouse. Pen and highlighter strokes that start next to an edge follow it.
 */
export function RulerOverlay({ ruler, zoom, onChange, onClose }: { ruler: Ruler; zoom: number; onChange: (r: Ruler) => void; onClose: () => void }) {
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const gest = useRef<null | { base: Ruler; a0: number; m0: { x: number; y: number } }>(null)
  const [rotating, setRotating] = useState(false)
  const start = (e: React.PointerEvent, mode: 'move' | 'rot') => {
    e.stopPropagation(); e.preventDefault()
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.current.size === 2) {
        const [p, q] = [...touches.current.values()]
        gest.current = { base: ruler, a0: Math.atan2(q.y - p.y, q.x - p.x), m0: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 } }
        setRotating(true)
      }
    }
    const base = ruler, sx = e.clientX, sy = e.clientY
    const host = (e.currentTarget as HTMLElement).closest('[data-page-inner]')!.getBoundingClientRect()
    const cx = host.left + base.x * zoom, cy = host.top + base.y * zoom
    const a0 = Math.atan2(sy - cy, sx - cx)
    if (mode === 'rot') setRotating(true)
    const mv = (ev: PointerEvent) => {
      if (ev.pointerType === 'touch' && touches.current.has(ev.pointerId)) touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const g = gest.current
      if (g && touches.current.size >= 2) {
        const [p, q] = [...touches.current.values()]
        const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
        onChange({ ...g.base, x: g.base.x + (m.x - g.m0.x) / zoom, y: g.base.y + (m.y - g.m0.y) / zoom, angle: snapAngle(g.base.angle + Math.atan2(q.y - p.y, q.x - p.x) - g.a0) })
        return
      }
      if (ev.pointerId !== e.pointerId) return
      if (mode === 'move') onChange({ ...base, x: base.x + (ev.clientX - sx) / zoom, y: base.y + (ev.clientY - sy) / zoom })
      else onChange({ ...base, angle: snapAngle(base.angle + Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0) })
    }
    const up = (ev: PointerEvent) => {
      touches.current.delete(ev.pointerId)
      if (touches.current.size < 2) gest.current = null
      if (ev.pointerId !== e.pointerId) return
      setRotating(false)
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
  }
  const mm = Math.floor(RULER_LEN / MM)
  const deg = Math.round(Math.abs(norm(ruler.angle)))
  return (
    <div className="absolute" style={{ left: ruler.x, top: ruler.y, width: 0, height: 0, zIndex: 6 }}>
      <div data-ruler className="absolute cursor-move rounded-[6px] shadow-[0_4px_14px_rgba(0,0,0,.18),0_0_0_.5px_rgba(0,0,0,.25)]"
        style={{ width: RULER_LEN, height: RULER_H, left: -RULER_LEN / 2, top: -RULER_H / 2, transform: `rotate(${ruler.angle}rad)`, background: 'rgba(242,242,247,.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', touchAction: 'none' }}
        onPointerDown={(e) => start(e, 'move')}>
        <svg width={RULER_LEN} height={RULER_H} className="pointer-events-none absolute inset-0">
          {Array.from({ length: mm + 1 }, (_, i) => {
            const x = 8 + i * MM, h = i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 6
            return <g key={i}><line x1={x} x2={x} y1={0} y2={h} stroke="#3c3c43" strokeWidth=".8" /><line x1={x} x2={x} y1={RULER_H} y2={RULER_H - h} stroke="#3c3c43" strokeWidth=".8" /></g>
          })}
          {Array.from({ length: Math.floor(mm / 10) + 1 }, (_, i) => i).filter((i) => i > 0).map((i) => (
            <text key={i} x={8 + i * 10 * MM} y={26} fontSize="9" textAnchor="middle" fill="#3c3c43" fontFamily="-apple-system, sans-serif">{i}</text>
          ))}
        </svg>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-2.5 py-0.5 text-[13px] font-semibold tabular-nums text-white" style={{ transform: `translate(-50%,-50%) rotate(${-ruler.angle}rad)`, opacity: rotating || deg ? 1 : 0.75 }}>{deg}°</div>
        <button aria-label="Lineal schließen" className="absolute top-1/2 flex items-center justify-center rounded-full bg-black/55 text-white" style={{ width: 30 / zoom, height: 30 / zoom, right: 40 / zoom, marginTop: -15 / zoom }} onPointerDown={(e) => e.stopPropagation()} onClick={onClose}><X size={14 / zoom} /></button>
        <div aria-label="Lineal drehen" className="absolute top-1/2 cursor-grab rounded-full border-white bg-gn-ui-lasso shadow" style={{ width: 30 / zoom, height: 30 / zoom, right: -15 / zoom, marginTop: -15 / zoom, borderWidth: 3 / zoom }} onPointerDown={(e) => start(e, 'rot')} />
      </div>
    </div>
  )
}

/* ----------------------------- Zoom-Ansicht ----------------------------- */
/** Blue frame on the page marking the region shown in the zoom panel – drag to move. */
export function ZoomFrame({ region, zoom, pageW, pageH, onChange }: { region: ZoomRegion; zoom: number; pageW: number; pageH: number; onChange: (r: ZoomRegion) => void }) {
  const drag = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault()
    const sx = e.clientX, sy = e.clientY, b = region
    const mv = (ev: PointerEvent) => onChange({ ...b, x: Math.max(0, Math.min(pageW - b.w, b.x + (ev.clientX - sx) / zoom)), y: Math.max(0, Math.min(pageH - b.h, b.y + (ev.clientY - sy) / zoom)) })
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  return (
    <div data-zoomframe className="absolute cursor-move" onPointerDown={drag}
      style={{ left: region.x, top: region.y, width: region.w, height: region.h, border: `${2 / zoom}px solid #1a82e0`, background: 'rgba(26,130,224,.06)', borderRadius: 3 / zoom, zIndex: 6, touchAction: 'none' }}>
      <div className="absolute right-0 top-0 h-full" style={{ width: region.w * 0.18, background: 'rgba(26,130,224,.10)' }} />
    </div>
  )
}

/* ----------------------------- Timer ----------------------------- */
export function TimerWidget({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [mins, setMins] = useState(5)
  const [left, setLeft] = useState(300)
  const [run, setRun] = useState(false)
  const pos = useRef({ x: 24, y: 130 })
  const [, force] = useState(0)
  useEffect(() => {
    if (!run) return
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { setRun(false); try { new AudioContext().resume() } catch { /* ignore */ } return 0 } return l - 1 }), 1000)
    return () => clearInterval(id)
  }, [run])
  const drag = (e: React.PointerEvent) => {
    const sx = e.clientX - pos.current.x, sy = e.clientY - pos.current.y
    const mv = (ev: PointerEvent) => { pos.current = { x: ev.clientX - sx, y: ev.clientY - sy }; force((n) => n + 1) }
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')
  return (
    <div className="fixed z-[55] w-[210px] rounded-[22px] bg-float p-3 text-ink shadow-pill backdrop-blur" style={{ left: pos.current.x, top: pos.current.y }}>
      <div className="flex cursor-move items-center justify-between" onPointerDown={drag} style={{ touchAction: 'none' }}>
        <span className="text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Zeitmesser')}</span>
        <button aria-label={t('Schließen')} onPointerDown={(e) => e.stopPropagation()} onClick={onClose}><X size={16} /></button>
      </div>
      <div className={`py-2 text-center text-[44px] font-semibold tabular-nums ${left === 0 ? 'text-danger' : ''}`}>{mm}:{ss}</div>
      <div className="flex items-center justify-between">
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-chip" onClick={() => { setRun(false); setLeft(mins * 60) }} aria-label="Reset"><RotateCcw size={16} /></button>
        <button className="flex h-10 w-16 items-center justify-center rounded-full bg-accent text-white" onClick={() => { if (left === 0) setLeft(mins * 60); setRun((r) => !r) }}>{run ? <Pause size={18} /> : <Play size={18} />}</button>
        <div className="flex items-center gap-1 text-[14px]">
          <button className="h-7 w-7 rounded-full bg-chip" onClick={() => { const m = Math.max(1, mins - 1); setMins(m); if (!run) setLeft(m * 60) }}>−</button>
          <span className="w-8 text-center tabular-nums">{mins}′</span>
          <button className="h-7 w-7 rounded-full bg-chip" onClick={() => { const m = Math.min(180, mins + 1); setMins(m); if (!run) setLeft(m * 60) }}>+</button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Zoom lens ----------------------------- */
export function Magnifier({ onClose }: { onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [p, setP] = useState({ x: 300, y: 300 })
  useEffect(() => {
    let raf = 0
    const draw = (x: number, y: number) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const c = cv.current; if (!c) return
        const ctx = c.getContext('2d')!; const S = 3
        ctx.clearRect(0, 0, c.width, c.height)
        const pageEl = (document.elementsFromPoint(x, y).find((el) => (el as HTMLElement).dataset?.page) as HTMLElement | undefined)
        if (!pageEl) return
        const r = pageEl.getBoundingClientRect()
        ctx.fillStyle = getComputedStyle(pageEl.querySelector('[data-page-inner]') as HTMLElement).backgroundColor; ctx.fillRect(0, 0, c.width, c.height)
        pageEl.querySelectorAll('canvas').forEach((src) => {
          const k = src.width / r.width, rad = c.width / 2
          ctx.drawImage(src, (x - r.left - rad / S) * k, (y - r.top - rad / S) * k, (c.width / S) * k, (c.height / S) * k, 0, 0, c.width, c.height)
        })
      })
    }
    const mv = (e: PointerEvent) => { setP({ x: e.clientX, y: e.clientY }); draw(e.clientX, e.clientY) }
    window.addEventListener('pointermove', mv)
    return () => { window.removeEventListener('pointermove', mv); cancelAnimationFrame(raf) }
  }, [])
  return (
    <div className="pointer-events-none fixed z-[55]" style={{ left: p.x + 24, top: p.y - 190 }}>
      <canvas ref={cv} width={220} height={220} className="rounded-full border-4 border-white bg-white shadow-popover" />
      <button className="pointer-events-auto absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-canvas shadow" onClick={onClose} aria-label="Schließen"><X size={14} /></button>
    </div>
  )
}

/* ----------------------------- Toast ----------------------------- */
export function Toast({ msg, onClose, persistent }: { msg: string; onClose: () => void; persistent?: boolean }) {
  useEffect(() => { if (persistent) return; const id = setTimeout(onClose, 3600); return () => clearTimeout(id) }, [msg, persistent, onClose])
  return (
    <div className="fixed bottom-5 left-1/2 z-[59] flex max-w-[min(92vw,820px)] -translate-x-1/2 items-center gap-3 rounded-full bg-gn-ui-toast px-5 py-3.5 text-[16px] text-white shadow-popover">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5v.2" /></svg>
      <span>{msg}</span>
      <button aria-label="Schließen" onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"><X size={15} /></button>
    </div>
  )
}

/* ----------------------------- Laser pointer ----------------------------- */
export function LaserLayer({ color, trail, size }: { color: string; trail: boolean; size: number }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const pts = useRef<{ x: number; y: number; t: number }[]>([])
  const down = useRef(false)
  const pos = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const c = cv.current!
    const fit = () => { c.width = c.clientWidth; c.height = c.clientHeight }
    fit(); window.addEventListener('resize', fit)
    let raf = 0
    const loop = () => {
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, c.width, c.height)
      const now = performance.now()
      pts.current = pts.current.filter((p) => now - p.t < 900)
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      if (trail) for (let i = 1; i < pts.current.length; i++) {
        const a = pts.current[i - 1], b = pts.current[i]
        ctx.strokeStyle = color; ctx.globalAlpha = Math.max(0, 1 - (now - b.t) / 900) * 0.7; ctx.lineWidth = size
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      }
      ctx.globalAlpha = 1
      if (pos.current && down.current) {
        const g = ctx.createRadialGradient(pos.current.x, pos.current.y, 0, pos.current.x, pos.current.y, size * 2.6)
        g.addColorStop(0, color); g.addColorStop(0.4, color + 'aa'); g.addColorStop(1, color + '00')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pos.current.x, pos.current.y, size * 2.6, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pos.current.x, pos.current.y, size * 0.45, 0, Math.PI * 2); ctx.fill()
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [color, trail, size])
  const at = (e: React.PointerEvent) => { const r = cv.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() } }
  return (
    <canvas ref={cv} className="absolute inset-0 z-20 h-full w-full cursor-none" style={{ touchAction: 'none' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); down.current = true; pos.current = at(e); pts.current.push(pos.current as never) }}
      onPointerMove={(e) => { if (!down.current) return; const p = at(e); pos.current = p; pts.current.push(p) }}
      onPointerUp={() => { down.current = false }} onPointerCancel={() => { down.current = false }} />
  )
}
