import { useMemo, useState } from 'react'
import { ChevronRight, Search } from '../glyphs'
import { FONTS, fontStack } from '../../lib/fonts'
import { CloseBtn, Group, Sheet } from '../ui'
import { useT } from '../../context/Settings'

export default function FontPicker({ open, onClose, current, recent, onPick }: { open: boolean; onClose: () => void; current: string; recent: string[]; onPick: (f: string) => void }) {
  const t = useT()
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const m = new Map<string, string[]>()
    FONTS.filter((f) => f.toLowerCase().includes(q.trim().toLowerCase())).forEach((f) => { const k = f[0].toUpperCase(); m.set(k, [...(m.get(k) ?? []), f]) })
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [q])
  const row = (f: string) => (
    <button key={f} onClick={() => { onPick(f); onClose() }} className="flex w-full items-center justify-between border-t border-hair px-4 py-[14px] text-left first:border-t-0 active:bg-chip">
      <span style={{ fontFamily: fontStack(f), fontSize: 22 }} className={f === current ? 'text-accent' : ''}>{f}</span><ChevronRight size={18} className="text-sub" />
    </button>
  )
  return (
    <Sheet open={open} onClose={onClose} width={560} className="h-[min(860px,92vh)]">
      <div className="relative flex h-[64px] shrink-0 items-center justify-center"><div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div><h2 className="text-[22px] font-semibold">{t('Schrift auswählen')}</h2></div>
      <div className="shrink-0 px-4 pb-2"><div className="flex items-center gap-2 rounded-full bg-card px-4 py-3 shadow-[0_0_0_1px_var(--hair)]"><Search size={20} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Suchen')} className="min-w-0 flex-1 bg-transparent text-[20px] outline-none" /></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {!q && recent.length > 0 && (<><div className="px-3 pb-2 pt-5 text-[21px] font-semibold text-sub">{t('Letzte')}</div><Group className="!mx-0">{recent.map(row)}</Group></>)}
        {groups.map(([k, fs]) => (<div key={k}><div className="px-3 pb-2 pt-5 text-[21px] font-semibold text-sub">{k}</div><Group className="!mx-0">{fs.map(row)}</Group></div>))}
      </div>
    </Sheet>
  )
}
