import { type MutableRefObject, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from './glyphs'
import {
  AccessoriesI, EraserI, ImageI, LaserI, MicSparkI, MoreI, NoteI, ObjectsI, PagePlusI, ReadI, SearchI, ShapesI, ShareI, SidebarI, TextI,
} from './icons'
import type { AccId, ToolId } from './editorTypes'
import { useT } from '../context/Settings'
import { ALL_ACC, type ToolPrefs } from './toolState'
import { GN_SPRING, GN_TAP } from './motion'

export type PopName = 'pen' | 'eraser' | 'lasso' | 'shapes' | 'objects' | 'images' | 'acc' | 'add' | 'share' | 'more' | 'search' | 'color' | 'font' | 'size' | 'spacing' | 'textcolor' | 'textbox' | 'textstyles' | 'tab' | 'settings'
type IconC = (p: { size?: number; active?: boolean }) => JSX.Element

/** Lasso: fluid rope loop, dashed 3,3, short solid tail, filled pointer. 1.5 stroke = the thin GN line weight. */
const LassoGlyph: IconC = ({ size = 22, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8.7 15.2c-3.5-.5-5.6-2.8-5.2-5.5C4 6.4 7.9 4.2 12.1 4.4c4.2.2 7.3 2.7 6.7 5.7" strokeDasharray="3,3" fill={active ? 'var(--gn-teal-1)' : 'none'} />
    <path d="M8.7 15.2c.9 1.3.2 2.7-1.2 3.5" />
    <path d="M12.5 11.1l7.3 3.2-3.3 1.2-1.3 3.4z" fill="currentColor" />
  </svg>
)
/** Fountain pen: barrel at 45°, split nib (slit + breather hole) pointing bottom-left, ink squiggle. */
const PenGlyph: IconC = ({ size = 22, active }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15.9 5.7a2.1 2.1 0 013 0l.2.2a2.1 2.1 0 010 3L11.4 16.6l-3.2-3.2z" fill={active ? 'var(--gn-teal-1)' : 'none'} />
    <path d="M8.2 13.4l-2.6 1.3-1.3 5.1 5.1-1.3 1.3-2.6" fill={active ? 'var(--gn-teal-1)' : 'none'} />
    <path d="M4.4 19.7l3.2-3.2M13.8 7.8l3.1 3.1" />
    <circle cx="8.3" cy="15.8" r=".75" fill="currentColor" stroke="none" />
    <path d="M12.6 20.7c1.4-.1 1.9-1.3 3-1.3s1.5 1.2 2.9 1.2" />
  </svg>
)

const TOOL_META: Record<Exclude<ToolId, 'lasso'>, { label: string; Icon: IconC }> = {
  pen: { label: 'Schreibwerkzeug', Icon: PenGlyph },
  eraser: { label: 'Radierer', Icon: EraserI },
  text: { label: 'Text', Icon: TextI },
  objects: { label: 'Objekte', Icon: ObjectsI },
  images: { label: 'Bilder', Icon: ImageI },
  shapes: { label: 'Formen', Icon: ShapesI },
  note: { label: 'Notizzettel', Icon: NoteI },
  laser: { label: 'Laserpointer', Icon: LaserI },
}
export const TOOL_LABEL = (id: ToolId) => (id === 'lasso' ? 'Lasso' : TOOL_META[id].label)
export const TOOL_ICON = (id: ToolId): IconC => (id === 'lasso' ? LassoGlyph : TOOL_META[id].Icon)

const Svg = ({ size = 22, children }: { size?: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
)
export const ACC_META: Record<AccId, { label: string; Icon: (p: { size?: number }) => JSX.Element }> = {
  record: { label: 'Aufnehmen & Zusammenfassen', Icon: MicSparkI },
  recordings: { label: 'Aufnahmen anzeigen', Icon: (p) => <Svg size={p.size}><rect x="3.5" y="4.5" width="11" height="15" rx="2" /><path d="M6.5 9h5M6.5 12h3" /><rect x="15.5" y="7" width="4.5" height="7.5" rx="2.25" /><path d="M14 12.5a3.8 3.8 0 007.5 0M17.75 16.3v3.2" /></Svg> },
  zoom: { label: 'Zoom-Ansicht', Icon: (p) => <Svg size={p.size}><rect x="3.5" y="4.5" width="13" height="15" rx="2" /><circle cx="16.5" cy="15.5" r="3.6" /><path d="M19.1 18.1l2.4 2.4M7 9h6M7 12h3" /></Svg> },
  ruler: { label: 'Lineal', Icon: (p) => <Svg size={p.size}><rect x="2.5" y="8" width="19" height="8" rx="1.6" transform="rotate(-35 12 12)" /><path d="M8 9.8l1.4 1.2M11 7.6l1.4 1.2M14.4 5.4l1.4 1.2M7 14.8l1.8-1.4" /></Svg> },
  timer: { label: 'Zeitmesser', Icon: (p) => <Svg size={p.size}><circle cx="12" cy="13" r="8" /><path d="M12 8.5V13l3 2M9.5 2.8h5" /></Svg> },
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
interface BtnProps {
  active?: boolean
  onClick: () => void
  label: string
  children: ReactNode
  refFn?: (el: HTMLButtonElement | null) => void
  chevron?: boolean
  w?: number
  /** shared-layout id: the active tile springs between buttons that share it */
  slide?: string
  glass?: boolean
}
/**
 * 33×33 pt hit target, 10 pt corner radius (measured from the reference).
 * Docked: white icons on navy, active = white tile + navy icon.
 * Glass:  ink icons on frosted white, active = Teal III tile + ink icon.
 */
export function BarBtn({ active, onClick, label, children, refFn, chevron, w = 36, slide, glass }: BtnProps) {
  const tile = glass ? 'bg-gn-teal-3 dark:bg-gn-halo' : 'bg-[var(--tool-active)] shadow-[0_1px_2px_rgba(11,28,51,.18)]'
  const idle = glass ? 'text-gn-navy dark:text-gn-white hover:bg-[var(--halo)]' : 'text-gn-white hover:bg-white/10'
  const on = glass ? 'text-gn-navy dark:text-gn-white' : 'text-[var(--tool-active-ink)]'
  return (
    <motion.button ref={refFn} type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} whileTap={{ scale: 0.88 }} transition={GN_TAP}
      className={`relative flex h-[36px] shrink-0 items-center justify-center rounded-[11px] transition-colors duration-150 ${active ? `${slide ? '' : tile} ${on}` : idle}`}
      style={{ width: chevron ? w + 14 : w }}>
      {active && slide && <motion.span layoutId={slide} className={`absolute inset-0 rounded-[11px] ${tile}`} transition={GN_SPRING} />}
      <span className="relative flex items-center gap-[2px]">
        {children}
        {chevron && <ChevronDown size={13} strokeWidth={2.2} className="opacity-80" />}
      </span>
    </motion.button>
  )
}
const Sep = ({ glass }: { glass?: boolean }) => <span className={`mx-[4px] h-[26px] w-px shrink-0 ${glass ? 'bg-gn-ink-1/15 dark:bg-white/15' : 'bg-white/20'}`} />

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */
interface Props {
  tool: ToolId
  onTool: (t: ToolId, again: boolean) => void
  prefs: ToolPrefs
  anchors: MutableRefObject<Record<string, HTMLElement | null>>
  popover: PopName | null
  onPop: (p: PopName | null) => void
  sidebar: boolean
  onSidebar: () => void
  readOnly: boolean
  onReadOnly: () => void
  accActive: Record<AccId, boolean>
  onAcc: (a: AccId) => void
  floating?: boolean
}

/**
 * Main document toolbar.
 * - docked (default, as in the reference screenshots): full-width 41 pt navy bar under the tab strip, 7 pt side insets.
 * - floating: pill – rounded-full, px-4 py-2, pure #FFFFFF panel (dark #1E1E1E) with a 0 4px 30px rgba(0,0,0,.03) shadow.
 * Left group (sidebar · search · read mode), centred tool cluster (lasso │ tools │ accessories), right group (add page · share · more).
 */
export default function Toolbar({ tool, onTool, prefs, anchors, popover, onPop, sidebar, onSidebar, readOnly, onReadOnly, accActive, onAcc, floating }: Props) {
  const t = useT()
  const glass = !!floating
  const reg = (k: string) => (el: HTMLElement | null) => { anchors.current[k] = el }
  const hiddenAcc = ALL_ACC.filter((a) => !prefs.visibleAcc.includes(a))
  const shown = ALL_ACC.filter((a) => prefs.visibleAcc.includes(a))
  const toggle = (p: PopName) => onPop(popover === p ? null : p)

  const shell = glass
    ? 'relative z-30 mx-auto flex w-[min(1120px,calc(100%-16px))] shrink-0 items-center rounded-full bg-gn-panel-light px-4 py-2 shadow-gn-float dark:bg-gn-panel-dark dark:shadow-gn-float-dark'
    : 'relative z-30 flex h-[44px] shrink-0 items-center bg-bar px-[4px]'

  return (
    <motion.nav aria-label={t('Werkzeugleiste')} className={`gn-bar ${shell}`}
      initial={glass ? { y: -12, opacity: 0, scale: 0.98 } : false} animate={{ y: 0, opacity: 1, scale: 1 }} transition={GN_SPRING}>
      {/* left */}
      <div className="flex w-[132px] shrink-0 items-center gap-[8px] lg:w-[220px]">
        <BarBtn glass={glass} label={t('Seitenleiste')} active={sidebar} onClick={onSidebar}><SidebarI size={26} /></BarBtn>
        <BarBtn glass={glass} label={t('Suchen')} active={popover === 'search'} refFn={reg('search')} onClick={() => toggle('search')}><SearchI size={26} /></BarBtn>
        <BarBtn glass={glass} label={t('Lesemodus')} active={readOnly} onClick={onReadOnly}><ReadI size={26} /></BarBtn>
      </div>

      {/* centre: tool cluster */}
      <div className="no-scrollbar flex min-w-0 flex-1 items-center justify-center gap-[14px] overflow-x-auto">
        <BarBtn glass={glass} slide="gn-tool" label={t('Lasso')} active={tool === 'lasso'} chevron={tool === 'lasso'} refFn={reg('tool:lasso')} onClick={() => onTool('lasso', tool === 'lasso')}>
          <LassoGlyph size={27} active={tool === 'lasso'} />
        </BarBtn>
        <Sep glass={glass} />
        {prefs.visibleTools.map((id) => {
          const { Icon, label } = TOOL_META[id as Exclude<ToolId, 'lasso'>]
          const active = tool === id
          return (
            <BarBtn glass={glass} slide="gn-tool" key={id} label={t(label)} active={active} refFn={reg(`tool:${id}`)} onClick={() => onTool(id, active)}>
              <Icon size={27} active={active} />
            </BarBtn>
          )
        })}
        {(shown.length > 0 || hiddenAcc.length > 0) && <Sep glass={glass} />}
        {shown.map((a) => {
          const { Icon, label } = ACC_META[a]
          return <BarBtn glass={glass} key={a} label={t(label)} active={accActive[a]} onClick={() => onAcc(a)}><Icon size={27} /></BarBtn>
        })}
        <BarBtn glass={glass} label={t('Zubehör')} chevron w={34} active={popover === 'acc'} refFn={reg('acc')} onClick={() => toggle('acc')}><AccessoriesI size={27} /></BarBtn>
      </div>

      {/* right */}
      <div className="flex w-[132px] shrink-0 items-center justify-end gap-[8px] lg:w-[220px]">
        <BarBtn glass={glass} label={t('Seite hinzufügen')} active={popover === 'add'} refFn={reg('add')} onClick={() => toggle('add')}><PagePlusI size={27} /></BarBtn>
        <BarBtn glass={glass} label={t('Teilen und Exportieren')} active={popover === 'share'} refFn={reg('share')} onClick={() => toggle('share')}><ShareI size={27} /></BarBtn>
        <BarBtn glass={glass} label={t('Mehr')} active={popover === 'more'} refFn={reg('more')} onClick={() => toggle('more')}><MoreI size={28} /></BarBtn>
      </div>
    </motion.nav>
  )
}
