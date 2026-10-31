import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Cloud, Download, Folder, Info, LayoutList, Plus, Settings, Trash2, Upload, User } from 'lucide-react'
import type { Library as Lib } from '../store/useLibrary'
import { coverUri } from '../lib/covers'
import { download } from '../lib/export'
import { Group, Popover, PopTitle, Row, Sheet, BackBtn, CloseBtn } from './ui'
import { SettingsBody } from './popovers/SimplePopovers'
import { SidebarI, ShareI } from './icons'
import { useSettings, useT } from '../context/Settings'

const fmtDate = (ts: number, lang: string) => {
  const d = new Date(ts), now = new Date()
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return d.toDateString() === now.toDateString() ? `${lang === 'de' ? 'Heute' : 'Today'}, ${time}` : `${d.toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${time}`
}
const Pill = ({ children }: { children: React.ReactNode }) => <div className="flex items-center rounded-full border border-hair bg-float px-1 shadow-pill">{children}</div>

export default function Library({ lib, onNew, onToast }: { lib: Lib; onNew: () => void; onToast: (m: string) => void }) {
  const t = useT()
  const { lang } = useSettings()
  const [side, setSide] = useState(false)
  const [acct, setAcct] = useState(false)
  const [view, setView] = useState<'menu' | 'settings'>('menu')
  const [info, setInfo] = useState<'about' | 'legal' | null>(null)
  const gear = useRef<HTMLButtonElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const nbs = lib.notebooks.filter((n) => !n.deleted)
  const trashed = lib.notebooks.filter((n) => n.deleted)
  const v = lib.view === 'shared' || lib.view === 'trash' || lib.view === 'cloud' ? lib.view : 'home'
  const title = v === 'home' ? 'Dokumente' : v === 'shared' ? 'Geteilt' : v === 'trash' ? 'Papierkorb' : 'Cloud & Backup'

  const nav = [{ id: 'home', label: 'Dokumente', icon: <Folder size={20} /> }, { id: 'shared', label: 'Geteilt', icon: <ShareI size={20} /> }, { id: 'cloud', label: 'Cloud & Backup', icon: <Cloud size={20} /> }, { id: 'trash', label: 'Papierkorb', icon: <Trash2 size={20} /> }] as const
  return (
    <div className="flex min-h-0 flex-1 bg-canvas">
      {side && (
        <aside className="w-[260px] shrink-0 border-r border-hair bg-pop px-3 pt-20">
          {nav.map((n) => (
            <button key={n.id} onClick={() => lib.go(n.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[18px] ${v === n.id ? 'bg-accent/15 text-accent' : ''}`}>{n.icon}{t(n.label)}</button>
          ))}
        </aside>
      )}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto px-6 pb-16">
        <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between bg-canvas/90 px-4 py-3 backdrop-blur">
          <Pill><button aria-label={t('Seitenleiste')} onClick={() => setSide((s) => !s)} className="flex h-11 w-11 items-center justify-center"><SidebarI size={24} /></button></Pill>
          <Pill>
            <button aria-label={t('Neues Notizbuch')} onClick={onNew} className="flex h-11 w-11 items-center justify-center"><Plus size={24} /></button>
            <button ref={gear} aria-label={t('Einstellungen')} onClick={() => { setView('menu'); setAcct((a) => !a) }} className="flex h-11 w-11 items-center justify-center"><Settings size={23} /></button>
          </Pill>
        </div>
        <h1 className="pb-5 pt-2 text-[44px] font-extrabold leading-none tracking-tight">{t(title)}</h1>

        {v === 'home' && (
          <>
            <div className="mb-8 flex items-center gap-3 text-[22px] font-medium text-sub"><LayoutList size={26} />{t('Alle')}</div>
            {nbs.length === 0 ? (
              <div className="flex flex-col items-center pt-16 text-center">
                <p className="text-[22px] font-semibold">{t('Noch keine Notizbücher')}</p>
                <p className="mt-2 max-w-xs text-[18px] text-sub">{t('Erstelle dein erstes Notizbuch mit Umschlag und Papiervorlage.')}</p>
                <button onClick={onNew} className="mt-6 flex items-center gap-2 rounded-full bg-[#1a82e0] px-6 py-3 text-[19px] font-semibold text-white shadow-pill"><Plus size={22} />{t('Neues Notizbuch')}</button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-8 gap-y-12">
                {nbs.map((n) => (
                  <button key={n.id} onClick={() => lib.open(n.id)} className="group flex flex-col items-center text-center">
                    <div className="relative aspect-[0.77] w-[150px] overflow-hidden rounded-[6px] bg-cover shadow-[0_6px_14px_rgba(0,0,0,.28),0_0_0_.5px_rgba(0,0,0,.2)] transition-transform group-active:scale-[.97]" style={{ backgroundImage: `url("${coverUri(n.cover, n.coverColor)}")` }}>
                      <span className="absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent" />
                    </div>
                    <span className="mt-4 max-w-full truncate text-[21px] font-semibold">{n.title || t('Unbenannt')}</span>
                    <span className="mt-0.5 text-[16px] text-sub">{fmtDate(n.updated, lang)}</span>
                  </button>
                ))}
              </div>
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

      <Popover anchor={gear} open={acct} onClose={() => setAcct(false)} width={400} align="right">
        {view === 'settings' ? (
          <><PopTitle left={<BackBtn onClick={() => setView('menu')} />}>{t('Einstellungen')}</PopTitle><SettingsBody /></>
        ) : (
          <div className="pb-3 pt-3">
            <Group>
              <Row as="div" icon={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-chip"><User size={24} /></span>} sub={t('Lokal in diesem Browser gespeichert')}><span className="text-[22px] font-semibold">{t('Gast')}</span></Row>
            </Group>
            <div className="h-3" />
            <Group>
              <Row icon={<Settings size={22} />} chevron onClick={() => setView('settings')}>{t('Einstellungen')}</Row>
              <Row icon={<Cloud size={22} />} onClick={() => { lib.go('cloud'); setAcct(false) }}>{t('Cloud & Backup')}</Row>
              <Row icon={<Trash2 size={22} />} onClick={() => { lib.go('trash'); setAcct(false) }}>{t('Papierkorb')}</Row>
            </Group>
            <div className="h-3" />
            <Group><Row icon={<Info size={22} />} onClick={() => { setAcct(false); setInfo('about') }}>{t('Über')}</Row></Group>
            <div className="h-3" />
            <Group>
              {['Datenschutzrichtlinie', 'Nutzungsbedingungen', 'Impressum'].map((x) => <Row key={x} ext onClick={() => { setAcct(false); setInfo('legal') }}>{t(x)}</Row>)}
            </Group>
          </div>
        )}
      </Popover>
      <Sheet open={!!info} onClose={() => setInfo(null)} width={460}>
        <div className="relative flex h-[64px] items-center justify-center"><div className="absolute left-3 top-3"><CloseBtn onClick={() => setInfo(null)} /></div><h2 className="text-[21px] font-semibold">{t(info === 'about' ? 'Über' : 'Rechtliches')}</h2></div>
        <p className="px-6 pb-8 pt-2 text-[18px] leading-relaxed text-sub">{t('Dies ist ein inoffizieller UI-Nachbau zu Demonstrationszwecken. Alle Daten bleiben lokal in deinem Browser; es gibt kein Konto und keine Server-Anbindung.')}</p>
      </Sheet>
    </div>
  )
}
export { ChevronLeft, ChevronRight }
