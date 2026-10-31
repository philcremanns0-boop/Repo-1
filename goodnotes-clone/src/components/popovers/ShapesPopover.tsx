import type { RefObject } from 'react'
import type { ShapeKind } from '../../lib/draw'
import { Group, Popover, PopTitle, Row, Toggle } from '../ui'
import { useT } from '../../context/Settings'
import type { ToolPrefs } from '../toolState'

const S = ({ children }: { children: React.ReactNode }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
export const SHAPE_ICONS: Record<ShapeKind, () => JSX.Element> = {
  line: () => <S><path d="M4 20L20 4" /></S>,
  arrow: () => <S><path d="M4 20L19 5M10 5h9v9" /></S>,
  rect: () => <S><rect x="3.5" y="5.5" width="17" height="13" rx="1.2" /></S>,
  ellipse: () => <S><ellipse cx="12" cy="12" rx="8.5" ry="6.5" /></S>,
  triangle: () => <S><path d="M12 4.5l8.5 15h-17z" /></S>,
  diamond: () => <S><path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z" /></S>,
  tape: () => <S><path d="M3 9h18v6H3z" /></S>,
  poly: () => <S><path d="M12 3.5l8 6-3 10H7l-3-10z" /></S>,
}
const LABEL: Record<ShapeKind, string> = { line: 'Linie', arrow: 'Pfeil', rect: 'Rechteck', ellipse: 'Ellipse', triangle: 'Dreieck', diamond: 'Raute', tape: 'Tape', poly: 'Vieleck' }

export default function ShapesPopover({ anchor, open, onClose, prefs, set }: { anchor: RefObject<HTMLElement | null>; open: boolean; onClose: () => void; prefs: ToolPrefs; set: (fn: (p: ToolPrefs) => ToolPrefs) => void }) {
  const t = useT()
  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={380}>
      <PopTitle>{t('Formen')}</PopTitle>
      <p className="px-5 pb-3 text-[15px] leading-snug text-sub">{t('Zeichne eine Form – Linie, Kreis, Ellipse, Dreieck, Rechteck oder Vieleck. Sie wird beim Absetzen automatisch geglättet.')}</p>
      <div className="mx-3 grid grid-cols-6 gap-1.5 text-sub">
        {(['line', 'ellipse', 'triangle', 'rect', 'diamond', 'poly'] as ShapeKind[]).map((k) => { const I = SHAPE_ICONS[k]; return <span key={k} title={t(LABEL[k])} className="flex h-11 items-center justify-center rounded-xl bg-card"><I /></span> })}
      </div>
      <div className="h-3" />
      <Group><Row as="div" trailing={<Toggle on={prefs.fill} onChange={(v) => set((p) => ({ ...p, fill: v }))} label={t('Füllung')} />}>{t('Füllung')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}
