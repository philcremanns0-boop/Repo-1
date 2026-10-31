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
}
const LABEL: Record<ShapeKind, string> = { line: 'Linie', arrow: 'Pfeil', rect: 'Rechteck', ellipse: 'Ellipse', triangle: 'Dreieck', diamond: 'Raute', tape: 'Tape' }

export default function ShapesPopover({ anchor, open, onClose, prefs, set }: { anchor: RefObject<HTMLElement | null>; open: boolean; onClose: () => void; prefs: ToolPrefs; set: (fn: (p: ToolPrefs) => ToolPrefs) => void }) {
  const t = useT()
  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={380}>
      <PopTitle>{t('Formen')}</PopTitle>
      <div className="mx-3 grid grid-cols-3 gap-2">
        {(Object.keys(SHAPE_ICONS) as ShapeKind[]).filter((k) => k !== 'tape').map((k) => {
          const I = SHAPE_ICONS[k]
          return (
            <button key={k} onClick={() => { set((p) => ({ ...p, shape: k })); onClose() }}
              className={`flex flex-col items-center gap-1 rounded-[18px] bg-card py-3 text-[15px] ${prefs.shape === k ? 'ring-2 ring-accent' : ''}`}><I />{t(LABEL[k])}</button>
          )
        })}
      </div>
      <div className="h-3" />
      <Group><Row as="div" trailing={<Toggle on={prefs.fill} onChange={(v) => set((p) => ({ ...p, fill: v }))} label={t('Füllung')} />}>{t('Füllung')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}
