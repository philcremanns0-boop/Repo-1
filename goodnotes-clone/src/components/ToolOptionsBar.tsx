import { type MutableRefObject, type ReactNode } from 'react'
import { ChevronDown } from './glyphs'
import { motion } from 'framer-motion'
import { GN_SPRING, GN_TAP } from './motion'
import { AlignI, RedoI, UndoI, EraserI, TextBoxStyleI, TextStylesI, HighlighterI, LineSpacingI, PenI, PinI, PixelEraserI, ShapeAutoI, StrokeEraserI, WashiI } from './icons'
import type { ToolId } from './editorTypes'
import { useT } from '../context/Settings'
import { colorKey, WIDTHS, type PenMode, type ToolPrefs } from './toolState'
import type { PopName } from './Toolbar'

export function UndoPill({ canUndo, canRedo, onUndo, onRedo }: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  const t = useT()
  const cls = (on: boolean) => `flex h-[36px] w-[40px] items-center justify-center rounded-[10px] ${on ? 'text-ink' : 'text-sub/60'}`
  return (
    <div className="gn-opt flex h-[44px] items-center gap-0.5 rounded-full border border-hair bg-gn-panel-light px-1.5 shadow-gn-float dark:bg-gn-panel-dark dark:shadow-gn-float-dark">
      <motion.button whileTap={{ scale: 0.85 }} aria-label={t('Rückgängig')} disabled={!canUndo} onClick={onUndo} className={cls(canUndo)}><UndoI size={25} /></motion.button>
      <motion.button whileTap={{ scale: 0.85 }} aria-label={t('Wiederholen')} disabled={!canRedo} onClick={onRedo} className={cls(canRedo)}><RedoI size={25} /></motion.button>
    </div>
  )
}

const Opt = ({ active, onClick, label, children, refFn, w = 46, tone = 'tool', group }: { active?: boolean; onClick: () => void; label: string; children: ReactNode; refFn?: (el: HTMLButtonElement | null) => void; w?: number; tone?: 'tool' | 'sel'; group?: string }) => {
  const bg = tone === 'tool' ? 'bg-[var(--opt-active)]' : 'bg-[var(--opt-sel)]'
  return (
    <motion.button ref={refFn} aria-label={label} title={label} aria-pressed={active} onClick={onClick} whileTap={{ scale: 0.88 }} transition={GN_TAP}
      className={`relative flex h-[36px] shrink-0 items-center justify-center gap-0.5 rounded-[11px] text-ink ${active && !group ? bg : ''}`} style={{ width: w }}>
      {active && group && <motion.span layoutId={group} className={`absolute inset-0 rounded-[11px] ${bg}`} transition={GN_SPRING} />}
      <span className="relative flex items-center gap-0.5">{children}</span>
    </motion.button>
  )
}
const Sep = () => <span className="mx-2 h-[26px] w-px shrink-0 bg-hair" />
const isDark = (hex: string) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140 }

