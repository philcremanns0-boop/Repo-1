import { useState, type RefObject } from 'react'
import { Check, Clock, Image as ImageIcon, Camera, FileDown, ScanLine, Settings } from 'lucide-react'
import { ELEMENT_CATEGORIES } from '../../lib/elements'
import { fontStack, QUICK_FONTS } from '../../lib/fonts'
import { Group, Popover, PopTitle, Row, Segmented, Slider, Toggle } from '../ui'
import { useSettings, useT } from '../../context/Settings'
import { ACC_META } from '../Toolbar'
import { ALL_ACC, type ToolPrefs } from '../toolState'
import type { AccId } from '../editorTypes'
import { Wheel } from './ColorPopover'
import { EraserI } from '../icons'
import ColorPopover from './ColorPopover'

type A = RefObject<HTMLElement | null>
type Set = (fn: (p: ToolPrefs) => ToolPrefs) => void
interface Base { anchor: A; open: boolean; onClose: () => void }

/* ------------------------------ Eraser ------------------------------ */
export function EraserPopover({ prefs, set, onClearPage, ...b }: Base & { prefs: ToolPrefs; set: Set; onClearPage: () => void }) {
  const t = useT()
  const styles = [['precision', 'Präzisionsradierer', 'Radiert nur, was im Kreis liegt'], ['standard', 'Standardradierer', 'Radiert ein kurzes Stück eines Strichs'], ['stroke', 'Strichradierer', 'Radiert den ganzen Strich']] as const
  return (
    <Popover {...b} width={370}>
      <PopTitle>{t('Radierer')}</PopTitle>
      <Group>
        {styles.map(([k, label, sub]) => (
          <Row key={k} icon={<EraserI size={22} />} sub={t(sub)} onClick={() => set((p) => ({ ...p, eraser: k }))} trailing={prefs.eraser === k ? <Check size={20} className="text-accent" /> : null}>{t(label)}</Row>
        ))}
      </Group>
      <div className="px-4 pb-0 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Größe')}</div>
      <Group className="px-3.5"><Slider value={prefs.eraserSize} min={0} max={2} ticks={3} onChange={(v) => set((p) => ({ ...p, eraserSize: v as 0 | 1 | 2 }))} /></Group>
      <div className="px-4 pb-1.5 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Radierfilter')}</div>
      <Group>
        {([['pen', 'Stift'], ['highlighter', 'Textmarker'], ['tape', 'Washi-Tape']] as const).map(([k, l]) => (
          <Row as="div" key={k} trailing={<Toggle on={prefs.erFilter[k]} onChange={(v) => set((p) => ({ ...p, erFilter: { ...p.erFilter, [k]: v } }))} />}>{t(l)}</Row>
        ))}
      </Group>
      <div className="h-3" />
      <Group><Row danger onClick={() => { onClearPage(); b.onClose() }}>{t('Seite leeren')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Lasso ------------------------------ */
export function LassoPopover({ prefs, set, ...b }: Base & { prefs: ToolPrefs; set: Set }) {
  const t = useT()
  return (
    <Popover {...b} width={340} align="left">
      <PopTitle>{t('Lasso')}</PopTitle>
      <div className="px-3"><Segmented value={prefs.lassoMode} onChange={(v) => set((p) => ({ ...p, lassoMode: v }))} options={[{ id: 'free', label: t('Freihand') }, { id: 'rect', label: t('Rechteck') }]} /></div>
      <div className="px-4 pb-1.5 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Auswählen')}</div>
      <Group>
        <Row as="div" trailing={<Toggle on={prefs.lassoStrokes} onChange={(v) => set((p) => ({ ...p, lassoStrokes: v }))} />}>{t('Handschrift & Formen')}</Row>
        <Row as="div" trailing={<Toggle on={prefs.lassoObjects} onChange={(v) => set((p) => ({ ...p, lassoObjects: v }))} />}>{t('Text & Bilder')}</Row>
      </Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Objects ------------------------------ */
export function ObjectsPopover({ prefs, onInsert, ...b }: Base & { prefs: ToolPrefs; onInsert: (src: string) => void }) {
  const t = useT()
  const [cat, setCat] = useState<string>('recent')
  const items = cat === 'recent' ? prefs.recent.map((src, i) => ({ id: String(i), label: '', src })) : ELEMENT_CATEGORIES.find((c) => c.id === cat)?.items ?? []
  return (
    <Popover {...b} width={480}>
      <div className="flex h-[min(560px,70vh)] flex-col">
        <PopTitle>{t('Objekte')}</PopTitle>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <div className="px-2 pb-2 pt-3 text-[19px] font-semibold text-sub">{cat === 'recent' ? t('Neueste') : t(ELEMENT_CATEGORIES.find((c) => c.id === cat)!.label)}</div>
          {items.length === 0 ? (
            <p className="px-2 py-10 text-center text-[17px] text-sub">{t('Noch keine Objekte verwendet. Wähle unten eine Kategorie.')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 pb-3">
              {items.map((it) => (
                <button key={it.id} aria-label={it.label || 'object'} onClick={() => { onInsert(it.src); b.onClose() }} className="flex aspect-square items-center justify-center rounded-[18px] border border-hair bg-white p-5 active:scale-95">
                  <img src={it.src} alt="" className="h-full w-full object-contain" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto bg-card/60 px-3 py-2.5 no-scrollbar">
          <button aria-label={t('Neueste')} onClick={() => setCat('recent')} className={`flex h-10 w-[72px] shrink-0 items-center justify-center rounded-full ${cat === 'recent' ? 'bg-accent text-white' : 'bg-chip'}`}><Clock size={20} /></button>
          {ELEMENT_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold ${cat === c.id ? 'bg-accent text-white' : 'bg-chip'}`}>{t(c.label)}</button>
          ))}
        </div>
      </div>
    </Popover>
  )
}

/* ------------------------------ Images ------------------------------ */
export function ImagesPopover({ onChoose, ...b }: Base & { onChoose: (k: 'file' | 'camera') => void }) {
  const t = useT()
  return (
    <Popover {...b} width={340}>
      <PopTitle>{t('Bilder')}</PopTitle>
      <Group>
        <Row icon={<ImageIcon size={22} />} onClick={() => { onChoose('file'); b.onClose() }}>{t('Bild')}</Row>
        <Row icon={<Camera size={22} />} onClick={() => { onChoose('camera'); b.onClose() }}>{t('Foto aufnehmen')}</Row>
      </Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Accessories ------------------------------ */
export function AccessoriesPopover({ prefs, onAcc, onCustomize, ...b }: Base & { prefs: ToolPrefs; onAcc: (a: AccId) => void; onCustomize: () => void }) {
  const t = useT()
  const hidden = ALL_ACC.filter((a) => !prefs.visibleAcc.includes(a))
  return (
    <Popover {...b} width={350}>
      <PopTitle>{t('Zubehör')}</PopTitle>
      {hidden.length > 0 && (
        <Group>{hidden.map((a) => { const { Icon, label } = ACC_META[a]; return <Row key={a} icon={<Icon size={22} />} onClick={() => { onAcc(a); b.onClose() }}>{t(label)}</Row> })}</Group>
      )}
      <div className="h-3" />
      <Group><Row onClick={() => { b.onClose(); onCustomize() }}>{t('Werkzeugleiste anpassen')}</Row></Group>
      <div className="h-4" />
    </Popover>
  )
}

/* ------------------------------ Text popovers ------------------------------ */
export function FontPopover({ prefs, onFont, onMore, ...b }: Base & { prefs: ToolPrefs; onFont: (f: string) => void; onMore: () => void }) {
  const t = useT()
  const cur = prefs.textStyle.font
  return (
    <Popover {...b} width={330} align="left">
      <div className="space-y-3 p-3">
        <Group className="!mx-0"><Row onClick={() => b.onClose()} trailing={<Check size={20} className="text-accent" />}><span style={{ fontFamily: fontStack(cur), fontSize: 18 }}>{cur}</span></Row></Group>
        <Group className="!mx-0">
          {QUICK_FONTS.map((f) => <Row key={f.label} onClick={() => { onFont(f.font); b.onClose() }}><span style={{ fontFamily: fontStack(f.font), fontSize: 22 }}>{t(f.label)}</span></Row>)}
        </Group>
        <Group className="!mx-0"><Row onClick={() => { b.onClose(); onMore() }}>{t('Weitere Schriften …')}</Row></Group>
      </div>
    </Popover>
  )
}
export const SIZES_LIST = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64, 72, 96]
export function SizePopover({ prefs, onSize, ...b }: Base & { prefs: ToolPrefs; onSize: (n: number) => void }) {
  const cur = prefs.textStyle.size
  return (
    <Popover {...b} width={170}>
      <div className="max-h-[360px] overflow-y-auto p-2">
        {SIZES_LIST.map((n) => (
          <button key={n} onClick={() => { onSize(n); b.onClose() }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[18px] ${n === cur ? 'bg-card font-semibold' : ''}`}>{n}{n === cur && <Check size={18} className="text-accent" />}</button>
        ))}
      </div>
    </Popover>
  )
}
export function SpacingPopover({ prefs, onLh, ...b }: Base & { prefs: ToolPrefs; onLh: (n: number) => void }) {
  const t = useT()
  return (
    <Popover {...b} width={300}>
      <PopTitle>{t('Zeilenabstand')}</PopTitle>
      <div className="px-4 pb-4"><div className="flex justify-between text-[16px] text-sub"><span>0.8</span><span className="font-semibold text-ink">{prefs.textStyle.lh.toFixed(1)}</span><span>2.5</span></div>
        <Slider value={Math.round(prefs.textStyle.lh * 10)} min={8} max={25} onChange={(v) => onLh(v / 10)} /></div>
    </Popover>
  )
}
export function TextColorPopover({ prefs, onColor, ...b }: Base & { prefs: ToolPrefs; onColor: (c: string) => void }) {
  const t = useT()
  return <ColorPopover {...b} color={prefs.textStyle.color} onChange={onColor} title={t('Textfarbe')} />
}

/* ------------------------------ Settings content ------------------------------ */
export function SettingsBody() {
  const t = useT()
  const { theme, dark, scroll, lang, toolbar, set } = useSettings()
  return (
    <>
      <div className="px-4 pb-1.5 pt-2 text-[16px] uppercase tracking-wide text-sub">{t('Darstellung')}</div>
      <Group>
        <Row as="div" trailing={<Toggle on={dark} onChange={(v) => set({ theme: v ? 'dark' : 'light' })} label={t('Dunkelmodus')} />}>{t('Dunkelmodus')}</Row>
        <Row as="div" trailing={<Toggle on={theme === 'system'} onChange={(v) => set({ theme: v ? 'system' : dark ? 'dark' : 'light' })} />}>{t('Systemeinstellung verwenden')}</Row>
      </Group>
      <div className="px-4 pb-1.5 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Scrollrichtung')}</div>
      <div className="px-3"><Segmented value={scroll} onChange={(v) => set({ scroll: v })} options={[{ id: 'vertical', label: t('Vertikal') }, { id: 'horizontal', label: t('Horizontal') }]} /></div>
      <div className="px-4 pb-1.5 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Werkzeugleiste')}</div>
      <div className="px-3"><Segmented value={toolbar} onChange={(v) => set({ toolbar: v })} options={[{ id: 'docked', label: t('Angedockt') }, { id: 'floating', label: t('Schwebend') }]} /></div>
      <div className="px-4 pb-1.5 pt-4 text-[16px] uppercase tracking-wide text-sub">{t('Sprache')}</div>
      <div className="px-3"><Segmented value={lang} onChange={(v) => set({ lang: v })} options={[{ id: 'de', label: 'Deutsch' }, { id: 'en', label: 'English' }]} /></div>
      <div className="h-4" />
    </>
  )
}
export function SettingsPopover(b: Base) {
  const t = useT()
  return <Popover {...b} width={360} align="right"><PopTitle>{t('Einstellungen')}</PopTitle><SettingsBody /></Popover>
}
export const iconsUsed = [FileDown, ScanLine, Settings, Wheel]
