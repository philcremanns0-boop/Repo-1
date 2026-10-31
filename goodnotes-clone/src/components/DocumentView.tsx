import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { SIZES } from '../lib/paper'
import type { Notebook } from '../store/useNotebook'
import PageView from './PageView'
import { LaserLayer } from './Widgets'
import type { EditorProps } from './editorTypes'
import { useSettings } from '../context/Settings'

interface Props {
  nb: Notebook
  ed: Omit<EditorProps, 'zoom'>
  zoom: number | null
  setZoom: (z: number | null) => void
  scrollTo: { id: string; n: number } | null
  laser: { on: boolean; color: string; trail: boolean; size: number }
  topInset: number
  onZoomValue: (z: number) => void
}

export default function DocumentView({ nb, ed, zoom, setZoom, scrollTo, laser, topInset, onZoomValue }: Props) {
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
  const { w: pw, h: ph } = SIZES[pg.size]
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

  const full: EditorProps = { ...ed, zoom: z }
  const ids = nb.pages.map((p) => p.id)
  return (
    <div className="relative min-h-0 flex-1">
      <div ref={box} onScroll={onScroll} className={`absolute inset-0 bg-canvas ${horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-auto'}`}
        style={{ scrollSnapType: horizontal ? 'x proximity' : undefined }}>
        <div className={`flex min-h-full min-w-full gap-6 ${horizontal ? 'w-max flex-row items-center px-10' : 'w-max flex-col items-center px-6 pb-24'}`} style={{ paddingTop: topInset + 8, paddingBottom: horizontal ? 24 : 96 }}>
          {nb.pages.map((p) => (
            <div key={p.id} style={{ scrollSnapAlign: horizontal ? 'center' : undefined }} className="shrink-0">
              <PageView page={p} store={nb.store(p.id)} ed={full} onActivate={nb.setCurrent} />
            </div>
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
