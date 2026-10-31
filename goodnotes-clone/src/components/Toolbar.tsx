import { type MutableRefObject, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  AccessoriesI, EraserI, ImageI, LassoI, LaserI, MicSparkI, MoreI, NoteI, ObjectsI, PagePlusI, PenI, ReadI, SearchI, ShapesI, ShareI, SidebarI, TextI,
} from './icons'
import type { AccId, ToolId } from './editorTypes'
import { useT } from '../context/Settings'
import { ALL_ACC, type ToolPrefs } from './toolState'

export type PopName = 'pen' | 'eraser' | 'lasso' | 'shapes' | 'objects' | 'images' | 'acc' | 'add' | 'share' | 'more' | 'search' | 'color' | 'font' | 'size' | 'spacing' | 'textcolor' | 'tab' | 'settings'

const TOOL_META: Record<Exclude<ToolId, 'lasso'>, { label: string; Icon: (p: { size?: number; active?: boolean }) => JSX.Element }> = {
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
export const TOOL_ICON = (id: ToolId) => (id === 'lasso' ? LassoI : TOOL_META[id].Icon)
export const ACC_META: Record<AccId, { label: string; Icon: (p: { size?: number }) => JSX.Element }> = {
  record: { label: 'Aufnehmen & Zusammenfassen', Icon: MicSparkI },
  recordings: { label: 'Aufnahmen anzeigen', Icon: (p) => <ReadI {...p} /> },
  zoom: { label: 'Zoom-Ansicht', Icon: ImageI },
  ruler: { label: 'Lineal', Icon: (p) => (<svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.6" transform="rotate(-35 12 12)" /><path d="M8 9.8l1.4 1.2M11 7.6l1.4 1.2M14.4 5.4l1.4 1.2M7 14.8l1.8-1.4" /></svg>) },
  timer: { label: 'Zeitmesser', Icon: (p) => (<svg width={p.size ?? 22} height={p.size ?? 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>) },
}

interface BtnProps { active?: boolean; onClick: () => void; label: string; children: ReactNode; refFn?: (el: HTMLButtonElement | null) => void; chevron?: boolean; dim?: boolean; w?: number }
export function BarBtn({ active, onClick, label, children, refFn, chevron, dim, w = 33 }: BtnProps) {
  return (
    <button ref={refFn} aria-label={label} title={label} aria-pressed={active} onClick={onClick}
      className={`relative flex h-[33px] shrink-0 items-center justify-center gap-0.5 rounded-[10px] transition-colors ${active ? 'bg-[var(--tool-active)] text-[var(--tool-active-ink)]' : `${dim ? 'text-white/85' : 'text-white'} active:bg-white/10`}`}
      style={{ width: chevron ? w + 14 : w }}>
      {children}
      {chevron && <ChevronDown size={13} className="opacity-80" />}
    </button>
  )
}
const Sep = () => <span className="mx-1.5 h-[22px] w-px shrink-0 bg-white/20" />

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
}
export default function Toolbar({ tool, onTool, prefs, anchors, popover, onPop, sidebar, onSidebar, readOnly, onReadOnly, accActive, onAcc }: Props) {
  const t = useT()
  const reg = (k: string) => (el: HTMLElement | null) => { anchors.current[k] = el }
  const tools: ToolId[] = prefs.visibleTools
  const hiddenAcc = ALL_ACC.filter((a) => !prefs.visibleAcc.includes(a))
  const shown = ALL_ACC.filter((a) => prefs.visibleAcc.includes(a))
  const Lasso = LassoI
  return (
    <div className="relative z-30 flex h-[41px] shrink-0 items-center bg-bar px-[7px]">
      <div className="flex w-[160px] shrink-0 items-center gap-1 lg:w-[240px]">
        <BarBtn label={t('Seitenleiste')} active={false} onClick={onSidebar}>
          <span className={`flex h-[33px] w-[33px] items-center justify-center rounded-[10px] ${sidebar ? 'bg-black/30' : ''}`}><SidebarI size={21} /></span>
        </BarBtn>
        <BarBtn label={t('Suchen')} onClick={() => onPop(popover === 'search' ? null : 'search')} refFn={reg('search')}><SearchI size={21} /></BarBtn>
        <BarBtn label={t('Lesemodus')} active={readOnly} onClick={onReadOnly}><ReadI size={21} /></BarBtn>
      </div>

      <div className="no-scrollbar flex min-w-0 flex-1 items-center justify-center overflow-x-auto">
        <BarBtn label={t('Lasso')} active={tool === 'lasso'} chevron={tool === 'lasso'} refFn={reg('tool:lasso')} onClick={() => onTool('lasso', tool === 'lasso')}><Lasso size={22} active={tool === 'lasso'} /></BarBtn>
        <Sep />
        {tools.map((id) => {
          const { Icon, label } = TOOL_META[id as Exclude<ToolId, 'lasso'>]
          const active = tool === id
          return (
            <BarBtn key={id} label={t(label)} active={active} refFn={reg(`tool:${id}`)} onClick={() => onTool(id, active)}>
              <Icon size={22} active={active} />
            </BarBtn>
          )
        })}
        {(shown.length > 0 || hiddenAcc.length > 0) && <Sep />}
        {shown.map((a) => { const { Icon, label } = ACC_META[a]; return <BarBtn key={a} label={t(label)} active={accActive[a]} onClick={() => onAcc(a)}><Icon size={22} /></BarBtn> })}
        <BarBtn label={t('Zubehör')} chevron active={popover === 'acc'} refFn={reg('acc')} onClick={() => onPop(popover === 'acc' ? null : 'acc')} w={30}><AccessoriesI size={22} /></BarBtn>
      </div>

      <div className="flex w-[130px] shrink-0 items-center justify-end gap-1 lg:w-[210px]">
        <BarBtn label={t('Seite hinzufügen')} refFn={reg('add')} active={popover === 'add'} onClick={() => onPop(popover === 'add' ? null : 'add')}><PagePlusI size={22} /></BarBtn>
        <BarBtn label={t('Teilen und Exportieren')} refFn={reg('share')} active={popover === 'share'} onClick={() => onPop(popover === 'share' ? null : 'share')}><ShareI size={22} /></BarBtn>
        <BarBtn label={t('Mehr')} refFn={reg('more')} active={popover === 'more'} onClick={() => onPop(popover === 'more' ? null : 'more')}><MoreI size={24} /></BarBtn>
      </div>
    </div>
  )
}
