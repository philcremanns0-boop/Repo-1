import { useState } from 'react'
import { Copy, Trash2 } from './glyphs'
import { newId, selectionBBox, translateStroke, type Content, type Pt, type Selection } from '../lib/draw'
import { copySel, pick, remove } from '../lib/clipboard'
import { renderPage, download } from '../lib/export'
import type { PageStore } from '../store/useNotebook'
import { useT } from '../context/Settings'

const move = (c: Content, s: Selection, dx: number, dy: number): Content => ({
  strokes: c.strokes.map((x) => (s.strokes.includes(x.id) ? translateStroke(x, dx, dy) : x)),
  texts: c.texts.map((x) => (s.texts.includes(x.id) ? { ...x, x: x.x + dx, y: x.y + dy } : x)),
  images: c.images.map((x) => (s.images.includes(x.id) ? { ...x, x: x.x + dx, y: x.y + dy } : x)),
})
/** Uniform scale about origin `o` – ink widths, font sizes and image sizes scale too. */
const scale = (c: Content, s: Selection, o: Pt, k: number): Content => {
  const P = (x: number, y: number) => ({ x: o.x + (x - o.x) * k, y: o.y + (y - o.y) * k })
  return {
    strokes: c.strokes.map((x) => (s.strokes.includes(x.id) ? { ...x, width: x.width * k, points: x.points.map((p) => ({ ...p, ...P(p.x, p.y) })) } : x)),
    texts: c.texts.map((x) => (s.texts.includes(x.id) ? { ...x, ...P(x.x, x.y), w: x.w * k, size: Math.max(4, x.size * k) } : x)),
    images: c.images.map((x) => (s.images.includes(x.id) ? { ...x, ...P(x.x, x.y), w: x.w * k, h: x.h * k } : x)),
  }
}
/** Rotation about centre `o` – ink rotates, text boxes and images orbit with their centre. */
const rotate = (c: Content, s: Selection, o: Pt, a: number): Content => {
  const cos = Math.cos(a), sin = Math.sin(a)
  const R = (x: number, y: number) => ({ x: o.x + (x - o.x) * cos - (y - o.y) * sin, y: o.y + (x - o.x) * sin + (y - o.y) * cos })
  const orbit = <T extends { x: number; y: number; w: number }>(x: T, h: number): T => { const c2 = R(x.x + x.w / 2, x.y + h / 2); return { ...x, x: c2.x - x.w / 2, y: c2.y - h / 2 } }
  return {
    strokes: c.strokes.map((x) => (s.strokes.includes(x.id) ? { ...x, points: x.points.map((p) => ({ ...p, ...R(p.x, p.y) })) } : x)),
    texts: c.texts.map((x) => (s.texts.includes(x.id) ? orbit(x, x.size * 1.4) : x)),
    images: c.images.map((x) => (s.images.includes(x.id) ? orbit(x, x.h) : x)),
  }
}