export function Thickness({ value, onChange, labels }: { value: number; onChange: (v: 0 | 1 | 2) => void; labels: string[] }) {
  const hs = [1.2, 2.4, 5]
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Opt key={i} group="gn-thick" active={value === i} tone="sel" w={40} label={labels[i]} onClick={() => onChange(i as 0 | 1 | 2)}>
          <span className="block rounded-full bg-ink" style={{ width: 17, height: hs[i] }} />
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
            className="relative flex h-[36px] w-[44px] shrink-0 items-center justify-center">
            {sel && <motion.span layoutId="gn-swatch" className="absolute left-1/2 top-1/2 h-[31px] w-[31px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--opt-sel)]" transition={GN_SPRING} />}
            <span className="relative flex h-[21px] w-[21px] items-center justify-center rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.14)' }}>
              {sel && <ChevronDown size={11} strokeWidth={3} color={isDark(c) ? '#fff' : '#111'} />}
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
    <motion.div key={tool} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={GN_SPRING}
      className="gn-opt flex h-[44px] max-w-full items-center rounded-full border border-hair bg-gn-panel-light px-1.5 shadow-gn-float dark:bg-gn-panel-dark dark:shadow-gn-float-dark">{children}</motion.div>
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
      <Opt group="gn-penmode" label={t('Stift')} active={m === 'pen'} w={m === 'pen' ? 52 : 46} refFn={reg('opt:pen')} onClick={() => (m === 'pen' ? onPop(popover === 'pen' ? null : 'pen') : pick('pen'))}>
        <PenI size={25} />{m === 'pen' && <ChevronDown size={11} strokeWidth={2.4} />}
      </Opt>
      <Opt group="gn-penmode" label={t('Textmarker')} active={m === 'highlighter'} onClick={() => pick('highlighter')}><HighlighterI size={25} /></Opt>
      <Opt group="gn-penmode" label={t('Washi-Tape')} active={m === 'tape'} onClick={() => pick('tape')}><WashiI size={25} /></Opt>
      {m === 'highlighter' && (
        <Opt label={t('Gerade Linie zeichnen')} active={prefs.hlStraight} onClick={() => set((p) => ({ ...p, hlStraight: !p.hlStraight }))}>
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19L20 5" strokeWidth="3.2" opacity=".45" /><circle cx="4" cy="19" r="1.6" fill="currentColor" /><circle cx="20" cy="5" r="1.6" fill="currentColor" /></svg>
        </Opt>
      )}
      <Opt label={t('Formen automatisch erkennen (Zeichnen und halten)')} active={prefs.autoShape} onClick={() => set((p) => ({ ...p, autoShape: !p.autoShape }))}><ShapeAutoI size={25} /></Opt>
      <Sep />{th(m)}<Sep />{sw(m)}
    </>)
  }
  if (tool === 'eraser') {
    const flt = prefs.erFilter
    const toggle = (k: keyof typeof flt, label: string, I: (p: { size?: number }) => JSX.Element) => (
      <Opt key={k} tone="sel" w={34} active={flt[k]} label={`${t('Radierfilter')}: ${t(label)}`} onClick={() => set((p) => ({ ...p, erFilter: { ...p.erFilter, [k]: !p.erFilter[k] } }))}><I size={20} /></Opt>
    )
    return wrap(<>
      <Opt group="gn-er" label={t('Präzisionsradierer')} active={prefs.eraser === 'precision'} onClick={() => set((p) => ({ ...p, eraser: 'precision' }))}><PixelEraserI size={23} /></Opt>
      <Opt group="gn-er" label={t('Standardradierer')} active={prefs.eraser === 'standard'} onClick={() => set((p) => ({ ...p, eraser: 'standard' }))}><EraserI size={23} /></Opt>
      <Opt group="gn-er" label={t('Strichradierer')} active={prefs.eraser === 'stroke'} onClick={() => set((p) => ({ ...p, eraser: 'stroke' }))}><StrokeEraserI size={23} /></Opt>
      <Sep />
      {[0, 1, 2].map((i) => (
        <Opt key={i} group="gn-ersize" tone="sel" w={34} active={prefs.eraserSize === i} label={`${t('Größe')} ${i + 1}`} onClick={() => set((p) => ({ ...p, eraserSize: i as 0 | 1 | 2 }))}>
          <span className="block rounded-full border-2 border-ink" style={{ width: 9 + i * 5, height: 9 + i * 5 }} />
        </Opt>
      ))}
      <Sep />
      {toggle('pen', 'Stift', PenI)}{toggle('highlighter', 'Textmarker', HighlighterI)}{toggle('tape', 'Washi-Tape', WashiI)}
    </>)
  }
  if (tool === 'shapes') {
    return wrap(<>
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
      <Opt refFn={reg('textbox')} label={t('Textfeld-Stil')} w={40} active={!!(s.fill || s.border)} tone="sel" onClick={() => onPop(popover === 'textbox' ? null : 'textbox')}><TextBoxStyleI size={24} /></Opt>
      <Opt refFn={reg('textstyles')} label={t('Textstile')} w={40} onClick={() => onPop(popover === 'textstyles' ? null : 'textstyles')}><TextStylesI size={24} /></Opt>
      <button aria-pressed={prefs.pinText} onClick={() => set((p) => ({ ...p, pinText: !p.pinText }))}
        className={`mr-1 flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-2.5 text-[15px] font-medium text-ink ${prefs.pinText ? 'bg-[var(--opt-active)]' : 'bg-chip'}`}>
        <PinI size={20} />{t('Textwerkzeug fixieren')}
      </button>
    </>)
  }
  return null
}
export { EraserI }
