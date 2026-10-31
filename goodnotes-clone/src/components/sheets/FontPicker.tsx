import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Plus, Search, Trash2 } from '../glyphs'
import { FONTS, customFonts, fontStack } from '../../lib/fonts'
import { importFont, listFonts, loadCustomFonts, removeFont } from '../../lib/customFonts'
import { BackBtn, CloseBtn, Group, Push, Sheet } from '../ui'
import { useT } from '../../context/Settings'

/** "Schrift auswählen" sheet: recent, own fonts, A–Z system fonts with search, and "Schriften verwalten". */
export default function FontPicker({ open, onClose, current, recent, onPick }: { open: boolean; onClose: () => void; current: string; recent: string[]; onPick: (f: string) => void }) {
  const t = useT()
  const [q, setQ] = useState('')
  const [manage, setManage] = useState(false)
  const [mine, setMine] = useState<string[]>(customFonts())
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setManage(false); setQ(''); void loadCustomFonts().then((l) => setMine(l.map((f) => f.name))) } }, [open])
  const needle = q.trim().toLowerCase()
  const groups = useMemo(() => {
    const m = new Map<string, string[]>()
    FONTS.filter((f) => f.toLowerCase().includes(needle)).forEach((f) => { const k = f[0].toUpperCase(); m.set(k, [...(m.get(k) ?? []), f]) })
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [needle])
  const fam = (f: string) => (mine.includes(f) ? `"${f}", sans-serif` : fontStack(f))
  const row = (f: string) => (
    <button key={f} onClick={() => { onPick(f); onClose() }} className="flex w-full items-center justify-between border-t border-hair px-4 py-[14px] text-left first:border-t-0 active:bg-chip">
      <span style={{ fontFamily: fam(f), fontSize: 22 }} className={f === current ? 'text-accent' : ''}>{f}</span><ChevronRight size={18} className="text-sub" />
    </button>
  )
  const H = ({ children }: { children: React.ReactNode }) => <div className="px-3 pb-2 pt-5 text-[21px] font-semibold text-sub">{children}</div>
  const add = async (fs: FileList | null) => {
    setErr('')
    for (const f of Array.from(fs ?? [])) {
      try { await importFont(f) } catch { setErr(t('Schrift konnte nicht geladen werden') + `: ${f.name}`) }
    }
    setMine(listFonts().map((x) => x.name))
  }
  return (
    <Sheet open={open} onClose={onClose} width={560} className="h-[min(860px,92vh)]">
      {manage ? (
        <Push id="manage" dir={1}>
          <div className="relative flex h-[64px] shrink-0 items-center justify-center"><div className="absolute left-3 top-3"><BackBtn onClick={() => setManage(false)} /></div><h2 className="text-[22px] font-semibold">{t('Schriften verwalten')}</h2></div>
          <div className="px-3 pb-6">
            <p className="px-3 pb-3 text-[16px] leading-snug text-sub">{t('Importiere eigene Schriftdateien (TTF, OTF, WOFF). Sie stehen danach in allen Notizbüchern zur Verfügung.')}</p>
            <Group className="!mx-0">
              {mine.map((f) => (
                <div key={f} className="flex items-center justify-between border-t border-hair px-4 py-[14px] first:border-t-0">
                  <span style={{ fontFamily: `"${f}"`, fontSize: 22 }}>{f}</span>
                  <button aria-label={`${t('Löschen')} ${f}`} onClick={async () => { await removeFont(f); setMine(listFonts().map((x) => x.name)) }} className="text-danger"><Trash2 size={20} /></button>
                </div>
              ))}
              <button onClick={() => file.current?.click()} className="flex w-full items-center gap-3 border-t border-hair px-4 py-[14px] text-left text-[19px] text-accent first:border-t-0"><Plus size={22} />{t('Schrift importieren')}</button>
            </Group>
            {err && <p className="px-3 pt-3 text-[15px] text-danger">{err}</p>}
          </div>
          <input ref={file} type="file" multiple accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" hidden onChange={(e) => { void add(e.target.files); e.target.value = '' }} />
        </Push>
      ) : (
        <>
          <div className="relative flex h-[64px] shrink-0 items-center justify-center"><div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div><h2 className="text-[22px] font-semibold">{t('Schrift auswählen')}</h2></div>
          <div className="shrink-0 px-4 pb-2"><div className="flex items-center gap-2 rounded-full bg-card px-4 py-3 shadow-[0_0_0_1px_var(--hair)]"><Search size={20} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Suchen')} className="min-w-0 flex-1 bg-transparent text-[20px] outline-none" /></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
            {!needle && recent.length > 0 && (<><H>{t('Letzte')}</H><Group className="!mx-0">{recent.map(row)}</Group></>)}
            {mine.filter((f) => f.toLowerCase().includes(needle)).length > 0 && (<><H>{t('Eigene Schriften')}</H><Group className="!mx-0">{mine.filter((f) => f.toLowerCase().includes(needle)).map(row)}</Group></>)}
            {groups.map(([k, fs]) => (<div key={k}><H>{k}</H><Group className="!mx-0">{fs.map(row)}</Group></div>))}
            <Group className="!mx-0 mt-8">
              <button onClick={() => setManage(true)} className="flex w-full items-center gap-3 px-4 py-[14px] text-left">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chip text-[15px] text-sub">Aa</span>
                <span className="flex-1 text-[20px] font-medium">{t('Schriften verwalten')}</span><ChevronRight size={18} className="text-sub" />
              </button>
            </Group>
          </div>
        </>
      )}
    </Sheet>
  )
}
