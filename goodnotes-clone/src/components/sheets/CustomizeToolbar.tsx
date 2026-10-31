import { useRef, useState } from 'react'
import { Check, GripHorizontal, Minus, Plus } from 'lucide-react'
import { Group, Row, Segmented, Sheet } from '../ui'
import { useT } from '../../context/Settings'
import { ACC_META, TOOL_ICON, TOOL_LABEL } from '../Toolbar'
import { ALL_ACC, DEFAULT_ACC, DEFAULT_TOOLS, type ToolPrefs } from '../toolState'
import type { AccId, ToolId } from '../editorTypes'

function List<T extends string>({ items, label, Icon, onChange, canRemove, extra }: {
  items: T[]; label: (x: T) => string; Icon: (x: T) => React.ReactNode; onChange: (n: T[]) => void; canRemove: boolean; extra?: (x: T) => React.ReactNode
}) {
  const t = useT()
  const box = useRef<HTMLDivElement>(null)
  const drag = (e: React.PointerEvent, from: number) => {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId)
    let idx = from, arr = items
    const mv = (ev: PointerEvent) => {
      const r = box.current!.getBoundingClientRect(), rowH = r.height / arr.length
      const to = Math.max(0, Math.min(arr.length - 1, Math.floor((ev.clientY - r.top) / rowH)))
      if (to !== idx) { const n = [...arr]; const [m] = n.splice(idx, 1); n.splice(to, 0, m); arr = n; idx = to; onChange(n) }
    }
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  return (
    <Group><div ref={box}>
      {items.map((it, i) => (
        <div key={it} className="flex items-center gap-3 px-3.5 py-[13px] [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair">
          <button aria-label={t('Entfernen')} disabled={!canRemove} onClick={() => onChange(items.filter((x) => x !== it))} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-white disabled:opacity-40"><Minus size={16} strokeWidth={3} /></button>
          <span className="flex w-7 justify-center">{Icon(it)}</span>
          <span className="flex-1 text-[19px] font-medium">{t(label(it))}</span>
          {extra?.(it)}
          <button aria-label={t('Verschieben')} onPointerDown={(e) => drag(e, i)} className="cursor-grab touch-none text-sub"><GripHorizontal size={22} /></button>
        </div>
      ))}
    </div></Group>
  )
}
function More<T extends string>({ items, label, Icon, onAdd }: { items: T[]; label: (x: T) => string; Icon: (x: T) => React.ReactNode; onAdd: (x: T) => void }) {
  const t = useT()
  if (!items.length) return null
  return (
    <Group className="mt-4">{items.map((it) => (
      <Row key={it} onClick={() => onAdd(it)} icon={<span className="flex h-6 w-6 items-center justify-center rounded-full bg-good text-white"><Plus size={16} strokeWidth={3} /></span>}>
        <span className="flex items-center gap-3"><span>{Icon(it)}</span>{t(label(it))}</span>
      </Row>
    ))}</Group>
  )
}

export default function CustomizeToolbar({ open, onClose, prefs, set, onCustomizePen }: { open: boolean; onClose: () => void; prefs: ToolPrefs; set: (fn: (p: ToolPrefs) => ToolPrefs) => void; onCustomizePen: () => void }) {
  const t = useT()
  const [tab, setTab] = useState<'tools' | 'acc'>('tools')
  const hiddenTools = DEFAULT_TOOLS.filter((x) => !prefs.visibleTools.includes(x))
  const hiddenAcc = ALL_ACC.filter((x) => !prefs.visibleAcc.includes(x))
  const H = ({ children }: { children: React.ReactNode }) => <div className="px-4 pb-1.5 pt-3 text-[21px] font-semibold text-sub">{children}</div>
  const foot = (s: string) => <p className="px-4 pt-2 text-[16px] leading-snug text-sub">{t(s)}</p>
  return (
    <Sheet open={open} onClose={onClose} width={540} className="h-[min(820px,92vh)] !rounded-[34px]">
      <div className="relative flex h-[68px] shrink-0 items-center justify-center"><h2 className="text-[22px] font-semibold">{t('Werkzeugleiste anpassen')}</h2>
        <button aria-label={t('Fertig')} onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#2f9bf0] text-white"><Check size={24} strokeWidth={3} /></button></div>
      <div className="shrink-0 px-8 pb-1"><Segmented value={tab} onChange={setTab} options={[{ id: 'tools', label: t('Werkzeuge') }, { id: 'acc', label: t('Zubehör') }]} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-5">
        <H>{t('In der Werkzeugleiste sichtbar')}</H>
        {tab === 'tools' ? (
          <>
            <List<ToolId> items={prefs.visibleTools} label={TOOL_LABEL} Icon={(x) => { const I = TOOL_ICON(x); return <I size={24} /> }} canRemove={prefs.visibleTools.length > 1}
              onChange={(n) => set((p) => ({ ...p, visibleTools: n }))}
              extra={(x) => x === 'pen' ? <button onClick={() => { onClose(); onCustomizePen() }} className="mr-2 flex items-center text-[19px] text-accent">{t('Anpassen')} ›</button> : null} />
            <More<ToolId> items={hiddenTools} label={TOOL_LABEL} Icon={(x) => { const I = TOOL_ICON(x); return <I size={24} /> }} onAdd={(x) => set((p) => ({ ...p, visibleTools: [...p.visibleTools, x] }))} />
            {foot('Mindestens ein Werkzeug muss in der Werkzeugleiste sichtbar sein.')}
            {foot('Bei Platzmangel werden einige Werkzeuge, die du auf sichtbar gestellt hast, in das Overflow-Menü bewegt.')}
            <Group className="mt-6"><Row danger onClick={() => set((p) => ({ ...p, visibleTools: DEFAULT_TOOLS }))}>{t('Auf Standard-Werkzeugleiste zurücksetzen')}</Row></Group>
          </>
        ) : (
          <>
            {prefs.visibleAcc.length > 0 ? <List<AccId> items={prefs.visibleAcc} label={(x) => ACC_META[x].label} Icon={(x) => { const I = ACC_META[x].Icon; return <I size={24} /> }} canRemove onChange={(n) => set((p) => ({ ...p, visibleAcc: n }))} /> : <Group><div className="px-4 py-4 text-sub">{t('Kein Zubehör sichtbar')}</div></Group>}
            <H>{t('Weiteres Zubehör')}</H>
            <More<AccId> items={hiddenAcc} label={(x) => ACC_META[x].label} Icon={(x) => { const I = ACC_META[x].Icon; return <I size={24} /> }} onAdd={(x) => set((p) => ({ ...p, visibleAcc: [...p.visibleAcc, x] }))} />
            {foot('Audiowerkzeug wird immer in der Werkzeugleiste priorisiert. Sichtbares anderes Zubehör wird gegenüber Werkzeugen in der Hauptwerkzeugleiste priorisiert, falls nicht genügend Platz vorhanden ist.')}
            <Group className="mt-6"><Row danger onClick={() => set((p) => ({ ...p, visibleAcc: DEFAULT_ACC }))}>{t('Anordnung des Zubehörs auf Standard zurücksetzen')}</Row></Group>
          </>
        )}
      </div>
    </Sheet>
  )
}
