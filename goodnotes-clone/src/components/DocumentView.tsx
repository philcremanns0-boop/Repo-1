import { pageDims } from '../lib/pageDims'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Minus, Plus } from './glyphs'
import { motion, useAnimate } from 'framer-motion'

import type { Notebook } from '../store/useNotebook'
import PageView from './PageView'
import { LaserLayer } from './Widgets'
import type { EditorProps } from './editorTypes'
import { useSettings } from '../context/Settings'

/** Wraps a page: new pages slide/fade in; navigating to a page (sidebar, go-to) replays a subtle slide-and-fade
 *  along the active scroll axis. */
function PageSlot({ children, fresh, flash, horizontal }: { children: React.ReactNode; fresh: boolean; flash: number; horizontal: boolean }) {
  const [scope, animate] = useAnimate()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (!flash || !scope.current) return
    void animate(scope.current, horizontal ? { opacity: [0.3, 1], x: [36, 0] } : { opacity: [0.3, 1], y: [28, 0] }, { type: 'spring', stiffness: 260, damping: 30 })
  }, [flash]) // eslint-disable-line react-hooks/exhaustive-deps
  const off = horizontal ? { x: 48 } : { y: 36 }
  return (
    <motion.div ref={scope} className="shrink-0" style={{ scrollSnapAlign: horizontal ? 'center' : undefined }}
      initial={fresh ? { opacity: 0, scale: 0.98, ...off } : false} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
      {children}
    </motion.div>
  )
}

interface Props {
  nb: Notebook
  ed: Omit<EditorProps, 'zoom'>
  zoom: number | null
  setZoom: (z: number | null) => void
  scrollTo: { id: string; n: number } | null
  laser: { on: boolean; color: string; trail: boolean; size: number }
  topInset: number
  onZoomValue: (z: number) => void
  onUndo: () => void
  onRedo: () => void
}

