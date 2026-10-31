import { useEffect, useState } from 'react'
import { Check } from '../glyphs'
import { CloseBtn, Sheet } from '../ui'
import { FolderGlyph, FOLDER_COLORS, FOLDER_ICONS } from '../FolderGlyph'
import { Wheel, hex2hsv, hsv2hex } from '../popovers/ColorPopover'
import { useT } from '../../context/Settings'

export interface FolderForm { name: string; color: string; icon: string }
/** Create / edit a folder: name, colour (presets + custom hex / wheel) and optional icon. */
export default function FolderSheet({ open, mode, initial, onClose, onDone }: { open: boolean; mode: 'create' | 'edit'; initial: FolderForm; onClose: () => void; onDone: (f: FolderForm) => void }) {
  const t = useT()
  const [f, setF] = useState(initial)
  const [custom, setCustom] = useState(false)
  const [hex, setHex] = useState(initial.color)
  useEffect(() => { if (open) { setF(initial); setHex(initial.color); setCustom(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const setColor = (c: string) => { setF((x) => ({ ...x, color: c })); setHex(c) }
  const hsv = hex2hsv(f.color)
  const ok = f.name.trim().length > 0
  return (
    <Sheet open={open} onClose={onClose} width={480}>
      <div className="relative flex h-[68px] shrink-0 items-center justify-center">
        <div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div>
        <h2 className="text-[21px] font-semibold">{t(mode === 'create' ? 'Neuer Ordner' : 'Ordner bearbeiten')}</h2>
        <button aria-label={t('Fertig')} disabled={!ok} onClick={() => onDone({ ...f, name: f.name.trim() })} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-gn-ui-action text-white shadow-pill disabled:opacity-40"><Check size={26} strokeWidth={3} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex justify-center pb-3 pt-1"><FolderGlyph color={f.color} icon={f.icon} width={140} /></div>
        <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && ok && onDone({ ...f, name: f.name.trim() })}
          placeholder={t('Ordnername')} aria-label={t('Ordnername')} className="w-full rounded-2xl bg-card px-4 py-3.5 text-center text-[22px] font-semibold outline-none" />
        <div className="px-1 pb-2 pt-5 text-[14px] uppercase tracking-wide text-sub">{t('Farbe')}</div>
        <div className="flex flex-wrap gap-3 rounded-2xl bg-card p-4">
          {FOLDER_COLORS.map((c) => (
            <button key={c} aria-label={c} aria-pressed={f.color === c} onClick={() => setColor(c)} className={`flex h-10 w-10 items-center justify-center rounded-full ${f.color === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`} style={{ background: c }}>
              {f.color === c && <Check size={18} color="#fff" strokeWidth={3} />}
            </button>
          ))}
          <button aria-label={t('Eigene Farbe')} onClick={() => setCustom((v) => !v)} className={`h-10 w-10 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] ${custom ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`} />
        </div>
        {custom && (
          <div className="mt-3 rounded-2xl bg-card p-4">
            <Wheel hsv={hsv} onChange={(h, s) => setColor(hsv2hex(h, s, hsv[2] || 1))} />
            <div className="mt-3 flex items-center gap-2">
              <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: f.color }} />
              <input value={hex} aria-label="Hex" maxLength={7} spellCheck={false} onChange={(e) => { const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value; setHex(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) setF((x) => ({ ...x, color: v.toLowerCase() })) }}
                className="min-w-0 flex-1 rounded-xl bg-chip px-3 py-2.5 font-mono text-[17px] uppercase outline-none" />
            </div>
          </div>
        )}
        <div className="px-1 pb-2 pt-5 text-[14px] uppercase tracking-wide text-sub">{t('Symbol')}</div>
        <div className="flex flex-wrap gap-2 rounded-2xl bg-card p-3">
          {Object.entries(FOLDER_ICONS).map(([id, I]) => (
            <button key={id} aria-label={id} aria-pressed={f.icon === id} onClick={() => setF({ ...f, icon: id })} className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.icon === id ? 'bg-accent/20 text-accent' : 'bg-chip'}`}>{I ? <I size={22} /> : <span className="text-[13px]">{t('Kein')}</span>}</button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}
