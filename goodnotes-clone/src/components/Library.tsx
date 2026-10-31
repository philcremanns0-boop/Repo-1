import { useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, Import, Search, Star, Cloud, Download, Folder as FolderIcon, FolderPlus, Info, LayoutGrid, List as ListIcon, NotebookPen, Plus, Settings, Trash2, Upload, User } from './glyphs'
import type { Library as Lib } from '../store/useLibrary'
import type { Folder, NbMeta } from '../store/types'
import { coverUri } from '../lib/covers'
import { download } from '../lib/export'
import { Group, Popover, PopTitle, Push, Row, Sheet, BackBtn, CloseBtn } from './ui'
import { SettingsBody } from './popovers/SimplePopovers'
import { SidebarI, ShareI } from './icons'
import { FolderGlyph } from './FolderGlyph'
import { GoodnotesLogo } from './Logo'
import FolderSheet, { type FolderForm } from './sheets/FolderSheet'
import TemplatePicker from './sheets/TemplatePicker'
import { useSettings, useT } from '../context/Settings'
import { importPdf, isPdf } from '../lib/files'

const fmtDate = (ts: number, lang: string) => {
  const d = new Date(ts), now = new Date()
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === now.toDateString() ? `${lang === 'de' ? 'Heute' : 'Today'}, ${time}` : `${d.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time}`
}
const Pill = ({ children }: { children: React.ReactNode }) => <div className="flex items-center rounded-full border border-hair bg-float px-1 shadow-pill">{children}</div>
type Menu = { kind: 'nb' | 'folder'; id: string }