export default function DocumentView({ nb, ed, zoom, setZoom, scrollTo, laser, topInset, onZoomValue, onUndo, onRedo }: Props) {
  const { scroll } = useSettings()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })
  useLayoutEffect(() => {
    const el = box.current!
    const f = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    f()
    const ro = new ResizeObserver(f); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const horizontal = scroll === 'horizontal'
  const pg = nb.page
  const { w: pw, h: ph } = pageDims(pg)
  const fitH = (size.h - topInset - 40) / ph
  const fit = Math.max(0.2, Math.min(1.25, horizontal ? fitH : Math.min((size.w - 48) / pw, fitH)))
  const z = zoom ?? fit
  useEffect(() => onZoomValue(z), [z, onZoomValue])

  // keep the "current page" in sync with what is on screen
  const raf = useRef(0)
  const onScroll = () => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = box.current!, r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + topInset + (r.height - topInset) / 2
      let best = '', bd = Infinity
      el.querySelectorAll<HTMLElement>('[data-page]').forEach((p) => {
        const b = p.getBoundingClientRect()
        const d = horizontal ? Math.abs(b.left + b.width / 2 - cx) : Math.abs(b.top + b.height / 2 - cy)
        if (d < bd) { bd = d; best = p.dataset.page! }
      })
      if (best) nb.setCurrent(best)
    })
  }
  useEffect(() => {
    if (!scrollTo) return
    box.current?.querySelector(`[data-page="${scrollTo.id}"]`)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
  }, [scrollTo])

  // ctrl/⌘ + wheel (trackpad pinch) zooms
  useEffect(() => {
    const el = box.current!
    const w = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      setZoom(Math.min(3, Math.max(0.25, z * Math.exp(-e.deltaY * 0.01))))
    }
    el.addEventListener('wheel', w, { passive: false })
    return () => el.removeEventListener('wheel', w)
  }, [z, setZoom])

  const known = useRef(new Set(nb.pages.map((p) => p.id)))
  /* ---- iPad touch gestures: pinch zoom, 2-finger tap = undo, 3-finger tap = redo ---- */
  const g = useRef({ pts: new Map<number, { x: number; y: number; x0: number; y0: number }>(), max: 0, t0: 0, moved: false, pinch: null as null | { d0: number; z0: number } })
  const anchor = useRef<null | { cx: number; cy: number; mx: number; my: number; z: number }>(null)
  const zRef = useRef(z); zRef.current = z
  const cbs = useRef({ onUndo, onRedo, setZoom }); cbs.current = { onUndo, onRedo, setZoom }
  useEffect(() => {
    const el = box.current!
    const st = g.current
    const dist = () => { const [a, b] = [...st.pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
    const mid = () => { const [a, b] = [...st.pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      if (st.pts.size === 0) { st.max = 0; st.t0 = performance.now(); st.moved = false }
      st.pts.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY })
      st.max = Math.max(st.max, st.pts.size)
      if (st.pts.size === 2) st.pinch = { d0: dist(), z0: zRef.current }
    }
    const move = (e: PointerEvent) => {
      const p = st.pts.get(e.pointerId)
      if (!p) return
      p.x = e.clientX; p.y = e.clientY
      if (Math.hypot(p.x - p.x0, p.y - p.y0) > 10) st.moved = true
      if (st.pts.size === 2 && st.pinch) {
        e.preventDefault()
        const nz = Math.min(4, Math.max(0.25, st.pinch.z0 * (dist() / st.pinch.d0)))
        const r = el.getBoundingClientRect(), m = mid()
        anchor.current = { cx: (el.scrollLeft + m.x - r.left) / zRef.current, cy: (el.scrollTop + m.y - r.top) / zRef.current, mx: m.x - r.left, my: m.y - r.top, z: nz }
        cbs.current.setZoom(nz)
      }
    }
    const up = (e: PointerEvent) => {
      if (!st.pts.delete(e.pointerId)) return
      if (st.pts.size < 2) st.pinch = null
      if (st.pts.size === 0 && !st.moved && performance.now() - st.t0 < 350) {
        if (st.max === 2) cbs.current.onUndo()
        else if (st.max === 3) cbs.current.onRedo()
      }
    }
    el.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move, { capture: true, passive: false })
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', up, true)
    return () => { el.removeEventListener('pointerdown', down, true); window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); window.removeEventListener('pointercancel', up, true) }
  }, [])
  // keep the pinch midpoint fixed while zooming
  useLayoutEffect(() => {
    const a = anchor.current, el = box.current
    if (!a || !el || Math.abs(a.z - z) > 1e-6) return
    el.scrollLeft = a.cx * z - a.mx; el.scrollTop = a.cy * z - a.my
    anchor.current = null
  }, [z])

  const full: EditorProps = { ...ed, zoom: z }
  const ids = nb.pages.map((p) => p.id)
  return (
    <div className="relative min-h-0 flex-1">
      <div ref={box} onScroll={onScroll} className={`absolute inset-0 bg-canvas ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-auto'}`}
        style={{ scrollSnapType: horizontal ? 'x proximity' : undefined, touchAction: 'pan-x pan-y' }}>
        <div className={`flex min-h-full min-w-full gap-6 ${horizontal ? 'w-max flex-row items-center px-10' : 'w-max flex-col items-center px-6 pb-24'}`} style={{ paddingTop: topInset + 8, paddingBottom: horizontal ? 24 : 96 }}>
          {nb.pages.map((p) => (
            <PageSlot key={p.id} fresh={!known.current.has(p.id)} flash={scrollTo?.id === p.id ? scrollTo.n : 0} horizontal={horizontal}>
              <PageView page={p} store={nb.store(p.id)} ed={full} onActivate={nb.setCurrent} />
            </PageSlot>
          ))}
        </div>
      </div>
      {laser.on && <LaserLayer color={laser.color} trail={laser.trail} size={laser.size} />}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between">
        <div className="pointer-events-auto rounded-full bg-float px-3.5 py-1.5 text-[14px] font-semibold tabular-nums shadow-pill backdrop-blur">
          {ids.indexOf(pg.id) + 1} / {ids.length}
        </div>
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-float p-1 text-[14px] shadow-pill backdrop-blur">
          <button aria-label="Zoom out" className="flex h-7 w-7 items-center justify-center rounded-full active:bg-chip" onClick={() => setZoom(Math.max(0.25, +(z - 0.1).toFixed(2)))}><Minus size={15} /></button>
          <button className="w-12 text-center font-semibold tabular-nums" onClick={() => setZoom(null)} title="Fit">{Math.round(z * 100)}%</button>
          <button aria-label="Zoom in" className="flex h-7 w-7 items-center justify-center rounded-full active:bg-chip" onClick={() => setZoom(Math.min(3, +(z + 0.1).toFixed(2)))}><Plus size={15} /></button>
        </div>
      </div>
    </div>
  )
}
