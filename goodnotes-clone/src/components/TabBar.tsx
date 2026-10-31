import { useRef, useState } from 'react'
import { ChevronDown, X } from './glyphs'
import type { NbMeta } from '../store/types'
import type { View } from '../store/useLibrary'
import { HomeI } from './icons'
import { Popover } from './ui'
import { useT } from '../context/Settings'

interface Props {
  tabs: NbMeta[]
  view: View
  onHome: () => void
  onOpen: (id: string) => void
  onClose: (id: string) => void
  onRename: (id: string, title: string) => void
  onTrash: (id: string) => void
}
export default function TabBar({ tabs, view, onHome, onOpen, onClose, onRename, onTrash }: Props) {
  const t = useT()
  const [menu, setMenu] = useState<string | null>(null)
  const chev = useRef<HTMLElement | null>(null)
  const [name, setName] = useState('')
  const home = view === 'home' || view === 'shared' || view === 'trash' || view === 'cloud'
  const cur = tabs.find((x) => x.id === menu)
  return (
    <div className="flex h-[36px] shrink-0 items-end bg-tab pl-1 text-[15px] text-white">
      <button aria-label={t('Dokumente')} onClick={onHome} className={`mx-0.5 flex h-[33px] w-[52px] items-center justify-center rounded-t-[10px] ${home ? 'bg-bar' : 'text-white/70'}`}><HomeI size={20} /></button>
      <div className="no-scrollbar flex min-w-0 flex-1 items-end overflow-x-auto">
        {tabs.map((n) => {
          const active = view === n.id
          return (
            <div key={n.id} className={`group relative flex h-[33px] min-w-[150px] max-w-[250px] flex-1 items-center rounded-t-[10px] pl-3.5 pr-1.5 ${active ? 'bg-bar' : 'text-white/70'}`}>
              {!active && <span className="absolute left-0 top-1.5 h-[20px] w-px bg-white/15" />}
              <button className="min-w-0 flex-1 truncate text-left" onClick={() => onOpen(n.id)}>{n.title || t('Unbenannt')}</button>
              {active && (
                <button ref={(el) => { if (active) chev.current = el }} aria-label={t('Notizbuch-Menü')} className="px-1" onClick={(e) => { chev.current = e.currentTarget; setName(n.title); setMenu(menu === n.id ? null : n.id) }}>
                  <ChevronDown size={15} />
                </button>
              )}
              <button aria-label={t('Schließen')} className="flex h-6 w-6 items-center justify-center rounded-full opacity-80 hover:bg-white/10" onClick={() => onClose(n.id)}><X size={14} /></button>
            </div>
          )
        })}
      </div>
      <Popover anchor={chev} open={!!menu && !!cur} onClose={() => setMenu(null)} width={300} align="left">
        <div className="p-3">
          <label className="mb-1 block px-1 text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Titel')}</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && menu) { onRename(menu, name.trim() || t('Unbenannt')); setMenu(null) } }}
            className="w-full rounded-xl bg-card px-3 py-2.5 text-[17px] outline-none" />
          <div className="mt-2 flex gap-2">
            <button className="flex-1 rounded-xl bg-accent py-2.5 text-[16px] font-semibold text-white" onClick={() => { if (menu) onRename(menu, name.trim() || t('Unbenannt')); setMenu(null) }}>{t('Umbenennen')}</button>
            <button className="rounded-xl bg-card px-3 py-2.5 text-[16px] text-danger" onClick={() => { if (menu) onTrash(menu); setMenu(null) }}>{t('Löschen')}</button>
          </div>
        </div>
      </Popover>
    </div>
  )
}
