import { type MutableRefObject, type ReactNode } from 'react'
import { ChevronDown, Redo2, Undo2 } from 'lucide-react'
import { AlignI, EraserI, HighlighterI, LineSpacingI, PenI, PinI, PixelEraserI, ShapeAutoI, StrokeEraserI, WashiI } from './icons'
import type { ToolId } from './editorTypes'
import { useT } from '../context/Settings'
import { colorKey, WIDTHS, type PenMode, type ToolPrefs } from './toolState'
import type { PopName } from './Toolbar'
import type { ShapeKind } from '../lib/draw'
import { SHAPE_ICONS } from './popovers/ShapesPopover'

export function UndoPill({ canUndo, canRedo, onUndo, onRedo }: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  const t = useT()
  const cls = (on: boolean) => `flex h-[33px] w-[36px] items-center justify-center rounded-[10px] ${on ? 'text-ink' : 'text-sub/70'}`
  return (
    <div className="flex h-[40px] items-center gap-0.5 rounded-full border border-hair bg-float px-1.5 shadow-pill backdrop-blur">
      <button aria-label={t('Rückgängig')} disabled={!canUndo} onClick={onUndo} className={cls(canUndo)}><Undo2 size={21} strokeWidth={1.8} /></button>
      <button aria-label={t('Wiederholen')} disabled={!canRedo} onClick={onRedo} className={cls(canRedo)}><Redo2 size={21} strokeWidth={1.8} /></button>
    </div>
  )
}

const Opt = ({ active, onClick, label, children, refFn, w = 42, tone = 'tool' }: { active?: boolean; onClick: () => void; label: string; children: ReactNode; refFn?: (el: HTMLButtonElement | null) => void; w?: number; tone?: 'tool' | 'sel' }) => (
  <button ref={refFn} aria-label={label} title={label} aria-pressed={active} onClick={onClick}
    className={`flex h-[33px] shrink-0 items-center justify-center gap-0.5 rounded-[10px] text-ink ${active ? (tone === 'tool' ? 'bg-[var(--opt-active)]' : 'bg-[var(--opt-sel)]') : ''}`} style={{ width: w }}>
    {children}
  </button>
)
const Sep = () => <span className="mx-1.5 h-[22px] w-px shrink-0 bg-hair" />
const isDark = (hex: string) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140 }

