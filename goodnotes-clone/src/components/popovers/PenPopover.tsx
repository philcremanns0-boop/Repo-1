import { useEffect, useRef, useState, type RefObject } from 'react'
import { BallpointI, BrushI, FountainI } from '../icons'
import { drawStroke, pointWeight, type PenType, type Stroke } from '../../lib/draw'
import { BackBtn, Group, Popover, PopTitle, Push, Row, Slider, Toggle } from '../ui'
import { useSettings, useT } from '../../context/Settings'
import type { ToolPrefs } from '../toolState'

const NAMES: Record<PenType, string> = { fountain: 'Füllfederhalter', ballpoint: 'Kugelschreiber', brush: 'Pinselstift' }
const ROUND = ['Rund', 'Leicht', 'Mittel', 'Flach']

export function PenPreview({ type, opts, color }: { type: PenType; opts: ToolPrefs['penOpts'][PenType]; color: string }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    const bez = (a: number[], b: number[], c2: number[], d: number[], t: number) => [0, 1].map((i) => (1 - t) ** 3 * a[i] + 3 * (1 - t) ** 2 * t * b[i] + 3 * (1 - t) * t * t * c2[i] + t ** 3 * d[i])
    const pts: { x: number; y: number; w: number }[] = []
    let w = 0
    const segs = [[[22, 38], [50, 95], [100, 100], [150, 52]], [[150, 52], [200, 6], [265, -2], [330, 44]]]
    segs.forEach((s, k) => { for (let i = k ? 1 : 0; i <= 30; i++) { const [x, y] = bez(s[0], s[1], s[2], s[3], i / 30); const prev = pts[pts.length - 1]; const sp = prev ? Math.hypot(x - prev.x, y - prev.y) / 9 : 0; w = pointWeight(type, opts, 'mouse', 0.5, sp * 1.6, w); pts.push({ x, y: y + 24, w }) } })
    const s: Stroke = { id: 0, tool: 'pen', pen: type, opts, color, width: 5.5, points: pts }
    drawStroke(ctx, s)
  }, [type, opts, color])
  return <canvas ref={cv} width={360} height={130} className="mx-auto block" />
}

