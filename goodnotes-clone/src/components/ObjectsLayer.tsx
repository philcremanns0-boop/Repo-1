import { useEffect, useRef } from 'react'
import { fontStack } from '../lib/fonts'
import { newId, type Content, type ImageObj, type TextObj } from '../lib/draw'
import type { PageStore } from '../store/useNotebook'

export interface TextStyle { font: string; size: number; color: string; bold: boolean; italic: boolean; align: 'left' | 'center' | 'right'; lh: number; fill: string | null; border: string | null }
export const DEFAULT_TEXT: TextStyle = { font: 'Helvetica Neue', size: 20, color: '#111111', bold: false, italic: false, align: 'left', lh: 1, fill: null, border: null }

export function ImagesLayer({ images }: { images: ImageObj[] }) {
  return (
    <>
      {images.map((i) => (
        <img key={i.id} src={i.src} alt="" draggable={false} className="pointer-events-none absolute select-none" style={{ left: i.x, top: i.y, width: i.w, height: i.h }} />
      ))}
    </>
  )
}

interface TBProps {
  t: TextObj
  store: PageStore
  interactive: boolean
  selected: boolean
  editing: boolean
  onSelect: () => void
  onEdit: (on: boolean) => void
  baseRef: React.MutableRefObject<Map<number, Content>>
}
function TextBox({ t, store, interactive, selected, editing, onSelect, onEdit, baseRef }: TBProps) {
  const el = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; base: Content; moved: boolean } | null>(null)
  useEffect(() => { if (el.current && document.activeElement !== el.current) el.current.innerText = t.text }, [t.text, editing])
  useEffect(() => {
    if (editing && el.current) {
      el.current.focus()
      const r = document.createRange(); r.selectNodeContents(el.current); r.collapse(false)
      const s = getSelection(); s?.removeAllRanges(); s?.addRange(r)
    }
  }, [editing])

  const commit = () => {
    const text = (el.current?.innerText ?? '').replace(/\n$/, '')
    const base = baseRef.current.get(t.id)
    baseRef.current.delete(t.id)
    if (!text.trim()) { store.live((c) => ({ ...c, texts: c.texts.filter((x) => x.id !== t.id) })); return }
    if (text !== t.text || base) {
      if (base) { store.live((c) => ({ ...c, texts: c.texts.map((x) => (x.id === t.id ? { ...x, text } : x)) })); store.checkpoint(base) }
      else store.commit((c) => ({ ...c, texts: c.texts.map((x) => (x.id === t.id ? { ...x, text } : x)) }))
    }
  }
  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation(); e.preventDefault()
    const zoom = (e.currentTarget as HTMLElement).closest('[data-zoom]')?.getAttribute('data-zoom')
    const z = zoom ? parseFloat(zoom) : 1
    e.currentTarget.setPointerCapture(e.pointerId)
    const d = { x: e.clientX, y: e.clientY, ox: mode === 'move' ? t.x : t.w, oy: t.y, base: store.content, moved: false }
    drag.current = d
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - d.x) / z, dy = (ev.clientY - d.y) / z
      d.moved = true
      store.live((c) => ({ ...c, texts: c.texts.map((x) => (x.id !== t.id ? x : mode === 'move' ? { ...x, x: d.ox + dx, y: d.oy + dy } : { ...x, w: Math.max(60, d.ox + dx) })) }))
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (d.moved) store.checkpoint(d.base); drag.current = null }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  const pad = t.note ? 12 : 4
  return (
    <div data-text-id={t.id} className="absolute"
      style={{ left: t.x, top: t.y, width: t.w, pointerEvents: interactive ? 'auto' : 'none', zIndex: selected ? 3 : 1 }}
      onPointerDown={(e) => { if (!interactive) return; e.stopPropagation(); if (!editing) { baseRef.current.set(t.id, store.content); onSelect(); onEdit(true) } }}>
      <div ref={el} contentEditable={editing} suppressContentEditableWarning spellCheck={false}
        onBlur={() => { if (editing) { commit(); onEdit(false) } }}
        onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLElement).blur(); e.stopPropagation() }}
        className="outline-none"
        style={{
          fontFamily: fontStack(t.font), fontSize: t.size, color: t.color, fontWeight: t.bold ? 700 : 400, fontStyle: t.italic ? 'italic' : 'normal',
          textAlign: t.align, lineHeight: t.lh * 1.2, padding: pad, minHeight: t.size * 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', cursor: interactive ? 'text' : 'default',
          background: t.note ? '#fff3a6' : t.fill ?? 'transparent', boxShadow: t.note ? '0 3px 10px rgba(0,0,0,.25)' : t.border ? `inset 0 0 0 1.5px ${t.border}` : undefined,
          borderRadius: !t.note && (t.fill || t.border) ? 4 : undefined,
          outline: selected ? '1.5px dashed #2f8cf0' : undefined, outlineOffset: 1,
        }} />
      {selected && interactive && (
        <>
          <div onPointerDown={(e) => startDrag(e, 'move')} title="Verschieben"
            className="absolute -left-3 -top-3 flex h-6 w-6 cursor-move items-center justify-center rounded-full bg-gn-ui-lasso text-white shadow" style={{ transform: 'scale(1)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 3v18M3 12h18" /></svg>
          </div>
          <div onPointerDown={(e) => startDrag(e, 'resize')} className="absolute -right-2 top-1/2 h-6 w-3 -translate-y-1/2 cursor-ew-resize rounded-full bg-gn-ui-lasso" />
        </>
      )}
    </div>
  )
}

