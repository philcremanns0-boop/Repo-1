import { useRef, useState } from 'react'
import { Copy, Trash2 } from './glyphs'
import { measureText, newId, selectionBBox, translateStroke, type Content, type Selection } from '../lib/draw'
import type { PageStore } from '../store/useNotebook'
import { useT } from '../context/Settings'

const move = (c: Content, s: Selection, dx: number, dy: number): Content => ({
  strokes: c.strokes.map((x) => (s.strokes.includes(x.id) ? translateStroke(x, dx, dy) : x)),
  texts: c.texts.map((x) => (s.texts.includes(x.id) ? { ...x, x: x.x + dx, y: x.y + dy } : x)),
  images: c.images.map((x) => (s.images.includes(x.id) ? { ...x, x: x.x + dx, y: x.y + dy } : x)),
})

interface Props {
  store: PageStore
  selection: Selection
  zoom: number
  colors: string[]
  onChange: (s: Selection | null) => void
}
export default function SelectionLayer({ store, selection, zoom, colors, onChange }: Props) {
  const t = useT()
  const [palette, setPalette] = useState(false)
  const drag = useRef<boolean>(false)
  const c = store.content
  const bb = selectionBBox(c, selection)
  if (!bb) return null
  const single = selection.strokes.length + selection.texts.length + selection.images.length === 1
  const img = selection.images.length === 1 && single ? c.images.find((i) => i.id === selection.images[0]) : undefined
  const txt = selection.texts.length === 1 && single ? c.texts.find((i) => i.id === selection.texts[0]) : undefined

  const run = (e: React.PointerEvent, fn: (dx: number, dy: number, base: Content) => Content) => {
    e.stopPropagation(); e.preventDefault()
    const base = c, sx = e.clientX, sy = e.clientY
    let moved = false
    drag.current = true
    const mv = (ev: PointerEvent) => { const dx = (ev.clientX - sx) / zoom, dy = (ev.clientY - sy) / zoom; if (Math.abs(dx) + Math.abs(dy) > 1) moved = true; store.live(() => fn(dx, dy, base)) }
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); drag.current = false; if (moved) store.checkpoint(base) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  const del = () => { store.commit((x) => ({ strokes: x.strokes.filter((s) => !selection.strokes.includes(s.id)), texts: x.texts.filter((s) => !selection.texts.includes(s.id)), images: x.images.filter((s) => !selection.images.includes(s.id)) })); onChange(null) }
  const dup = () => {
    const ns: Selection = { pageId: selection.pageId, strokes: [], texts: [], images: [] }
    store.commit((x) => {
      const strokes = x.strokes.filter((s) => selection.strokes.includes(s.id)).map((s) => { const n = { ...translateStroke(s, 24, 24), id: newId() }; ns.strokes.push(n.id); return n })
      const texts = x.texts.filter((s) => selection.texts.includes(s.id)).map((s) => { const n = { ...s, x: s.x + 24, y: s.y + 24, id: newId() }; ns.texts.push(n.id); return n })
      const images = x.images.filter((s) => selection.images.includes(s.id)).map((s) => { const n = { ...s, x: s.x + 24, y: s.y + 24, id: newId() }; ns.images.push(n.id); return n })
      return { strokes: [...x.strokes, ...strokes], texts: [...x.texts, ...texts], images: [...x.images, ...images] }
    })
    onChange(ns)
  }
  const recolor = (color: string) => {
    store.commit((x) => ({ ...x, strokes: x.strokes.map((s) => (selection.strokes.includes(s.id) ? { ...s, color } : s)), texts: x.texts.map((s) => (selection.texts.includes(s.id) && !s.note ? { ...s, color } : s)) }))
    setPalette(false)
  }
  const pad = 6 / zoom
  const lw = 1.6 / zoom
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      <div className="pointer-events-auto absolute cursor-move" data-selection
        style={{ left: bb.x0 - pad, top: bb.y0 - pad, width: bb.x1 - bb.x0 + 2 * pad, height: bb.y1 - bb.y0 + 2 * pad, border: `${lw}px dashed #2f8cf0`, background: 'rgba(47,140,240,.06)', touchAction: 'none' }}
        onPointerDown={(e) => run(e, (dx, dy, base) => move(base, selection, dx, dy))}>
        {(img || txt) && (
          <div className="absolute rounded-full border-white bg-gn-ui-lasso" style={{ width: 14 / zoom, height: 14 / zoom, right: -7 / zoom, bottom: -7 / zoom, borderWidth: 2 / zoom, cursor: 'nwse-resize' }}
            onPointerDown={(e) => run(e, (dx, _dy, base) => {
              if (img) { const r = img.h / img.w, w = Math.max(24, img.w + dx); return { ...base, images: base.images.map((i) => (i.id === img.id ? { ...i, w, h: w * r } : i)) } }
              const m = measureText(txt!); void m
              return { ...base, texts: base.texts.map((i) => (i.id === txt!.id ? { ...i, w: Math.max(60, txt!.w + dx) } : i)) }
            })} />
        )}
      </div>
      <div className="pointer-events-auto absolute flex origin-bottom-left items-center gap-0.5 rounded-xl bg-gn-ui-toast px-1 py-1 text-[14px] text-white shadow-lg"
        style={{ left: bb.x0 - pad, top: bb.y0 - pad - 8 / zoom, transform: `translateY(-100%) scale(${1 / zoom})`, transformOrigin: 'bottom left' }}
        onPointerDown={(e) => e.stopPropagation()}>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10" onClick={dup}><Copy size={15} />{t('Duplizieren')}</button>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-danger hover:bg-white/10" onClick={del}><Trash2 size={15} />{t('Löschen')}</button>
        {(selection.strokes.length > 0 || selection.texts.length > 0) && (
          <div className="relative">
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10" onClick={() => setPalette((v) => !v)}>
              <span className="h-4 w-4 rounded-full border border-white/50 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" />{t('Farbe')}
            </button>
            {palette && (
              <div className="absolute left-0 top-full z-10 mt-1 flex gap-1.5 rounded-xl bg-gn-ui-toast p-2 shadow-lg">
                {colors.map((col) => <button key={col} aria-label={col} onClick={() => recolor(col)} className="h-6 w-6 rounded-full border border-white/30" style={{ background: col }} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
