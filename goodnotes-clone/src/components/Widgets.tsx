import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from './glyphs'
import { RULER_H, RULER_LEN, type Ruler } from './NoteCanvas'
import { useT } from '../context/Settings'

/* ----------------------------- Ruler (page space) ----------------------------- */
export function RulerOverlay({ ruler, zoom, onChange, onClose }: { ruler: Ruler; zoom: number; onChange: (r: Ruler) => void; onClose: () => void }) {
  const start = (e: React.PointerEvent, mode: 'move' | 'rot') => {
    e.stopPropagation(); e.preventDefault()
    const base = ruler, sx = e.clientX, sy = e.clientY
    const host = (e.currentTarget as HTMLElement).closest('[data-page-inner]')!.getBoundingClientRect()
    const cx = host.left + base.x * zoom, cy = host.top + base.y * zoom
    const mv = (ev: PointerEvent) => {
      if (mode === 'move') onChange({ ...base, x: base.x + (ev.clientX - sx) / zoom, y: base.y + (ev.clientY - sy) / zoom })
      else onChange({ ...base, angle: Math.atan2(ev.clientY - cy, ev.clientX - cx) - 0 })
    }
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  const ticks = Array.from({ length: Math.floor(RULER_LEN / 12) + 1 }, (_, i) => i)
  return (
    <div className="absolute" style={{ left: ruler.x, top: ruler.y, width: 0, height: 0, zIndex: 6 }}>
      <div className="absolute cursor-move rounded-md border border-black/20 shadow-lg"
        style={{ width: RULER_LEN, height: RULER_H, left: -RULER_LEN / 2, top: -RULER_H / 2, transform: `rotate(${ruler.angle}rad)`, background: 'rgba(255,255,255,.62)', backdropFilter: 'blur(2px)', touchAction: 'none' }}
        onPointerDown={(e) => start(e, 'move')}>
        <svg width={RULER_LEN} height={RULER_H} className="pointer-events-none absolute inset-0">
          {ticks.map((i) => <line key={i} x1={i * 12} x2={i * 12} y1={0} y2={i % 5 === 0 ? 16 : 8} stroke="#444" strokeWidth="1" />)}
          {ticks.filter((i) => i % 5 === 0 && i > 0).map((i) => <text key={i} x={i * 12 + 2} y={30} fontSize="9" fill="#444">{i / 5}</text>)}
        </svg>
        <button className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white" onPointerDown={(e) => e.stopPropagation()} onClick={onClose}><X size={13} /></button>
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-gn-ui-lasso shadow" onPointerDown={(e) => start(e, 'rot')} title="Drehen" />
      </div>
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
      <canvas ref={cv} width={220} height={220} className="rounded-full border-4 border-white bg-white shadow-pop" />
      <button className="pointer-events-auto absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-canvas shadow" onClick={onClose} aria-label="Schließen"><X size={14} /></button>
    </div>
  )
}

/* ----------------------------- Toast ----------------------------- */
export function Toast({ msg, onClose, persistent }: { msg: string; onClose: () => void; persistent?: boolean }) {
  useEffect(() => { if (persistent) return; const id = setTimeout(onClose, 3600); return () => clearTimeout(id) }, [msg, persistent, onClose])
  return (
    <div className="fixed bottom-5 left-1/2 z-[80] flex max-w-[min(92vw,820px)] -translate-x-1/2 items-center gap-3 rounded-full bg-gn-ui-toast px-5 py-3.5 text-[16px] text-white shadow-pop">
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