interface TLProps {
  texts: TextObj[]
  store: PageStore
  /** text / note tool active → boxes are editable and page clicks create boxes */
  mode: 'text' | 'note' | null
  style: TextStyle
  selectedId: number | null
  editingId: number | null
  onSelect: (id: number | null) => void
  onEdit: (id: number | null) => void
  pageW: number
  zoom: number
  onCreated: () => void
}
export function TextLayer({ texts, store, mode, style, selectedId, editingId, onSelect, onEdit, pageW, zoom, onCreated }: TLProps) {
  const base = useRef(new Map<number, Content>())
  const press = useRef<{ x: number; y: number; t: number; long: boolean; timer: ReturnType<typeof setTimeout> } | null>(null)
  const layer = useRef<HTMLDivElement>(null)

  const create = (x: number, y: number, full: boolean) => {
    const id = newId()
    const note = mode === 'note'
    const w = full ? pageW - 2 * 48 : note ? 200 : Math.max(160, 14 * style.size)
    const obj: TextObj = { id, x: full ? 48 : x, y, w, text: '', ...style, note, color: note ? '#1c1c1e' : style.color }
    base.current.set(id, store.content)
    store.live((c) => ({ ...c, texts: [...c.texts, obj] }))
    onSelect(id); onEdit(id); onCreated()
  }
  const down = (e: React.PointerEvent) => {
    if (!mode || e.target !== e.currentTarget) return
    const r = layer.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / zoom, y = (e.clientY - r.top) / zoom
    const p = { x, y, t: Date.now(), long: false, timer: setTimeout(() => { if (press.current) { press.current.long = true; create(x, y, true); press.current = null } }, 520) }
    press.current = p
    if (editingId != null) (document.activeElement as HTMLElement)?.blur()
    onSelect(null)
  }
  const up = (e: React.PointerEvent) => {
    const p = press.current
    if (!p) return
    clearTimeout(p.timer); press.current = null
    if (Math.hypot(e.clientX - (p.x * zoom + layer.current!.getBoundingClientRect().left), e.clientY - (p.y * zoom + layer.current!.getBoundingClientRect().top)) < 12) create(p.x, p.y, false)
  }
  return (
    <div ref={layer} className="absolute inset-0" style={{ pointerEvents: mode ? 'auto' : 'none', cursor: mode ? 'text' : 'default', touchAction: mode ? 'none' : 'auto' }}
      onPointerDown={down} onPointerUp={up} onPointerCancel={() => { if (press.current) { clearTimeout(press.current.timer); press.current = null } }}>
      {texts.map((t) => (
        <TextBox key={t.id} t={t} store={store} baseRef={base} interactive={!!mode} selected={selectedId === t.id} editing={editingId === t.id}
          onSelect={() => onSelect(t.id)} onEdit={(on) => onEdit(on ? t.id : null)} />
      ))}
    </div>
  )
}