export function Thickness({ value, onChange, labels }: { value: number; onChange: (v: 0 | 1 | 2) => void; labels: string[] }) {
  const hs = [1.5, 3, 6.5]
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Opt key={i} active={value === i} tone="sel" w={34} label={labels[i]} onClick={() => onChange(i as 0 | 1 | 2)}>
          <span className="block rounded-full bg-ink" style={{ width: 20, height: hs[i] }} />
        </Opt>
      ))}
    </>
  )
}
export function Swatches({ colors, idx, onPick, onOpen, anchor }: { colors: string[]; idx: number; onPick: (i: number) => void; onOpen: () => void; anchor: (el: HTMLElement | null) => void }) {
  return (
    <div className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto">
      {colors.map((c, i) => {
        const sel = i === idx
        return (
          <button key={i} ref={sel ? anchor : undefined} aria-label={c} aria-pressed={sel} onClick={() => (sel ? onOpen() : onPick(i))}
            className={`flex h-[36px] w-[38px] shrink-0 items-center justify-center rounded-full ${sel ? 'bg-[var(--opt-sel)]' : ''}`}>
            <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.14)' }}>
              {sel && <ChevronDown size={13} strokeWidth={3} color={isDark(c) ? '#fff' : '#111'} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

interface Props {
  tool: ToolId
  prefs: ToolPrefs
  set: (fn: (p: ToolPrefs) => ToolPrefs) => void
  anchors: MutableRefObject<Record<string, HTMLElement | null>>
  popover: PopName | null
  onPop: (p: PopName | null) => void
  onTextStyle: (patch: Partial<ToolPrefs['textStyle']>) => void
}
export function OptionsBar({ tool, prefs, set, anchors, popover, onPop, onTextStyle }: Props) {
  const t = useT()
  const reg = (k: string) => (el: HTMLElement | null) => { anchors.current[k] = el }
  const wrap = (children: ReactNode) => (
    <div className="flex h-[40px] max-w-full items-center rounded-full border border-hair bg-float px-1.5 shadow-pill backdrop-blur">{children}</div>
  )
  const th = (k: ReturnType<typeof colorKey>) => (
    <Thickness value={prefs.thick[k]} labels={[t('Dünn'), t('Mittel'), t('Dick')]} onChange={(v) => set((p) => ({ ...p, thick: { ...p.thick, [k]: v } }))} />
  )
  const sw = (k: ReturnType<typeof colorKey>) => (
    <Swatches colors={prefs.colors} idx={prefs.colorIdx[k]} anchor={reg('color')}
      onPick={(i) => set((p) => ({ ...p, colorIdx: { ...p.colorIdx, [k]: i } }))} onOpen={() => onPop(popover === 'color' ? null : 'color')} />
  )

  if (tool === 'pen') {
    const m = prefs.penMode
    const pick = (mode: PenMode) => set((p) => ({ ...p, penMode: mode }))
    return wrap(<>
      <Opt label={t('Stift')} active={m === 'pen'} w={m === 'pen' ? 58 : 42} refFn={reg('opt:pen')} onClick={() => (m === 'pen' ? onPop(popover === 'pen' ? null : 'pen') : pick('pen'))}>
        <PenI size={23} />{m === 'pen' && <ChevronDown size={13} />}
      </Opt>
      <Opt label={t('Textmarker')} active={m === 'highlighter'} onClick={() => pick('highlighter')}><HighlighterI size={23} /></Opt>
      <Opt label={t('Washi-Tape')} active={m === 'tape'} onClick={() => pick('tape')}><WashiI size={23} /></Opt>
      <Opt label={t('Formen automatisch erkennen (Zeichnen und halten)')} active={prefs.autoShape} onClick={() => set((p) => ({ ...p, autoShape: !p.autoShape }))}><ShapeAutoI size={23} /></Opt>
      <Sep />{th(m)}<Sep />{sw(m)}
    </>)
  }
  if (tool === 'eraser') {
    const flt = prefs.erFilter
    const toggle = (k: keyof typeof flt, label: string, I: (p: { size?: number }) => JSX.Element) => (
      <Opt key={k} tone="sel" w={34} active={flt[k]} label={`${t('Radierfilter')}: ${t(label)}`} onClick={() => set((p) => ({ ...p, erFilter: { ...p.erFilter, [k]: !p.erFilter[k] } }))}><I size={20} /></Opt>
    )
    return wrap(<>
      <Opt label={t('Präzisionsradierer')} active={prefs.eraser === 'precision'} onClick={() => set((p) => ({ ...p, eraser: 'precision' }))}><PixelEraserI size={23} /></Opt>
      <Opt label={t('Standardradierer')} active={prefs.eraser === 'standard'} onClick={() => set((p) => ({ ...p, eraser: 'standard' }))}><EraserI size={23} /></Opt>
      <Opt label={t('Strichradierer')} active={prefs.eraser === 'stroke'} onClick={() => set((p) => ({ ...p, eraser: 'stroke' }))}><StrokeEraserI size={23} /></Opt>
      <Sep />
      {[0, 1, 2].map((i) => (
        <Opt key={i} tone="sel" w={34} active={prefs.eraserSize === i} label={`${t('Größe')} ${i + 1}`} onClick={() => set((p) => ({ ...p, eraserSize: i as 0 | 1 | 2 }))}>
          <span className="block rounded-full border-2 border-ink" style={{ width: 9 + i * 5, height: 9 + i * 5 }} />
        </Opt>
      ))}
      <Sep />
      {toggle('pen', 'Stift', PenI)}{toggle('highlighter', 'Textmarker', HighlighterI)}{toggle('tape', 'Washi-Tape', WashiI)}
    </>)
  }
  if (tool === 'shapes') {
    return wrap(<>
      <div className="no-scrollbar flex min-w-0 items-center overflow-x-auto">
        {(Object.keys(SHAPE_ICONS) as ShapeKind[]).filter((k) => k !== 'tape').map((k) => {
          const I = SHAPE_ICONS[k]
          return <Opt key={k} active={prefs.shape === k} label={t(k)} onClick={() => set((p) => ({ ...p, shape: k }))}><I /></Opt>
        })}
      </div>
      <Opt label={t('Füllung')} active={prefs.fill} onClick={() => set((p) => ({ ...p, fill: !p.fill }))}><span className="h-[16px] w-[16px] rounded-[4px] border-2 border-ink" style={{ background: prefs.fill ? 'currentColor' : 'transparent', opacity: prefs.fill ? 0.5 : 1 }} /></Opt>
      <Sep />{th('shape')}<Sep />{sw('shape')}
    </>)
  }
  if (tool === 'laser') {
    return wrap(<>
      {['#ff3b30', '#34c759', '#0a84ff', '#ffd60a', '#ffffff'].map((c) => (
        <button key={c} aria-label={c} onClick={() => set((p) => ({ ...p, laserColor: c }))} className={`flex h-[36px] w-[38px] items-center justify-center rounded-full ${prefs.laserColor === c ? 'bg-[var(--opt-sel)]' : ''}`}>
          <span className="h-[27px] w-[27px] rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
        </button>
      ))}
      <Sep />
      <button aria-pressed={prefs.laserTrail} onClick={() => set((p) => ({ ...p, laserTrail: !p.laserTrail }))}
        className={`mr-1 h-[30px] whitespace-nowrap rounded-full px-3 text-[14px] font-semibold ${prefs.laserTrail ? 'bg-accent text-white' : 'bg-chip text-ink'}`}>{t('Spur')}</button>
    </>)
  }
  if (tool === 'text') {
    const s = prefs.textStyle
    const chip = (key: string, children: ReactNode, w: number, label: string) => (
      <button ref={reg(key)} aria-label={label} onClick={() => onPop(popover === key ? null : (key as PopName))}
        className="mx-0.5 flex h-[34px] shrink-0 items-center justify-between gap-1 rounded-[10px] bg-card px-2.5 text-[15px] font-semibold text-ink" style={{ minWidth: w }}>{children}</button>
    )
    return wrap(<>
      <button ref={reg('textcolor')} aria-label={t('Textfarbe')} onClick={() => onPop(popover === 'textcolor' ? null : 'textcolor')} className="flex h-[36px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--opt-sel)]">
        <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full" style={{ background: s.color, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2)' }}><ChevronDown size={13} strokeWidth={3} color={isDark(s.color) ? '#fff' : '#111'} /></span>
      </button>
      {chip('size', <><span>{s.size}</span><ChevronDown size={13} className="text-sub" /></>, 60, t('Schriftgröße'))}
      {chip('font', <><span className="max-w-[150px] truncate font-medium" style={{ fontSize: 14 }}>{s.font}</span><ChevronDown size={13} className="text-sub" /></>, 150, t('Schrift'))}
      <Opt label={t('Fett')} active={s.bold} w={36} onClick={() => onTextStyle({ bold: !s.bold })}><b className="text-[19px]">B</b></Opt>
      <Opt label={t('Kursiv')} active={s.italic} w={30} onClick={() => onTextStyle({ italic: !s.italic })}><i className="font-serif text-[19px]">I</i></Opt>
      <Opt label={t('Ausrichtung')} w={38} onClick={() => onTextStyle({ align: s.align === 'left' ? 'center' : s.align === 'center' ? 'right' : 'left' })}><AlignI a={s.align} size={22} /></Opt>
      <Opt refFn={reg('spacing')} label={t('Zeilenabstand')} w={38} onClick={() => onPop(popover === 'spacing' ? null : 'spacing')}><LineSpacingI size={22} /></Opt>
      <Sep />
      <button aria-pressed={prefs.pinText} onClick={() => set((p) => ({ ...p, pinText: !p.pinText }))}
        className={`mr-1 flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 text-[15px] font-medium text-ink ${prefs.pinText ? 'bg-[var(--opt-active)]' : 'bg-chip'}`}>
        <PinI size={20} />{t('Textwerkzeug fixieren')}
      </button>
    </>)
  }
  return null
}
export { EraserI }
