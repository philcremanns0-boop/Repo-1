import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { COVERS, COVER_COLORS, coverUri, type CoverId } from '../../lib/covers'
import { PAPER_COLORS, SIZES, TEMPLATE_GROUPS, colorsFor, templateLabel, type PaperColor, type SizeId, type TemplateId } from '../../lib/paper'
import { PaperThumb } from '../PaperThumb'
import { CloseBtn, Segmented, Sheet } from '../ui'
import { useT } from '../../context/Settings'

export interface TemplateResult { template: TemplateId; color: PaperColor; size: SizeId; cover: CoverId; coverColor: string; title: string }
interface Props {
  open: boolean
  mode: 'new' | 'page'
  initial: TemplateResult
  onClose: () => void
  onConfirm: (r: TemplateResult) => void
  onImportImage?: (file: File, r: TemplateResult) => void
}
export default function TemplatePicker({ open, mode, initial, onClose, onConfirm, onImportImage }: Props) {
  const t = useT()
  const [tab, setTab] = useState<'cover' | 'paper'>('paper')
  const [r, setR] = useState(initial)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setR(initial); setTab('paper') } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const pickTpl = (template: TemplateId) => setR((x) => ({ ...x, template, color: colorsFor(template).includes(x.color) ? x.color : 'white' }))
  const Dot = ({ c, on, onClick }: { c: string; on?: boolean; onClick?: () => void }) => (
    <span role="button" tabIndex={0} aria-label={c} onClick={(e) => { e.stopPropagation(); onClick?.() }} className={`h-[15px] w-[15px] rounded-full ${on ? 'ring-2 ring-accent ring-offset-1 ring-offset-pop' : ''}`} style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
  )
  const importTile = (
    <button onClick={() => file.current?.click()} className="flex aspect-[0.7] flex-col items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-accent text-[17px] text-accent"><Plus size={26} />{t('Importieren')}</button>
  )
  return (
    <Sheet open={open} onClose={onClose} width={700} className="h-[min(900px,94vh)]">
      <div className="relative flex h-[76px] shrink-0 items-center justify-center bg-pop">
        <div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div>
        {mode === 'new' ? <Segmented value={tab} onChange={setTab} className="min-w-[320px]" options={[{ id: 'cover', label: t('Umschlag') }, { id: 'paper', label: t('Papier') }]} /> : <h2 className="text-[22px] font-semibold">{t('Vorlage wechseln')}</h2>}
        <button aria-label={t('Fertig')} onClick={() => onConfirm(r)} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#2f9bf0] text-white shadow-pill"><Check size={26} strokeWidth={3} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-6 px-6 pb-6 pt-2 sm:flex-nowrap">
          <div className="flex w-[150px] shrink-0 flex-col items-center gap-2">
            <span className="text-[14px] uppercase tracking-wide text-sub">{t(tab === 'cover' ? 'Umschlag' : 'Papier')}</span>
            {tab === 'cover'
              ? <div className="aspect-[0.7] w-[120px] rounded-md bg-cover shadow-[0_2px_8px_rgba(0,0,0,.35)]" style={{ backgroundImage: `url("${coverUri(r.cover, r.coverColor)}")` }} />
              : <PaperThumb template={r.template} color={r.color} size={r.size} className="w-[120px] rounded-md shadow-[0_2px_8px_rgba(0,0,0,.3)]" />}
            <span className="text-[18px] text-sub">{tab === 'cover' ? t(COVERS.find((c) => c.id === r.cover)?.label ?? '') : t(templateLabel(r.template))}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="px-1 pb-1.5 text-[14px] uppercase tracking-wide text-sub">{t(tab === 'cover' ? 'Umschlag-Vorlagen' : 'Papier-Vorlagen')}</div>
            <div className="overflow-hidden rounded-[18px] bg-card">
              {mode === 'new' && <label className="flex items-center justify-between px-4 py-3 text-[19px]">{t('Titel')}<input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} placeholder={t('Unbenannt')} className="w-[55%] bg-transparent text-right text-[19px] text-sub outline-none" /></label>}
              <label className="relative flex items-center justify-between border-t border-hair px-4 py-3 text-[19px] first:border-t-0">{t('Größe')}
                <span className="flex items-center gap-1 text-sub">{t(SIZES[r.size].label)}<ChevronDown size={18} /></span>
                <select aria-label={t('Größe')} value={r.size} onChange={(e) => setR({ ...r, size: e.target.value as SizeId })} className="absolute inset-0 opacity-0">{(Object.keys(SIZES) as SizeId[]).map((k) => <option key={k} value={k}>{t(SIZES[k].label)}</option>)}</select></label>
              <label className="relative flex items-center justify-between border-t border-hair px-4 py-3 text-[19px]">{t('Farbe')}
                <span className="flex items-center gap-2 text-sub"><span className="h-[22px] w-[22px] rounded-full" style={{ background: PAPER_COLORS[r.color].bg, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />{t(PAPER_COLORS[r.color].label)}<ChevronDown size={18} /></span>
                <select aria-label={t('Farbe')} value={r.color} onChange={(e) => setR({ ...r, color: e.target.value as PaperColor })} className="absolute inset-0 opacity-0">{(Object.keys(PAPER_COLORS) as PaperColor[]).map((k) => <option key={k} value={k}>{t(PAPER_COLORS[k].label)}</option>)}</select></label>
            </div>
          </div>
        </div>
        <div className="border-t border-hair bg-card px-5 pb-8 pt-5 dark:bg-[#1c1c1e]">
          <h3 className="mb-1 text-[28px] font-bold">{t(tab === 'cover' ? 'Umschlag-Vorlagen' : 'Papier-Vorlagen')}</h3>
          {tab === 'paper' ? TEMPLATE_GROUPS.map((g) => (
            <section key={g.title}>
              <h4 className="pb-3 pt-5 text-[22px] font-bold">{t(g.title)}</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-x-3 gap-y-5">
                {g.items.map((it) => (
                  <div key={it.id} className="flex flex-col items-center gap-1.5">
                    <button onClick={() => pickTpl(it.id)} className="relative w-full" aria-label={t(it.label)}>
                      <PaperThumb template={it.id} color={r.template === it.id ? r.color : 'white'} size={r.size} className="w-full rounded-[10px] shadow-[0_1px_6px_rgba(0,0,0,.22)]" />
                      {r.template === it.id && <span className="absolute -bottom-3 left-1/2 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#1a82e0] text-white"><Check size={17} strokeWidth={3} /></span>}
                    </button>
                    <span className="pt-2 text-center text-[16px] leading-tight">{t(it.label)}</span>
                    <span className="flex items-center gap-1.5">{colorsFor(it.id).slice(0, 3).map((c) => <Dot key={c} c={PAPER_COLORS[c].bg} on={r.template === it.id && r.color === c} onClick={() => setR({ ...r, template: it.id, color: c })} />)}{colorsFor(it.id).length > 3 && <span className="text-[13px] text-sub">+{colorsFor(it.id).length - 3}</span>}</span>
                  </div>
                ))}
                {g.title === 'Herkömmlich' && onImportImage && importTile}
              </div>
            </section>
          )) : [...new Set(COVERS.map((c) => c.group))].map((g) => (
            <section key={g}>
              <h4 className="pb-3 pt-5 text-[22px] font-bold">{t(g)}</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-x-3 gap-y-5">
                {COVERS.filter((c) => c.group === g).map((c) => (
                  <div key={c.id} className="flex flex-col items-center gap-1.5">
                    <button onClick={() => setR({ ...r, cover: c.id })} aria-label={t(c.label)} className={`relative aspect-[0.7] w-full rounded-[10px] bg-cover shadow-[0_1px_6px_rgba(0,0,0,.3)] ${r.cover === c.id ? 'ring-2 ring-accent ring-offset-2 ring-offset-card' : ''}`} style={{ backgroundImage: `url("${coverUri(c.id, r.cover === c.id ? r.coverColor : COVER_COLORS[0])}")` }} />
                    <span className="pt-1 text-[16px]">{t(c.label)}</span>
                    <span className="flex items-center gap-1.5">{COVER_COLORS.slice(0, 4).map((col) => <Dot key={col} c={col} on={r.cover === c.id && r.coverColor === col} onClick={() => setR({ ...r, cover: c.id, coverColor: col })} />)}<span className="text-[13px] text-sub">+{COVER_COLORS.length - 4}</span></span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportImage?.(f, r); e.target.value = '' }} />
    </Sheet>
  )
}