interface Props {
  store: PageStore
  selection: Selection
  zoom: number
  colors: string[]
  pageW: number
  pageH: number
  onChange: (s: Selection | null) => void
  onToast?: (m: string) => void
  onLink?: (box: { x: number; y: number; w: number; h: number }) => void
}
export default function SelectionLayer({ store, selection, zoom, colors, pageW, pageH, onChange, onToast, onLink }: Props) {
  const t = useT()
  const [palette, setPalette] = useState(false)
  const c = store.content
  const bb = selectionBBox(c, selection)
  if (!bb) return null

  const run = (e: React.PointerEvent, fn: (ev: PointerEvent, base: Content, sx: number, sy: number) => Content) => {
    e.stopPropagation(); e.preventDefault()
    const base = c, sx = e.clientX, sy = e.clientY
    let moved = false
    const mv = (ev: PointerEvent) => { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 2) moved = true; store.live(() => fn(ev, base, sx, sy)) }
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (moved) store.checkpoint(base) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  const centre = { x: (bb.x0 + bb.x1) / 2, y: (bb.y0 + bb.y1) / 2 }
  const startScale = (e: React.PointerEvent) => run(e, (ev, base, sx) => {
    const w0 = bb.x1 - bb.x0 || 1
    return scale(base, selection, { x: bb.x0, y: bb.y0 }, Math.max(0.1, (w0 + (ev.clientX - sx) / zoom) / w0))
  })
  const startRotate = (e: React.PointerEvent) => {
    const host = (e.currentTarget as HTMLElement).closest('[data-page-inner]')!.getBoundingClientRect()
    const cx = host.left + centre.x * zoom, cy = host.top + centre.y * zoom
    const a0 = Math.atan2(e.clientY - cy, e.clientX - cx)
    run(e, (ev, base) => {
      let a = Math.atan2(ev.clientY - cy, ev.clientX - cx) - a0
      const snap = Math.round(a / (Math.PI / 4)) * (Math.PI / 4)
      if (Math.abs(a - snap) < 0.06) a = snap // snap to 45° like Goodnotes
      return rotate(base, selection, centre, a)
    })
  }

  const del = () => { store.commit((x) => remove(x, selection)); onChange(null) }
  const copy = () => { copySel(c, selection); onToast?.(t('Kopiert')) }
  const cut = () => { copySel(c, selection); del() }
  const dup = () => {
    const ns: Selection = { pageId: selection.pageId, strokes: [], texts: [], images: [] }
    store.commit((x) => {
      const p = pick(x, selection)
      const strokes = p.strokes.map((s) => { const n = { ...translateStroke(s, 24, 24), id: newId() }; ns.strokes.push(n.id); return n })
      const texts = p.texts.map((s) => { const n = { ...s, x: s.x + 24, y: s.y + 24, id: newId() }; ns.texts.push(n.id); return n })
      const images = p.images.map((s) => { const n = { ...s, x: s.x + 24, y: s.y + 24, id: newId() }; ns.images.push(n.id); return n })
      return { strokes: [...x.strokes, ...strokes], texts: [...x.texts, ...texts], images: [...x.images, ...images] }
    })
    onChange(ns)
  }
  const recolor = (color: string) => {
    store.commit((x) => ({ ...x, strokes: x.strokes.map((s) => (selection.strokes.includes(s.id) ? { ...s, color } : s)), texts: x.texts.map((s) => (selection.texts.includes(s.id) && !s.note ? { ...s, color } : s)) }))
    setPalette(false)
  }
  /** Lasso "Screenshot": PNG of the selected area (paper + content). */
  const shot = async () => {
    const full = await renderPage({ id: '', size: 'a4p', template: 'blank', color: 'white', bookmarked: false, content: pick(c, selection), bg: { key: '', w: pageW, h: pageH } }, 2, false)
    const cv = document.createElement('canvas'); const pad = 8
    const x = Math.max(0, bb.x0 - pad), y = Math.max(0, bb.y0 - pad), w = Math.min(pageW, bb.x1 + pad) - x, h = Math.min(pageH, bb.y1 + pad) - y
    cv.width = Math.round(w * 2); cv.height = Math.round(h * 2)
    cv.getContext('2d')!.drawImage(full, x * 2, y * 2, w * 2, h * 2, 0, 0, cv.width, cv.height)
    cv.toBlob((b) => b && download('screenshot.png', b), 'image/png')
  }

  const pad = 6 / zoom
  const lw = 1.6 / zoom
  const knob = 14 / zoom
  const Btn = ({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
    <button className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 hover:bg-white/10 ${danger ? 'text-[#ff6a5e]' : ''}`} onClick={onClick}>{children}</button>
  )
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      <div className="pointer-events-auto absolute cursor-move" data-selection
        style={{ left: bb.x0 - pad, top: bb.y0 - pad, width: bb.x1 - bb.x0 + 2 * pad, height: bb.y1 - bb.y0 + 2 * pad, border: `${lw}px dashed #2f8cf0`, background: 'rgba(47,140,240,.06)', touchAction: 'none' }}
        onPointerDown={(e) => run(e, (ev, base, sx, sy) => move(base, selection, (ev.clientX - sx) / zoom, (ev.clientY - sy) / zoom))}>
        <div aria-label={t('Größe ändern')} className="absolute rounded-full border-white bg-gn-ui-lasso" style={{ width: knob, height: knob, right: -knob / 2, bottom: -knob / 2, borderWidth: 2 / zoom, cursor: 'nwse-resize' }} onPointerDown={startScale} />
        <div aria-label={t('Drehen')} className="absolute left-1/2 rounded-full border-white bg-gn-ui-lasso" style={{ width: knob, height: knob, top: -28 / zoom, marginLeft: -knob / 2, borderWidth: 2 / zoom, cursor: 'grab' }} onPointerDown={startRotate} />
        <div className="absolute left-1/2 bg-gn-ui-lasso" style={{ width: lw, height: 28 / zoom - knob, top: -28 / zoom + knob, marginLeft: -lw / 2 }} />
      </div>
      <div className="pointer-events-auto absolute flex items-center gap-0.5 rounded-xl bg-gn-ui-toast px-1 py-1 text-[14px] text-white shadow-lg"
        style={{ left: bb.x0 - pad, top: bb.y0 - pad - 40 / zoom, transform: `translateY(-100%) scale(${1 / zoom})`, transformOrigin: 'bottom left' }}
        onPointerDown={(e) => e.stopPropagation()}>
        <Btn onClick={copy}><Copy size={15} />{t('Kopieren')}</Btn>
        <Btn onClick={cut}>{t('Ausschneiden')}</Btn>
        <Btn onClick={dup}>{t('Duplizieren')}</Btn>
        {(selection.strokes.length > 0 || selection.texts.length > 0) && (
          <div className="relative">
            <Btn onClick={() => setPalette((v) => !v)}><span className="h-4 w-4 rounded-full border border-white/50 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />{t('Farbe')}</Btn>
            {palette && (
              <div className="absolute left-0 top-full z-10 mt-1 flex gap-1.5 rounded-xl bg-gn-ui-toast p-2 shadow-lg">
                {colors.map((col) => <button key={col} aria-label={col} onClick={() => recolor(col)} className="h-6 w-6 rounded-full border border-white/30" style={{ background: col }} />)}
              </div>
            )}
          </div>
        )}
        {onLink && <Btn onClick={() => { onLink({ x: bb.x0, y: bb.y0, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 }); onChange(null) }}>{t('Link')}</Btn>}
        <Btn onClick={() => void shot()}>{t('Screenshot')}</Btn>
        <Btn danger onClick={del}><Trash2 size={15} />{t('Löschen')}</Btn>
      </div>
    </div>
  )
}
