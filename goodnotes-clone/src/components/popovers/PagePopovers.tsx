import { useEffect, useState, type RefObject } from 'react'
import { ArrowRightToLine, Bookmark, BookmarkCheck, Camera, Copy, FileDown, FilePen, Image as ImageIcon, Import, LayoutTemplate, List, Palette, Printer, RotateCw, ScanLine, Search as SearchIcon, Trash2, Users, Presentation, Settings, Shapes } from 'lucide-react'
import type { Page, OutlineItem, PageMeta } from '../../store/types'
import { colorsFor, templateLabel, type PaperColor, type TemplateId } from '../../lib/paper'
import { PageThumb, PaperThumb } from '../PaperThumb'
import { BackBtn, Group, Popover, PopTitle, Row, Segmented, Toggle } from '../ui'
import { useT } from '../../context/Settings'

type A = RefObject<HTMLElement | null>
interface Base { anchor: A; open: boolean; onClose: () => void }
export type Where = 'before' | 'after' | 'last'

/* ------------------------------ Add page ------------------------------ */
export function AddPagePopover({ current, onAdd, onMoreTemplates, onChoose, ...b }: Base & {
  current: PageMeta; onAdd: (w: Where, m: Partial<PageMeta>) => void; onMoreTemplates: (w: Where) => void; onChoose: (k: 'file' | 'camera' | 'import', w: Where) => void
}) {
  const t = useT()
  const [where, setWhere] = useState<Where>('after')
  const items: { label: string; tpl: TemplateId }[] = [{ label: 'Aktuelle Vorlage', tpl: current.template }, { label: 'Kariert', tpl: 'grid' }, { label: 'Leer', tpl: 'blank' }]
  const color: PaperColor = current.color
  return (
    <Popover {...b} width={380} align="right">
      <PopTitle>{t('Seite hinzufügen')}</PopTitle>
      <div className="px-3"><Segmented value={where} onChange={setWhere} options={[{ id: 'before', label: t('Vor dieser') }, { id: 'after', label: t('Nach dieser') }, { id: 'last', label: t('Letzte Seite') }]} /></div>
      <div className="px-4 pb-1 pt-4 text-[21px] font-semibold">{t('Neue Vorlagen')}</div>
      <p className="px-4 pb-3 text-[16px] leading-snug text-sub">{t('Die hier gezeigten Vorlagen übernehmen wenn möglich die Eigenschaften der aktuellen Seite.')}</p>
      <div className="grid grid-cols-3 gap-3 px-4">
        {items.map((it, i) => (
          <button key={i} onClick={() => { onAdd(where, { template: it.tpl, color: it.tpl === current.template ? color : color === 'black' ? 'black' : 'white' }); b.onClose() }} className="flex flex-col items-center gap-2">
            <PaperThumb template={it.tpl} color={color} size={current.size} className="w-full rounded-[10px] shadow-[0_1px_5px_rgba(0,0,0,.25)]" />
            <span className="text-[15px]">{t(it.label)}</span>
          </button>
        ))}
      </div>
      <div className="h-4" />
      <Group>
        <Row icon={<LayoutTemplate size={22} />} onClick={() => { b.onClose(); onMoreTemplates(where) }}>{t('Mehr Vorlagen …')}</Row>
        <Row icon={<ImageIcon size={22} />} onClick={() => { onChoose('file', where); b.onClose() }}>{t('Bild')}</Row>
        <Row icon={<ScanLine size={22} />} onClick={() => { onChoose('camera', where); b.onClose() }}>{t('Dokumente scannen')}</Row>
        <Row icon={<Camera size={22} />} onClick={() => { onChoose('camera', where); b.onClose() }}>{t('Foto aufnehmen')}</Row>
        <Row icon={<Import size={22} />} onClick={() => { onChoose('import', where); b.onClose() }}>{t('Importieren')}</Row>
      </Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ More ------------------------------ */
export type ClearKind = 'strokes' | 'highlighter' | 'texts' | 'images' | 'shapes'
export function MorePopover({ page, index, total, onBookmark, onCopy, onRotate, onOutline, onTemplate, onGoto, onClearKinds, onClearPage, onDelete, onSettings, ...b }: Base & {
  page: Page; index: number; total: number; onBookmark: () => void; onCopy: () => void; onRotate: (d: 1 | -1) => void; onOutline: () => void; onTemplate: () => void
  onGoto: (n: number) => void; onClearKinds: (k: ClearKind) => void; onClearPage: () => void; onDelete: () => void; onSettings: () => void
}) {
  const t = useT()
  const [view, setView] = useState<'main' | 'rotate' | 'objects'>('main')
  const [goto, setGoto] = useState('')
  useEffect(() => { if (!b.open) setView('main') }, [b.open])
  const done = (fn: () => void) => () => { fn(); b.onClose() }
  if (view !== 'main') {
    const rows = view === 'rotate'
      ? [{ l: 'Im Uhrzeigersinn', f: () => onRotate(1) }, { l: 'Gegen den Uhrzeigersinn', f: () => onRotate(-1) }]
      : ([['strokes', 'Handschrift'], ['highlighter', 'Textmarker'], ['shapes', 'Formen'], ['texts', 'Text'], ['images', 'Bilder']] as [ClearKind, string][]).map(([k, l]) => ({ l, f: () => onClearKinds(k) }))
    return (
      <Popover {...b} width={370} align="right">
        <PopTitle left={<BackBtn onClick={() => setView('main')} />}>{t(view === 'rotate' ? 'Seite drehen' : 'Bestimmte Objekte löschen')}</PopTitle>
        <Group>{rows.map((r) => <Row key={r.l} danger={view === 'objects'} onClick={done(r.f)}>{t(r.l)}</Row>)}</Group>
        <div className="h-4" />
      </Popover>
    )
  }
  return (
    <Popover {...b} width={390} align="right">
      <PopTitle>{t('Mehr')}</PopTitle>
      <div className="h-2" />
      <Group>
        <div className="flex items-center justify-between px-3.5 py-3">
          <span className="text-[22px] font-semibold">{t('Seite')} „{index + 1}“</span>
          <PageThumb page={page} className="h-[46px] rounded-md border border-hair" />
        </div>
        <Row icon={page.bookmarked ? <BookmarkCheck size={22} className="text-accent" /> : <Bookmark size={22} />} onClick={done(onBookmark)}>{t(page.bookmarked ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen')}</Row>
        <Row icon={<Copy size={22} />} onClick={done(onCopy)}>{t('Seite kopieren')}</Row>
        <Row icon={<RotateCw size={22} />} chevron onClick={() => setView('rotate')}>{t('Seite drehen')}</Row>
        <Row icon={<List size={22} />} onClick={done(onOutline)}>{t('Seite zur Gliederung hinzufügen')}</Row>
        <Row icon={<Palette size={22} />} onClick={done(onTemplate)}>{t('Vorlage wechseln')}</Row>
        <Row as="div" icon={<ArrowRightToLine size={22} />} trailing={
          <input value={goto} onChange={(e) => setGoto(e.target.value.replace(/\D/g, ''))} placeholder={`1 – ${total}`} inputMode="numeric" aria-label={t('Gehe zu Seite')}
            onKeyDown={(e) => { if (e.key === 'Enter') { const n = +goto; if (n >= 1 && n <= total) { onGoto(n); b.onClose() } } }} className="w-[84px] rounded-lg bg-chip px-2 py-1 text-right text-[17px] text-sub outline-none" />
        }>{t('Gehe zu Seite')}</Row>
      </Group>
      <div className="px-4 pb-1.5 pt-4 text-[19px] font-semibold text-sub">{t('Seite leeren oder löschen')}</div>
      <Group>
        <Row icon={<Shapes size={22} />} chevron onClick={() => setView('objects')}>{t('Bestimmte Objekte löschen')}</Row>
        <Row danger icon={<FilePen size={22} />} onClick={done(onClearPage)}>{t('Seite leeren')}</Row>
        <Row danger icon={<Trash2 size={22} />} onClick={done(onDelete)}>{t('Seite in den Papierkorb legen')}</Row>
      </Group>
      <div className="h-3" />
      <Group><Row icon={<Settings size={22} />} onClick={() => { b.onClose(); onSettings() }}>{t('Einstellungen')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Share ------------------------------ */
export function SharePopover({ onExport, onPrint, present, onPresent, onUnavailable, ...b }: Base & {
  onExport: (all: boolean) => void; onPrint: (all: boolean) => void; present: boolean; onPresent: (v: boolean) => void; onUnavailable: () => void
}) {
  const t = useT()
  const [view, setView] = useState<'main' | 'print'>('main')
  useEffect(() => { if (!b.open) setView('main') }, [b.open])
  const H = ({ children }: { children: React.ReactNode }) => <div className="px-4 pb-1.5 pt-4 text-[19px] font-semibold text-sub">{children}</div>
  if (view === 'print') return (
    <Popover {...b} width={370} align="right">
      <PopTitle left={<BackBtn onClick={() => setView('main')} />}>{t('Drucken')}</PopTitle>
      <Group><Row onClick={() => { onPrint(false); b.onClose() }}>{t('Diese Seite')}</Row><Row onClick={() => { onPrint(true); b.onClose() }}>{t('Alle Seiten')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
  return (
    <Popover {...b} width={380} align="right">
      <PopTitle>{t('Teilen und Exportieren')}</PopTitle>
      <H>{t('Zusammenarbeit')}</H>
      <Group>
        <Row icon={<Users size={22} />} sub={t('Arbeitspartner anzeigen und einladen')} onClick={onUnavailable}>{t('Teilen …')}</Row>
        <Row icon={<Presentation size={22} />} sub={t('mit interaktiven Lehrfunktionen')} onClick={onUnavailable}>{t('In schnelle Unterrichtseinheit umwandeln')}</Row>
      </Group>
      <H>{t('Export')}</H>
      <Group>
        <Row icon={<FileDown size={22} />} onClick={() => { onExport(false); b.onClose() }}>{t('Diese Seite exportieren')}</Row>
        <Row icon={<FileDown size={22} />} onClick={() => { onExport(true); b.onClose() }}>{t('Alle exportieren')}</Row>
        <Row icon={<Printer size={22} />} chevron onClick={() => setView('print')}>{t('Drucken')}</Row>
      </Group>
      <H>{t('Präsentationsmodus')}</H>
      <Group><Row as="div" trailing={<Toggle on={present} onChange={(v) => { onPresent(v); if (v) b.onClose() }} />}>{t('Werkzeugleisten ausblenden')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Search ------------------------------ */
export function SearchPopover({ pages, outline, onGo, ...b }: Base & { pages: Page[]; outline: OutlineItem[]; onGo: (id: string) => void }) {
  const t = useT()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const hits = needle ? pages.flatMap((p, i) => p.content.texts.filter((x) => x.text.toLowerCase().includes(needle)).map((x) => ({ id: p.id, page: i + 1, text: x.text }))) : []
  const outl = needle ? outline.filter((o) => o.title.toLowerCase().includes(needle)) : []
  return (
    <Popover {...b} width={380} align="left">
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2.5"><SearchIcon size={19} className="text-sub" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Suchen')} className="min-w-0 flex-1 bg-transparent text-[18px] outline-none" /></div>
      </div>
      {needle && (
        <Group className="mb-3">
          {outl.map((o) => <Row key={o.id} icon={<List size={20} />} onClick={() => { onGo(o.pageId); b.onClose() }}>{o.title}</Row>)}
          {hits.map((h, i) => <Row key={i} sub={`${t('Seite')} ${h.page}`} onClick={() => { onGo(h.id); b.onClose() }}><span className="line-clamp-2">{h.text}</span></Row>)}
          {!hits.length && !outl.length && <div className="px-4 py-5 text-center text-[17px] text-sub">{t('Keine Ergebnisse')}</div>}
        </Group>
      )}
      {!needle && <p className="px-5 pb-4 text-[15px] text-sub">{t('Durchsucht Text in Textfeldern und Gliederungen. Handschrift wird nicht erkannt.')}</p>}
    </Popover>
  )
}
export const _t = templateLabel
export const _c = colorsFor
