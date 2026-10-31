import { useRef, useState } from 'react'
import { Bookmark, Check, ChevronDown, Copy, ListTree, MoreHorizontal, Plus, RotateCw, Trash2, X } from './glyphs'
import type { Notebook } from '../store/useNotebook'
import type { Recording } from '../lib/recorder'
import { PageThumb } from './PaperThumb'
import { Group, Popover, Row } from './ui'
import { MicSparkI } from './icons'
import { useT } from '../context/Settings'

export type SideTab = 'pages' | 'outline' | 'audio'
interface Props {
  nb: Notebook
  tab: SideTab
  setTab: (t: SideTab) => void
  onClose: () => void
  onGo: (id: string) => void
  recordings: Recording[]
  onRemoveRec: (id: string) => void
  recording: boolean
  secs: number
}
export default function Sidebar({ nb, tab, setTab, onClose, onGo, recordings, onRemoveRec, recording, secs }: Props) {
  const t = useT()
  const [filter, setFilter] = useState<'all' | 'fav'>('all')
  const [menu, setMenu] = useState<string | null>(null)
  const [top, setTop] = useState(false)
  const anchor = useRef<HTMLElement | null>(null)
  const topBtn = useRef<HTMLButtonElement>(null)
  const filtBtn = useRef<HTMLButtonElement>(null)
  const [filtOpen, setFiltOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null)
  const dragged = useRef(false)
  const grid = useRef<HTMLDivElement>(null)
  /** Long-press (350 ms) then drag a thumbnail to reorder – drop indicator shows the target slot. */
  const startDrag = (e: React.PointerEvent, id: string) => {
    if (picking || (e.pointerType === 'mouse' && e.button !== 0)) return
    dragged.current = false
    const sx = e.clientX, sy = e.clientY
    let active = false
    let over = -1
    const timer = setTimeout(() => { active = true; dragged.current = true; setDrag({ id, over: -1 }) }, 350)
    const mv = (ev: PointerEvent) => {
      if (!active) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) cleanup(); return }
      ev.preventDefault()
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-thumb]') as HTMLElement | null
      if (el) { over = +el.dataset.thumb!; setDrag({ id, over }) }
    }
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cleanup) }
    const up = () => {
      cleanup()
      if (active && over >= 0) nb.movePage(id, over)
      setDrag(null)
      setTimeout(() => { dragged.current = false }, 0)
    }
    window.addEventListener('pointermove', mv, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cleanup)
  }
  const pages = nb.pages.map((p, i) => ({ p, i })).filter(({ p }) => filter === 'all' || p.bookmarked)
  const title = tab === 'pages' ? 'Seiten' : tab === 'outline' ? 'Gliederungen' : 'Audio'
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return (
    <aside className="flex h-full w-[min(346px,86vw)] shrink-0 flex-col border-r border-hair bg-canvas">
      <div className="relative flex h-[56px] shrink-0 items-center justify-center">
        <button ref={topBtn} aria-label={t('Mehr')} onClick={() => setTop((v) => !v)} className="absolute left-4 flex h-9 w-9 items-center justify-center"><MoreHorizontal size={22} /></button>
        <h2 className="text-[21px] font-semibold">{t(title)}</h2>
        <button aria-label={t('Schließen')} onClick={onClose} className="absolute right-4 flex h-9 w-9 items-center justify-center"><X size={24} /></button>
      </div>
      <div className="mx-3.5 mb-3 flex shrink-0 rounded-full bg-chip p-[3px]">
        {([['pages', <svg key="p" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 3.5h8l4 4V20a.5.5 0 01-.5.5h-11A.5.5 0 016 20z" /></svg>], ['outline', <ListTree key="o" size={22} />], ['audio', <MicSparkI key="a" size={22} />]] as const).map(([id, icon]) => (
          <button key={id} aria-label={t(id === 'pages' ? 'Seiten' : id === 'outline' ? 'Gliederungen' : 'Audio')} onClick={() => setTab(id)} className={`flex h-[38px] flex-1 items-center justify-center rounded-full ${tab === id ? 'bg-card shadow-[0_1px_3px_rgba(0,0,0,.2)]' : ''}`}>{icon}</button>
        ))}
      </div>

      {tab === 'pages' && (
        <>
          <div className="flex shrink-0 items-center justify-between px-3 pb-3">
            <button ref={filtBtn} onClick={() => setFiltOpen(true)} className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3.5 py-2 text-[20px] font-medium text-accent">{t(filter === 'all' ? 'Alle Seiten' : 'Favoriten')}<ChevronDown size={18} /></button>
            <button onClick={() => { setPicking((v) => !v); setPicked([]) }} className="rounded-full px-3 py-2 text-[18px] font-medium text-accent">{t(picking ? 'Fertig' : 'Auswählen')}</button>
          </div>
          <div ref={grid} className="grid min-h-0 flex-1 grid-cols-2 content-start gap-x-4 gap-y-6 overflow-y-auto border-t border-hair px-4 pb-8 pt-5">
            {pages.map(({ p, i }) => {
              const sel = p.id === nb.page.id
              const on = picked.includes(p.id)
              return (
                <div key={p.id} data-thumb={i} className={`flex flex-col transition-opacity ${drag?.id === p.id ? 'opacity-40' : ''}`}>
                  {drag && drag.over === i && drag.id !== p.id && <div className="pointer-events-none -mt-3 mb-1.5 h-1 rounded-full bg-gn-ui-select" />}
                  <button onPointerDown={(e) => startDrag(e, p.id)} onClick={() => { if (dragged.current) return; if (picking) setPicked((l) => (on ? l.filter((x) => x !== p.id) : [...l, p.id])); else onGo(p.id) }}
                    className={`relative touch-pan-y rounded-[3px] bg-white ${on ? 'ring-[3px] ring-gn-ui-select' : sel && !picking ? 'ring-[3px] ring-gn-ui-select' : 'ring-1 ring-hair'}`} aria-label={`${t('Seite')} ${i + 1}`} aria-pressed={picking ? on : undefined}>
                    <PageThumb page={p} className="block w-full" />
                    {picking ? (
                      <span className={`absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow ${on ? 'bg-gn-ui-select' : 'bg-black/20'}`}>{on && <Check size={14} color="#fff" strokeWidth={3} />}</span>
                    ) : (
                      <span role="button" aria-label={t('Favorit')} onClick={(e) => { e.stopPropagation(); nb.toggleBookmark(p.id) }} className="absolute right-1.5 top-0 text-black/60"><Bookmark size={24} fill={p.bookmarked ? '#1a82e0' : 'none'} color={p.bookmarked ? '#1a82e0' : 'currentColor'} strokeWidth={1.6} /></span>
                    )}
                  </button>
                  <div className="mt-1.5 flex items-center justify-between px-1 text-[19px]"><span className="tabular-nums">{i + 1}</span>
                    {!picking && <button aria-label={t('Seitenmenü')} onClick={(e) => { anchor.current = e.currentTarget; setMenu(menu === p.id ? null : p.id) }}><ChevronDown size={20} /></button>}</div>
                </div>
              )
            })}
            {!picking && <button onClick={() => nb.addPage('last')} aria-label={t('Seite hinzufügen')} className="flex aspect-[0.707] items-center justify-center self-start rounded-[8px] border-[1.5px] border-dashed border-accent text-accent"><Plus size={30} strokeWidth={1.6} /></button>}
          </div>
          {picking && (
            <div className="flex shrink-0 items-center justify-around border-t border-hair px-2 py-2.5 text-[16px]">
              <span className="text-sub">{picked.length} {t('ausgewählt')}</span>
              <button disabled={!picked.length} onClick={() => { picked.forEach((id) => nb.duplicatePage(id)); setPicked([]) }} className="flex items-center gap-1 text-accent disabled:opacity-40"><Copy size={18} />{t('Kopieren')}</button>
              <button disabled={!picked.length} onClick={() => picked.forEach((id) => nb.rotatePage(id, 1))} className="flex items-center gap-1 text-accent disabled:opacity-40"><RotateCw size={18} />{t('Drehen')}</button>
              <button disabled={!picked.length} onClick={() => { picked.forEach((id) => nb.deletePage(id)); setPicked([]) }} className="flex items-center gap-1 text-danger disabled:opacity-40"><Trash2 size={18} />{t('Löschen')}</button>
            </div>
          )}
        </>
      )}
      {tab === 'outline' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          {nb.outline.length === 0 ? (
            <div className="flex flex-col items-center pt-6 text-center">
              <svg width="220" height="190" viewBox="0 0 220 190" fill="none" stroke="#4a1d4d" strokeWidth="3" strokeLinejoin="round"><path d="M70 20l40 12v60l-40-8z" fill="#b4aed0" /><path d="M120 40l50-14v50l-50 20z" fill="#b4aed0" /><path d="M110 110l55 22-55 28-55-28z" fill="#b4aed0" /><path d="M30 80l30 14-30 16-18-12z" fill="#e6d9a0" /></svg>
              <h3 className="mt-6 text-[22px] font-bold leading-tight">{t('Gliederungen – Übersichten über deine Dokumente')}</h3>
              <p className="mt-4 text-[19px] leading-snug text-sub">{t('Navigiere mit Hilfe einer Gliederung schnell durch dein Dokument oder füge deine eigene Gliederung hinzu, um Struktur und Hierarchie zu schaffen.')}</p>
            </div>
          ) : (
            <Group className="!mx-0">{nb.outline.map((o) => {
              const idx = nb.pages.findIndex((p) => p.id === o.pageId) + 1
              return editing === o.id ? (
                <div key={o.id} className="flex items-center gap-2 px-3.5 py-2.5 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair">
                  <input autoFocus defaultValue={o.title} aria-label={t('Titel')} className="min-w-0 flex-1 rounded-lg bg-chip px-2 py-1.5 text-[17px] outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') { nb.renameOutline(o.id, (e.target as HTMLInputElement).value.trim() || o.title); setEditing(null) } if (e.key === 'Escape') setEditing(null) }}
                    onBlur={(e) => { nb.renameOutline(o.id, e.target.value.trim() || o.title); setEditing(null) }} />
                </div>
              ) : (
                <Row key={o.id} onClick={() => onGo(o.pageId)} sub={`${t('Seite')} ${idx}`}
                  trailing={<span className="flex items-center gap-3"><span role="button" tabIndex={0} aria-label={t('Umbenennen')} onClick={(e) => { e.stopPropagation(); setEditing(o.id) }} className="text-[15px] text-accent">{t('Umbenennen')}</span>
                    <span role="button" tabIndex={0} aria-label={t('Entfernen')} onClick={(e) => { e.stopPropagation(); nb.removeOutline(o.id) }}><Trash2 size={18} className="text-sub" /></span></span>}>{o.title}</Row>
              )
            })}</Group>
          )}
        </div>
      )}
      {tab === 'audio' && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8">
          {recording && <div className="mb-3 flex items-center gap-3 rounded-[18px] bg-card px-4 py-3 text-[18px]"><span className="h-3 w-3 animate-pulse rounded-full bg-danger" />{t('Aufnahme läuft')} <span className="ml-auto tabular-nums">{mmss(secs)}</span></div>}
          {recordings.length === 0 && !recording && <p className="px-3 pt-4 text-center text-[18px] text-sub">{t('Noch keine Aufnahmen. Tippe in der Werkzeugleiste auf das Mikrofon.')}</p>}
          {recordings.map((r) => (
            <div key={r.id} className="mb-3 rounded-[18px] bg-card p-3">
              <div className="mb-1 flex items-center justify-between text-[16px]"><span>{new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {mmss(r.secs)}</span>
                <button aria-label={t('Löschen')} onClick={() => onRemoveRec(r.id)}><Trash2 size={17} className="text-sub" /></button></div>
              <audio controls src={r.url} className="h-9 w-full" />
            </div>
          ))}
        </div>
      )}
      <Popover anchor={filtBtn} open={filtOpen} onClose={() => setFiltOpen(false)} width={240} align="left">
        <Group className="m-2 !mx-2">
          <Row onClick={() => { setFilter('all'); setFiltOpen(false) }}>{t('Alle Seiten')}</Row>
          <Row onClick={() => { setFilter('fav'); setFiltOpen(false) }}>{t('Favoriten')}</Row>
        </Group>
      </Popover>
      <Popover anchor={anchor} open={!!menu} onClose={() => setMenu(null)} width={260} align="left">
        <Group className="m-2 !mx-2">
          <Row onClick={() => { if (menu) nb.duplicatePage(menu); setMenu(null) }}>{t('Seite kopieren')}</Row>
          <Row onClick={() => { if (menu) { const i = nb.pages.findIndex((p) => p.id === menu); nb.movePage(menu, i - 1) } setMenu(null) }}>{t('Nach oben')}</Row>
          <Row onClick={() => { if (menu) { const i = nb.pages.findIndex((p) => p.id === menu); nb.movePage(menu, i + 1) } setMenu(null) }}>{t('Nach unten')}</Row>
          <Row danger onClick={() => { if (menu) nb.deletePage(menu); setMenu(null) }}>{t('Seite löschen')}</Row>
        </Group>
      </Popover>
      <Popover anchor={topBtn} open={top} onClose={() => setTop(false)} width={260} align="left">
        <Group className="m-2 !mx-2">
          <Row onClick={() => { setFilter('all'); setTab('pages'); setTop(false) }}>{t('Alle Seiten')}</Row>
          <Row onClick={() => { setFilter('fav'); setTab('pages'); setTop(false) }}>{t('Favoriten')}</Row>
        </Group>
      </Popover>
    </aside>
  )
}