export default function Library({ lib, onNew, onToast }: { lib: Lib; onNew: () => void; onToast: (m: string, persistent?: boolean) => void }) {
  const t = useT()
  const { lang } = useSettings()
  const [side, setSide] = useState(false)
  const [acct, setAcct] = useState(false)
  const [plus, setPlus] = useState(false)
  const [view, setView] = useState<'menu' | 'settings'>('menu')
  const [info, setInfo] = useState<'about' | 'legal' | null>(null)
  const [fsheet, setFsheet] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [menuView, setMenuView] = useState<'main' | 'move'>('main')
  const [rename, setRename] = useState<{ id: string; title: string } | null>(null)
  const gear = useRef<HTMLButtonElement>(null)
  const plusBtn = useRef<HTMLButtonElement>(null)
  const menuAnchor = useRef<HTMLElement | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const pdfIn = useRef<HTMLInputElement>(null)
  const importFile = async (f: File | undefined) => {
    if (!f) return
    if (f.name.endsWith('.json')) { try { lib.restoreBackup(await f.text()); onToast(t('Notizbuch importiert')) } catch { onToast(t('Ungültige Backup-Datei')) } return }
    if (!isPdf(f)) { onToast(t('Bitte eine PDF-Datei wählen')); return }
    try {
      onToast(t('PDF wird importiert …'), true)
      const bgs = await importPdf(f, (d, n) => onToast(`${t('PDF wird importiert …')} ${d}/${n}`, true))
      lib.create({ title: f.name.replace(/\.pdf$/i, ''), template: 'blank', color: 'white', size: 'a4p', cover: 'hell', coverColor: '#02BDE4' }, bgs)
      onToast(`${bgs.length} ${t(bgs.length === 1 ? 'Seite importiert' : 'Seiten importiert')}`)
    } catch { onToast(t('Datei konnte nicht gelesen werden')) }
  }

  const cur = lib.folder
  const curFolder = lib.folders.find((f) => f.id === cur)
  const fav = lib.view === 'favorites'
  const folders = (fav ? [] : lib.folders.filter((f) => f.parent === cur)).filter((f) => !query.trim() || f.name.toLowerCase().includes(query.trim().toLowerCase()))
  const [query, setQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [coverFor, setCoverFor] = useState<NbMeta | null>(null)
  const sortBtn = useRef<HTMLButtonElement>(null)
  const needle = query.trim().toLowerCase()
  const byName = (a: { name?: string; title?: string }, b: { name?: string; title?: string }) => (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? '', undefined, { numeric: true })
  const nbs = lib.notebooks
    .filter((n) => !n.deleted && (needle ? (n.title || '').toLowerCase().includes(needle) : fav ? n.starred : (n.folder ?? null) === cur))
    .sort((a, b) => (lib.sort === 'name' ? byName(a, b) : lib.sort === 'created' ? b.created - a.created : b.updated - a.updated))
  const trashed = lib.notebooks.filter((n) => n.deleted)
  const v = lib.view === 'shared' || lib.view === 'trash' || lib.view === 'cloud' ? lib.view : 'home'
  const title = fav ? t('Favoriten') : v === 'home' ? (curFolder?.name ?? t('Dokumente')) : t(v === 'shared' ? 'Geteilt' : v === 'trash' ? 'Papierkorb' : 'Cloud & Backup')
  const crumbs = (() => { const out: Folder[] = []; let f = curFolder; while (f) { out.unshift(f); f = lib.folders.find((x) => x.id === f!.parent) } return out })()
  const folderOpts = (exclude?: string) => lib.folders.filter((f) => f.id !== exclude)

  const nav = [{ id: 'home', label: 'Dokumente', icon: <FolderIcon size={20} /> }, { id: 'favorites', label: 'Favoriten', icon: <Star size={20} /> }, { id: 'shared', label: 'Geteilt', icon: <ShareI size={20} /> }, { id: 'cloud', label: 'Cloud & Backup', icon: <Cloud size={20} /> }, { id: 'trash', label: 'Papierkorb', icon: <Trash2 size={20} /> }] as const
  const openMenu = (e: React.MouseEvent, m: Menu) => { e.stopPropagation(); menuAnchor.current = e.currentTarget as HTMLElement; setMenuView('main'); setMenu(menu?.id === m.id ? null : m) }
  const editing = fsheet?.mode === 'edit' ? lib.folders.find((f) => f.id === fsheet.id) : undefined
  const formInit: FolderForm = editing ? { name: editing.name, color: editing.color, icon: editing.icon } : { name: '', color: '#a3222a', icon: 'none' }
  const menuNb: NbMeta | undefined = menu?.kind === 'nb' ? lib.notebooks.find((n) => n.id === menu.id) : undefined
  const menuFolder: Folder | undefined = menu?.kind === 'folder' ? lib.folders.find((f) => f.id === menu.id) : undefined

  const Chevron = ({ m }: { m: Menu }) => <span role="button" tabIndex={0} aria-label={t('Menü')} onClick={(e) => openMenu(e, m)} className="inline-flex h-6 w-6 cursor-pointer items-center justify-center text-sub"><ChevronDown size={16} /></span>

  return (
    <div className="flex min-h-0 flex-1 bg-canvas">
      {side && (
        <aside className="w-[260px] shrink-0 border-r border-hair bg-pop px-3 pt-20">
          {nav.map((n) => (
            <button key={n.id} onClick={() => { lib.go(n.id); if (n.id === 'home') lib.enterFolder(null) }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[18px] ${(fav ? 'favorites' : v) === n.id ? 'bg-accent/15 text-accent' : ''}`}>{n.icon}{t(n.label)}</button>
          ))}
        </aside>
      )}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto px-6 pb-16">
        <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between bg-canvas/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Pill><button aria-label={t('Seitenleiste')} onClick={() => setSide((s) => !s)} className="flex h-11 w-11 items-center justify-center"><SidebarI size={24} /></button></Pill>
            {v === 'home' && curFolder && <Pill><button aria-label={t('Zurück')} onClick={() => lib.enterFolder(curFolder.parent)} className="flex h-11 w-11 items-center justify-center"><ChevronLeft size={26} strokeWidth={2.4} /></button></Pill>}
          </div>
          <Pill>
            <button ref={plusBtn} aria-label={t('Neu')} onClick={() => setPlus((p) => !p)} className="flex h-11 w-11 items-center justify-center"><Plus size={24} /></button>
            <button ref={gear} aria-label={t('Einstellungen')} onClick={() => { setView('menu'); setAcct((a) => !a) }} className="flex h-11 w-11 items-center justify-center"><Settings size={23} /></button>
          </Pill>
        </div>
        {v === 'home' && crumbs.length > 1 && <div className="-mt-1 pb-1 text-[16px] text-sub">{t('Dokumente')} › {crumbs.map((c) => c.name).join(' › ')}</div>}
        <h1 className="gn-title pb-5 pt-2 text-[44px] font-extrabold">{title}</h1>

        {v === 'home' && (
          <>
            <div className="mb-8 flex items-center justify-between text-[22px] font-medium text-sub">
              <button ref={sortBtn} onClick={() => setSortOpen(true)} className="flex items-center gap-3"><LayoutGrid size={26} />{t('Alle')} · {t(lib.sort === 'name' ? 'Name' : lib.sort === 'created' ? 'Erstellt' : 'Zuletzt bearbeitet')}<ChevronDown size={18} /></button>
              <label className="mx-4 flex min-w-0 max-w-[340px] flex-1 items-center gap-2 rounded-full bg-chip px-3.5 py-2 text-[17px] text-ink"><Search size={18} className="text-sub" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Suchen')} aria-label={t('Notizbücher suchen')} className="min-w-0 flex-1 bg-transparent outline-none" /></label>
              <button aria-label={t(lib.layout === 'grid' ? 'Listenansicht' : 'Rasteransicht')} onClick={() => lib.setLayout(lib.layout === 'grid' ? 'list' : 'grid')} className="flex h-10 w-10 items-center justify-center text-ink">{lib.layout === 'grid' ? <ListIcon size={26} /> : <LayoutGrid size={26} />}</button>
            </div>
            {folders.length === 0 && nbs.length === 0 ? (
              <div className="flex flex-col items-center pt-12 text-center">
                <GoodnotesLogo size={96} tile className="mb-6 rounded-[22px] shadow-gn-float" />
                <p className="text-[22px] font-semibold">{t(fav ? 'Noch keine Favoriten' : curFolder ? 'Dieser Ordner ist leer' : 'Noch keine Notizbücher')}</p>
                <p className="mt-2 max-w-xs text-[18px] text-sub">{t('Erstelle ein Notizbuch mit Umschlag und Papiervorlage oder lege einen farbigen Ordner an.')}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={onNew} className="flex items-center gap-2 rounded-full bg-gn-ui-select px-6 py-3 text-[19px] font-semibold text-white shadow-pill"><NotebookPen size={22} />{t('Neues Notizbuch')}</button>
                  <button onClick={() => setFsheet({ mode: 'create' })} className="flex items-center gap-2 rounded-full bg-card px-6 py-3 text-[19px] font-semibold shadow-pill"><FolderPlus size={22} />{t('Neuer Ordner')}</button>
                </div>
              </div>
            ) : lib.layout === 'grid' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-8 gap-y-12">
                {folders.map((f) => (
                  <div key={f.id} className="flex flex-col items-center text-center">
                    <button data-folder={f.name} onClick={() => lib.enterFolder(f.id)} className="flex h-[200px] w-full items-end justify-center pb-2 transition-transform active:scale-[.97]" aria-label={f.name}><FolderGlyph color={f.color} icon={f.icon} width={160} className="drop-shadow-[0_6px_8px_rgba(0,0,0,.25)]" /></button>
                    <span className="mt-2 flex max-w-full items-center gap-1 text-[21px] font-semibold"><span className="truncate">{f.name}</span><Chevron m={{ kind: 'folder', id: f.id }} /></span>
                    <span className="text-[16px] text-sub">{fmtDate(f.created, lang)}</span>
                  </div>
                ))}
                {nbs.map((n) => (
                  <div key={n.id} className="flex flex-col items-center text-center">
                    <button onClick={() => lib.open(n.id)} className="group flex h-[200px] items-end" aria-label={n.title}>
                      <div className="relative aspect-[0.77] w-[150px] overflow-hidden rounded-[6px] bg-cover shadow-[0_6px_14px_rgba(0,0,0,.28),0_0_0_.5px_rgba(0,0,0,.2)] transition-transform group-active:scale-[.97]" style={{ backgroundImage: `url("${coverUri(n.cover, n.coverColor)}")` }}>
                        <span className="absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent" />
                        <span role="button" aria-label={t(n.starred ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen')} onClick={(e) => { e.stopPropagation(); lib.toggleStar(n.id) }}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center">
                          <Star size={22} strokeWidth={1.6} color={n.starred ? '#e5503f' : 'rgba(255,255,255,.95)'} fill={n.starred ? '#e5503f' : 'rgba(0,0,0,.12)'} />
                        </span>
                      </div>
                    </button>
                    <span className="mt-2 flex max-w-full items-center gap-1 text-[21px] font-semibold"><span className="truncate">{n.title || t('Unbenannt')}</span><Chevron m={{ kind: 'nb', id: n.id }} /></span>
                    <span className="mt-0.5 text-[16px] text-sub">{n.pages} {t(n.pages === 1 ? 'Seite' : 'Seiten')} · {fmtDate(n.updated, lang)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Group className="!mx-0">
                {folders.map((f) => (
                  <Row key={f.id} onClick={() => lib.enterFolder(f.id)} icon={<FolderGlyph color={f.color} icon={f.icon} width={44} />} sub={fmtDate(f.created, lang)} trailing={<Chevron m={{ kind: 'folder', id: f.id }} />}>{f.name}</Row>
                ))}
                {nbs.map((n) => (
                  <Row key={n.id} onClick={() => lib.open(n.id)} icon={<div className="h-12 w-9 rounded bg-cover shadow" style={{ backgroundImage: `url("${coverUri(n.cover, n.coverColor)}")` }} />} sub={`${n.pages} ${t(n.pages === 1 ? 'Seite' : 'Seiten')} · ${fmtDate(n.updated, lang)}`} trailing={<Chevron m={{ kind: 'nb', id: n.id }} />}>{n.title || t('Unbenannt')}</Row>
                ))}
              </Group>
            )}
          </>
        )}
        {v === 'shared' && (
          <div className="flex flex-col items-center pt-16 text-center">
            <svg width="260" height="230" viewBox="0 0 260 230" fill="none" stroke="#4a1d4d" strokeWidth="3.2" strokeLinejoin="round"><path d="M50 40l60 14-12 36-48-10z" fill="#b4aed0" /><rect x="120" y="60" width="86" height="82" rx="8" fill="#b4aed0" /><rect x="68" y="124" width="86" height="82" rx="6" fill="#b4aed0" /><rect x="154" y="124" width="52" height="82" rx="6" fill="#b4aed0" /><path d="M150 18l14-6 6 18-14 6z" fill="#e6d9a0" /></svg>
            <p className="mt-8 text-[24px] font-bold">{t('Möchtest du ein Dokument teilen?')}</p>
            <p className="mt-3 text-[19px] text-sub">{t('Zusammenarbeit und Linkfreigaben sind in dieser Web-Version nicht verfügbar.')}</p>
          </div>
        )}
        {v === 'trash' && (
          trashed.length === 0 ? <p className="pt-10 text-center text-[19px] text-sub">{t('Der Papierkorb ist leer.')}</p> : (
            <Group className="!mx-0">{trashed.map((n) => (
              <Row as="div" key={n.id} icon={<div className="h-10 w-8 rounded bg-cover" style={{ backgroundImage: `url("${coverUri(n.cover, n.coverColor)}")` }} />} sub={fmtDate(n.deleted!, lang)}
                trailing={<span className="flex gap-2"><button className="rounded-full bg-chip px-3 py-1.5 text-[15px] font-semibold" onClick={() => lib.restore(n.id)}>{t('Wiederherstellen')}</button><button className="rounded-full bg-chip px-3 py-1.5 text-[15px] font-semibold text-danger" onClick={() => lib.purge(n.id)}>{t('Endgültig löschen')}</button></span>}>{n.title || t('Unbenannt')}</Row>
            ))}</Group>
          )
        )}
        {v === 'cloud' && (
          <>
            <p className="mb-4 max-w-xl text-[18px] text-sub">{t('Notizbücher werden nur in diesem Browser gespeichert. Sichere sie als Datei, um sie auf ein anderes Gerät zu übertragen.')}</p>
            <Group className="!mx-0 max-w-xl">
              <Row icon={<Download size={22} />} onClick={() => { download(`notizbuecher-${new Date().toISOString().slice(0, 10)}.json`, lib.backup(), 'application/json'); onToast(t('Backup heruntergeladen')) }}>{t('Backup herunterladen')}</Row>
              <Row icon={<Upload size={22} />} onClick={() => file.current?.click()}>{t('Backup wiederherstellen')}</Row>
            </Group>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { lib.restoreBackup(await f.text()); onToast(t('Backup wiederhergestellt')) } catch { onToast(t('Ungültige Backup-Datei')) } }} />
          </>
        )}
      </main>

      <input ref={pdfIn} type="file" accept="application/pdf,.pdf,application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void importFile(f) }} />
      {/* + menu: New notebook / New folder */}
      <Popover anchor={plusBtn} open={plus} onClose={() => setPlus(false)} width={300} align="right">
        <PopTitle>{t('Neu')}</PopTitle>
        <Group>
          <Row icon={<NotebookPen size={22} />} onClick={() => { setPlus(false); onNew() }}>{t('Notizbuch')}</Row>
          <Row icon={<FolderPlus size={22} />} onClick={() => { setPlus(false); lib.go('home'); setFsheet({ mode: 'create' }) }}>{t('Ordner')}</Row>
          <Row icon={<Import size={22} />} onClick={() => { setPlus(false); pdfIn.current?.click() }}>{t('Importieren')}</Row>
        </Group>
        <div className="h-4" />
      </Popover>

      {/* notebook / folder item menu */}
      <Popover anchor={menuAnchor} open={!!menu && !!(menuNb || menuFolder)} onClose={() => setMenu(null)} width={310} align="left">
        {menuView === 'move' && menuNb ? (
          <>
            <PopTitle left={<BackBtn onClick={() => setMenuView('main')} />}>{t('Verschieben')}</PopTitle>
            <Group>
              <Row onClick={() => { lib.moveNotebook(menuNb.id, null); setMenu(null) }} trailing={(menuNb.folder ?? null) === null ? <span className="text-accent">✓</span> : null}>{t('Dokumente')}</Row>
              {folderOpts().map((f) => <Row key={f.id} icon={<FolderGlyph color={f.color} icon={f.icon} width={30} />} onClick={() => { lib.moveNotebook(menuNb.id, f.id); setMenu(null) }} trailing={menuNb.folder === f.id ? <span className="text-accent">✓</span> : null}>{f.name}</Row>)}
            </Group>
            <div className="h-4" />
          </>
        ) : (
          <div className="pt-3">
            <Group>
              {menuNb && <>
                <Row onClick={() => { lib.toggleStar(menuNb.id); setMenu(null) }}>{t(menuNb.starred ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen')}</Row>
                <Row onClick={() => { setRename({ id: menuNb.id, title: menuNb.title }); setMenu(null) }}>{t('Umbenennen')}</Row>
                <Row onClick={() => { setCoverFor(menuNb); setMenu(null) }}>{t('Umschlag ändern')}</Row>
                <Row onClick={() => { lib.duplicate(menuNb.id, t('Kopie')); setMenu(null) }}>{t('Duplizieren')}</Row>
                <Row chevron onClick={() => setMenuView('move')}>{t('Verschieben')}</Row>
                <Row danger onClick={() => { lib.trash(menuNb.id); setMenu(null) }}>{t('In den Papierkorb')}</Row>
              </>}
              {menuFolder && <>
                <Row onClick={() => { setFsheet({ mode: 'edit', id: menuFolder.id }); setMenu(null) }}>{t('Name, Farbe oder Symbol ändern')}</Row>
                <Row danger onClick={() => { lib.deleteFolder(menuFolder.id); setMenu(null); onToast(t('Ordner gelöscht – Inhalt wurde eine Ebene nach oben verschoben')) }}>{t('Ordner löschen')}</Row>
              </>}
            </Group>
            <div className="h-3" />
          </div>
        )}
      </Popover>

      <Popover anchor={sortBtn} open={sortOpen} onClose={() => setSortOpen(false)} width={280} align="left">
        <PopTitle>{t('Sortieren nach')}</PopTitle>
        <Group>
          {(['date', 'created', 'name'] as const).map((k) => (
            <Row key={k} onClick={() => { lib.setSort(k); setSortOpen(false) }} trailing={lib.sort === k ? <span className="text-accent">✓</span> : null}>{t(k === 'name' ? 'Name' : k === 'created' ? 'Erstellt' : 'Zuletzt bearbeitet')}</Row>
          ))}
        </Group>
        <div className="h-4" />
      </Popover>
      <TemplatePicker open={!!coverFor} mode="new" coverOnly initial={{ template: 'wide', color: 'white', size: 'a4p', cover: coverFor?.cover ?? 'hell', coverColor: coverFor?.coverColor ?? '#02BDE4', title: coverFor?.title ?? '' }}
        onClose={() => setCoverFor(null)} onConfirm={(r) => { if (coverFor) lib.patch(coverFor.id, { cover: r.cover, coverColor: r.coverColor, title: r.title.trim() || coverFor.title }); setCoverFor(null) }} />
      <FolderSheet open={!!fsheet} mode={fsheet?.mode ?? 'create'} initial={formInit} onClose={() => setFsheet(null)}
        onDone={(f) => { if (fsheet?.mode === 'edit' && fsheet.id) lib.patchFolder(fsheet.id, f); else lib.createFolder(f); setFsheet(null) }} />
      <Sheet open={!!rename} onClose={() => setRename(null)} width={420}>
        <div className="relative flex h-[64px] items-center justify-center"><div className="absolute left-3 top-3"><CloseBtn onClick={() => setRename(null)} /></div><h2 className="text-[21px] font-semibold">{t('Umbenennen')}</h2></div>
        <div className="px-5 pb-6">
          <input autoFocus value={rename?.title ?? ''} onChange={(e) => setRename((r) => r && { ...r, title: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && rename) { lib.patch(rename.id, { title: rename.title.trim() || t('Unbenannt') }); setRename(null) } }} aria-label={t('Titel')} className="w-full rounded-2xl bg-card px-4 py-3.5 text-[20px] outline-none" />
          <button onClick={() => { if (rename) lib.patch(rename.id, { title: rename.title.trim() || t('Unbenannt') }); setRename(null) }} className="mt-3 w-full rounded-2xl bg-gn-ui-action py-3 text-[18px] font-semibold text-white">{t('Fertig')}</button>
        </div>
      </Sheet>

      <Popover anchor={gear} open={acct} onClose={() => setAcct(false)} width={400} align="right">
        {view === 'settings' ? (
          <Push id="settings" dir={1}><PopTitle left={<BackBtn onClick={() => setView('menu')} />}>{t('Einstellungen')}</PopTitle><SettingsBody /></Push>
        ) : (
          <div className="pb-3 pt-3">
            <Group><Row as="div" icon={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-chip"><User size={24} /></span>} sub={t('Lokal in diesem Browser gespeichert')}><span className="text-[22px] font-semibold">{t('Gast')}</span></Row></Group>
            <div className="h-3" />
            <Group>
              <Row icon={<Settings size={22} />} chevron onClick={() => setView('settings')}>{t('Einstellungen')}</Row>
              <Row icon={<Cloud size={22} />} onClick={() => { lib.go('cloud'); setAcct(false) }}>{t('Cloud & Backup')}</Row>
              <Row icon={<Trash2 size={22} />} onClick={() => { lib.go('trash'); setAcct(false) }}>{t('Papierkorb')}</Row>
            </Group>
            <div className="h-3" />
            <Group><Row icon={<Info size={22} />} onClick={() => { setAcct(false); setInfo('about') }}>{t('Über')}</Row></Group>
            <div className="h-3" />
            <Group>{['Datenschutzrichtlinie', 'Nutzungsbedingungen', 'Impressum'].map((x) => <Row key={x} ext onClick={() => { setAcct(false); setInfo('legal') }}>{t(x)}</Row>)}</Group>
          </div>
        )}
      </Popover>
      <Sheet open={!!info} onClose={() => setInfo(null)} width={460}>
        <div className="relative flex h-[64px] items-center justify-center"><div className="absolute left-3 top-3"><CloseBtn onClick={() => setInfo(null)} /></div><h2 className="text-[21px] font-semibold">{t(info === 'about' ? 'Über' : 'Rechtliches')}</h2></div>
        {info === 'about' && <div className="flex flex-col items-center gap-2 pb-2"><GoodnotesLogo size={84} tile className="rounded-[20px] shadow-gn-float" /><span className="gn-title text-[26px]">Goodnotes</span></div>}
        <p className="px-6 pb-8 pt-2 text-[18px] leading-relaxed text-sub">{t('Dies ist ein inoffizieller UI-Nachbau zu Demonstrationszwecken. Alle Daten bleiben lokal in deinem Browser; es gibt kein Konto und keine Server-Anbindung.')}</p>
      </Sheet>
    </div>
  )
}
