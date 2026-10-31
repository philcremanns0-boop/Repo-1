import { type MutableRefObject, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from './glyphs'
import {
  AccessoriesI, EraserI, ImageI, LassoI, LaserI, MicSparkI, MoreI, NoteI, ObjectsI, PagePlusI, PenI, ReadI, SearchI, ShapesI, ShareI, SidebarI, TextI,
} from './icons'
import type { AccId, ToolId } from './editorTypes'
import { useT } from '../context/Settings'
import { ALL_ACC, type ToolPrefs } from './toolState'
import { GN_SPRING, GN_TAP } from './motion'

export type PopName = 'pen' | 'eraser' | 'lasso' | 'shapes' | 'objects' | 'images' | 'acc' | 'add' | 'share' | 'more' | 'search' | 'color' | 'font' | 'size' | 'spacing' | 'textcolor' | 'tab' | 'settings'
type IconC = (p: { size?: number; active?: boolean }) => JSX.Element

const TOOL_META: Record<Exclude<ToolId, 'lasso'>, { label: string; Icon: IconC }> = {
  pen: { label: 'Schreibwerkzeug', Icon: PenI },
  eraser: { label: 'Radierer', Icon: EraserI },
  text: { label: 'Text', Icon: TextI },
  objects: { label: 'Objekte', Icon: ObjectsI },
  images: { label: 'Bilder', Icon: ImageI },
  shapes: { label: 'Formen', Icon: ShapesI },
  note: { label: 'Notizzettel', Icon: NoteI },
  laser: { label: 'Laserpointer', Icon: LaserI },
}
export const TOOL_LABEL = (id: ToolId) => (id === 'lasso' ? 'Lasso' : TOOL_META[id].label)
export const TOOL_ICON = (id: ToolId): IconC => (id === 'lasso' ? LassoI : TOOL_META[id].Icon)

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
export function BarBtn({ active, onClick, label, children, refFn, chevron, w = 33, slide, glass }: BtnProps) {
  const tile = glass ? 'bg-gn-teal-3 dark:bg-gn-teal-1/30' : 'bg-[var(--tool-active)] shadow-[0_1px_2px_rgba(10,25,47,.18)]'
  const idle = glass ? 'text-gn-ink-1 dark:text-gn-white hover:bg-gn-ink-1/[.06] dark:hover:bg-white/10' : 'text-gn-white hover:bg-white/10'
  const on = glass ? 'text-gn-ink-1 dark:text-gn-white' : 'text-[var(--tool-active-ink)]'
  return (
    <motion.button ref={refFn} type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} whileTap={{ scale: 0.88 }} transition={GN_TAP}
      className={`relative flex h-[33px] shrink-0 items-center justify-center rounded-[10px] transition-colors duration-150 ${active ? `${slide ? '' : tile} ${on}` : idle}`}
      style={{ width: chevron ? w + 14 : w }}>
      {active && slide && <motion.span layoutId={slide} className={`absolute inset-0 rounded-[10px] ${tile}`} transition={GN_SPRING} />}
      <span className="relative flex items-center gap-[2px]">
        {children}
        {chevron && <ChevronDown size={13} strokeWidth={2.2} className="opacity-80" />}
      </span>
    </motion.button>
  )
}
const Sep = ({ glass }: { glass?: boolean }) => <span className={`mx-[6px] h-[22px] w-px shrink-0 ${glass ? 'bg-gn-ink-1/15 dark:bg-white/15' : 'bg-white/20'}`} />

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
 * - floating: frosted pill – rounded-full, px-4 py-2, backdrop-blur-xl, bg-white/80 (light) and a soft layered shadow.
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
    ? 'relative z-30 mx-auto flex w-[min(1120px,calc(100%-16px))] shrink-0 items-center rounded-full bg-white/80 px-4 py-2 shadow-gn-float backdrop-blur-xl backdrop-saturate-150 dark:bg-gn-ui-toast/70 dark:shadow-gn-float-dark'
    : 'relative z-30 flex h-[41px] shrink-0 items-center bg-bar px-[7px]'

  return (
    <motion.nav aria-label={t('Werkzeugleiste')} className={shell}
      initial={glass ? { y: -12, opacity: 0, scale: 0.98 } : false} animate={{ y: 0, opacity: 1, scale: 1 }} transition={GN_SPRING}>
      {/* left */}
      <div className="flex w-[124px] shrink-0 items-center gap-[8px] lg:w-[220px]">
        <BarBtn glass={glass} label={t('Seitenleiste')} active={sidebar} onClick={onSidebar}><SidebarI size={21} /></BarBtn>
        <BarBtn glass={glass} label={t('Suchen')} active={popover === 'search'} refFn={reg('search')} onClick={() => toggle('search')}><SearchI size={21} /></BarBtn>
        <BarBtn glass={glass} label={t('Lesemodus')} active={readOnly} onClick={onReadOnly}><ReadI size={21} /></BarBtn>
      </div>

      {/* centre: tool cluster */}
      <div className="no-scrollbar flex min-w-0 flex-1 items-center justify-center gap-[13px] overflow-x-auto">
        <BarBtn glass={glass} slide="gn-tool" label={t('Lasso')} active={tool === 'lasso'} chevron={tool === 'lasso'} refFn={reg('tool:lasso')} onClick={() => onTool('lasso', tool === 'lasso')}>
          <LassoI size={22} active={tool === 'lasso'} />
        </BarBtn>
        <Sep glass={glass} />
        {prefs.visibleTools.map((id) => {
          const { Icon, label } = TOOL_META[id as Exclude<ToolId, 'lasso'>]
          const active = tool === id
          return (
            <BarBtn glass={glass} slide="gn-tool" key={id} label={t(label)} active={active} refFn={reg(`tool:${id}`)} onClick={() => onTool(id, active)}>
              <Icon size={22} active={active} />
            </BarBtn>
          )
        })}
        {(shown.length > 0 || hiddenAcc.length > 0) && <Sep glass={glass} />}
        {shown.map((a) => {
          const { Icon, label } = ACC_META[a]
          return <BarBtn glass={glass} key={a} label={t(label)} active={accActive[a]} onClick={() => onAcc(a)}><Icon size={22} /></BarBtn>
        })}
        <BarBtn glass={glass} label={t('Zubehör')} chevron w={30} active={popover === 'acc'} refFn={reg('acc')} onClick={() => toggle('acc')}><AccessoriesI size={22} /></BarBtn>
      </div>

      {/* right */}
      <div className="flex w-[124px] shrink-0 items-center justify-end gap-[8px] lg:w-[220px]">
        <BarBtn glass={glass} label={t('Seite hinzufügen')} active={popover === 'add'} refFn={reg('add')} onClick={() => toggle('add')}><PagePlusI size={22} /></BarBtn>
        <BarBtn glass={glass} label={t('Teilen und Exportieren')} active={popover === 'share'} refFn={reg('share')} onClick={() => toggle('share')}><ShareI size={22} /></BarBtn>
        <BarBtn glass={glass} label={t('Mehr')} active={popover === 'more'} refFn={reg('more')} onClick={() => toggle('more')}><MoreI size={24} /></BarBtn>
      </div>
    </motion.nav>
  )
}
