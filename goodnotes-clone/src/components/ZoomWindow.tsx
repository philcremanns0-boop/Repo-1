import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Page } from '../store/types'
import type { PageStore } from '../store/useNotebook'
import { pageDims } from '../lib/pageDims'
import PageView from './PageView'
import type { EditorProps, ZoomRegion } from './editorTypes'
import { X } from './glyphs'
import { useT } from '../context/Settings'

const PANEL_H = 230

/**
 * Goodnotes "Zoom-Ansicht": a magnified writing strip docked at the bottom. Ink written here lands in the
 * framed region of the page. Writing into the shaded right margin (or tapping ↵ / →) advances the frame.
 */
export default function ZoomWindow({ page, store, ed, region, onRegion, onClose }: {
  page: Page; store: PageStore; ed: EditorProps; region: ZoomRegion; onRegion: (r: ZoomRegion) => void; onClose: () => void
}) {
  const t = useT()
  const box = useRef<HTMLDivElement>(null)
  const [pw, setPw] = useState(800)
  useLayoutEffect(() => {
    const f = () => box.current && setPw(box.current.clientWidth)
    f(); const ro = new ResizeObserver(f); if (box.current) ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  const { w: W, h: H } = pageDims(page)
  const Z = pw / region.w
  // keep the region's aspect ratio in sync with the panel
  useEffect(() => { const h = (region.w * PANEL_H) / pw; if (Math.abs(h - region.h) > 0.5) onRegion({ ...region, h: Math.min(h, H) }) }, [pw, region.w]) // eslint-disable-line react-hooks/exhaustive-deps

  const margin = 48
  const advance = () => {
    const nx = region.x + region.w * 0.6
    if (nx + region.w * 0.4 > W) newline(); else onRegion({ ...region, x: Math.min(nx, W - region.w) })
  }
  const newline = () => {
    const ny = region.y + region.h * 0.75
    onRegion({ ...region, x: Math.min(margin, W - region.w), y: ny + region.h > H ? region.y : ny })
  }
  // auto-advance: a new stroke that ends in the shaded right zone moves the frame on
  const count = useRef(store.content.strokes.length)
  useEffect(() => {
    const s = store.content.strokes
    if (s.length > count.current) {
      const last = s[s.length - 1]
      const xs = last.points.map((p) => p.x), ys = last.points.map((p) => p.y)
      const inside = Math.min(...ys) >= region.y - 4 && Math.max(...ys) <= region.y + region.h + 4
      if (inside && Math.max(...xs) > region.x + region.w * 0.82) advance()
    }
    count.current = s.length
  }, [store.content.strokes]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (k: number) => {
    const w = Math.max(80, Math.min(W, region.w * k))
    onRegion({ ...region, w, h: (w * PANEL_H) / pw, x: Math.min(region.x, W - w) })
  }
  const edPanel: EditorProps = { ...ed, zoom: Z, selection: null, ruler: null }
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-hair bg-pop/95 px-3 pb-3 pt-2 shadow-[0_-6px_24px_rgba(0,0,0,.12)] backdrop-blur" data-zoomwindow>
      <div className="mb-2 flex items-center justify-between text-[14px]">
        <div className="flex items-center gap-1">
          <button aria-label={t('Herauszoomen')} onClick={() => zoomBy(1.2)} className="h-8 w-9 rounded-lg bg-chip text-[18px]">−</button>
          <span className="w-14 text-center tabular-nums text-sub">{Math.round(Z * 100)}%</span>
          <button aria-label={t('Hineinzoomen')} onClick={() => zoomBy(1 / 1.2)} className="h-8 w-9 rounded-lg bg-chip text-[18px]">+</button>
        </div>
        <span className="font-semibold">{t('Zoom-Ansicht')}</span>
        <div className="flex items-center gap-1">
          <button aria-label={t('Weiter')} onClick={advance} className="h-8 rounded-lg bg-chip px-3">→</button>
          <button aria-label={t('Neue Zeile')} onClick={newline} className="h-8 rounded-lg bg-chip px-3">↵</button>
          <button aria-label={t('Schließen')} onClick={onClose} className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-chip"><X size={15} /></button>
        </div>
      </div>
      <div ref={box} className="relative overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--hair)]" style={{ height: PANEL_H }}>
        <div className="absolute left-0 top-0" style={{ transform: `translate(${-region.x * Z}px, ${-region.y * Z}px)` }}>
          <PageView page={page} store={store} ed={edPanel} onActivate={() => undefined} panel />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 border-l border-dashed border-gn-ui-select/50 bg-gn-ui-select/[.06]" style={{ width: '18%' }} />
      </div>
    </div>
  )
}