type View = 'main' | 'settings' | 'help' | 'math' | 'hold' | 'gestures'
interface Props { anchor: RefObject<HTMLElement | null>; open: boolean; onClose: () => void; prefs: ToolPrefs; set: (fn: (p: ToolPrefs) => ToolPrefs) => void }
export default function PenPopover({ anchor, open, onClose, prefs, set }: Props) {
  const t = useT()
  const { dark } = useSettings()
  const [view, setViewRaw] = useState<View>('main')
  const [dir, setDir] = useState<1 | -1>(1)
  const depth: Record<View, number> = { main: 0, settings: 1, help: 1, math: 1, hold: 2, gestures: 2 }
  const setView = (v: View) => { setDir(depth[v] >= depth[view] ? 1 : -1); setViewRaw(v) }
  useEffect(() => { if (!open) { setViewRaw('main'); setDir(1) } }, [open])
  const o = prefs.penOpts[prefs.penType]
  const setOpt = (patch: Partial<typeof o>) => set((p) => ({ ...p, penOpts: { ...p.penOpts, [p.penType]: { ...p.penOpts[p.penType], ...patch } } }))
  const Cap = ({ label, value, children, off }: { label: string; value: string; children: React.ReactNode; off?: boolean }) => (
    <div className={`px-3.5 pb-0.5 pt-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair ${off ? 'pointer-events-none opacity-40' : ''}`}>
      <div className="flex justify-between text-[16px] uppercase tracking-wide"><span>{label}</span><span className="normal-case">{value}</span></div>{children}
    </div>
  )
  const sub = (title: string, body: React.ReactNode) => (
    <>
      <PopTitle left={<BackBtn onClick={() => setView(view === 'hold' || view === 'gestures' ? 'settings' : 'main')} />}>{t(title)}</PopTitle>
      {body}
    </>
  )
  const note = (s: string) => <p className="px-5 pb-5 pt-3 text-[16px] leading-snug text-sub">{t(s)}</p>
  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={370} align="left" className="!bg-pop">
      <Push id={view} dir={dir}>
      {view === 'main' && (
        <>
          <PopTitle>{t(NAMES[prefs.penType])}</PopTitle>
          <PenPreview type={prefs.penType} opts={o} color={dark ? '#ffffff' : '#000000'} />
          <div className="mx-3 mt-1 grid grid-cols-3 gap-1">
            {([['fountain', FountainI], ['ballpoint', BallpointI], ['brush', BrushI]] as const).map(([id, I]) => (
              <button key={id} onClick={() => set((p) => ({ ...p, penType: id }))} className={`flex flex-col items-center gap-1.5 rounded-[18px] py-4 text-[16px] ${prefs.penType === id ? 'bg-card' : ''}`}>
                <I size={28} active={prefs.penType === id} />{t(NAMES[id])}
              </button>
            ))}
          </div>
          <div className="h-3" />
          <Group>
            <Cap off={prefs.penType === 'ballpoint'} label={t('Schärfe der Spitze')} value={`${o.sharp}%`}><Slider value={o.sharp} onChange={(v) => setOpt({ sharp: v })} ticks={5} step={5} /></Cap>
            <Cap off={prefs.penType === 'ballpoint'} label={t('Druckempfindlichkeit')} value={`${o.press}%`}><Slider value={o.press} onChange={(v) => setOpt({ press: v })} ticks={5} step={5} /></Cap>
            <Cap label={t('Rundung der Spitze')} value={t(ROUND[o.round])}><Slider value={o.round} min={0} max={3} ticks={4} onChange={(v) => setOpt({ round: v })} /></Cap>
            <Cap label={t('Strich-Stabilisierung')} value={`${prefs.stab}%`}><Slider value={prefs.stab} onChange={(v) => set((p) => ({ ...p, stab: v }))} step={5} /></Cap>
          </Group>
          <div className="px-4 pb-1.5 pt-4 text-[19px] font-semibold text-sub">{t('Einstellungen')}</div>
          <Group>
            <Row chevron onClick={() => setView('settings')}>{t('Stift-Einstellungen')}</Row>
            <Row chevron onClick={() => setView('help')}>{t('Schreibhilfen')}</Row>
            <Row chevron onClick={() => setView('math')}>{t('Mathe-Assistenz')}</Row>
          </Group>
          <div className="h-4" />
        </>
      )}
      {view === 'settings' && sub('Stift-Einstellungen', (
        <>
          <div className="px-4 pb-1.5 pt-3 text-[19px] font-semibold text-sub">{t('Einstellungen')}</div>
          <Group>
            <Row as="div" trailing={<Toggle on={o.speed} onChange={(v) => setOpt({ speed: v })} />}>{t('Stärke nach Geschwindigkeit')}</Row>
            <Row as="div" trailing={<Toggle on={prefs.lowLat} onChange={(v) => set((p) => ({ ...p, lowLat: v }))} />}>{t('Verzögerung reduzieren')}</Row>
            <Row chevron onClick={() => setView('hold')}>{t('Zeichnen und halten')}</Row>
            <Row chevron onClick={() => setView('gestures')}>{t('Stiftgesten')}</Row>
          </Group>
          <div className="h-4" />
        </>
      ))}
      {view === 'hold' && sub('Zeichnen und halten', (
        <>
          <div className="h-2" />
          <Group><Row as="div" trailing={<Toggle on={prefs.autoShape} onChange={(v) => set((p) => ({ ...p, autoShape: v }))} />}>{t('Formen automatisch erkennen')}</Row></Group>
          {note('Halte den Stift am Ende eines Strichs gedrückt, damit eine Linie oder Ellipse geradegezogen wird.')}
        </>
      ))}
      {view === 'gestures' && sub('Stiftgesten', note('Stiftgesten wie Doppeltippen sind nur in der nativen App verfügbar – Browser erhalten diese Ereignisse nicht.'))}
      {view === 'help' && sub('Schreibhilfen', (
        <>
          <div className="h-2" />
          <Group><Row as="div" trailing={<span className="text-[17px] text-accent">{t('Automatisch')}</span>}>{t('Sprache der Handschrifterkennung')}</Row></Group>
          <div className="h-3" />
          <Group><Row as="div" trailing={<Toggle on={prefs.spell} onChange={(v) => set((p) => ({ ...p, spell: v }))} />}>{t('Rechtschreibung prüfen')}</Row></Group>
          <p className="px-5 pb-3 pt-2 text-[16px] leading-snug text-sub">{t('Aktiviere Rechtschreibprüfung für Textfelder in diesem Notizbuch')}</p>
          {note('Handschrifterkennung ist in dieser Web-Version nicht enthalten.')}
        </>
      ))}
      {view === 'math' && sub('Mathe-Assistenz', (
        <>
          <div className="mx-3 mt-2 overflow-hidden rounded-[20px] bg-card">
            <div className="h-[150px] bg-[#faf7ea] bg-[linear-gradient(#e8e4d4_1px,transparent_1px),linear-gradient(90deg,#e8e4d4_1px,transparent_1px)] bg-[length:22px_22px] p-6 font-serif text-[22px] text-black/80">(6x−5+3)</div>
            <Row as="div" trailing={<Toggle on={prefs.mathSug} onChange={(v) => set((p) => ({ ...p, mathSug: v }))} />}>{t('Vorschläge')}</Row>
          </div>
          <p className="px-5 pb-2 pt-2 text-[16px] leading-snug text-sub">{t('Erhalte Vorschläge und Lösungen, wenn du an mathematischen Gleichungen arbeitest.')}</p>
          {note('Die Gleichungserkennung ist in dieser Web-Version nicht enthalten.')}
        </>
      ))}
      </Push>
    </Popover>
  )
}
