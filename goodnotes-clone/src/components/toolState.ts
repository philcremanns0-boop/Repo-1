import { DEFAULT_OPTS, type PenOpts, type PenType, type ShapeKind } from '../lib/draw'
import { DEFAULT_TEXT, type TextStyle } from './ObjectsLayer'
import type { CanvasTool } from './NoteCanvas'
import type { AccId, ToolId } from './editorTypes'

export type PenMode = 'pen' | 'highlighter' | 'tape'
export type ColorKey = PenMode | 'shape'
export interface ToolPrefs {
  penMode: PenMode
  penType: PenType
  penOpts: Record<PenType, PenOpts>
  stab: number
  thick: Record<ColorKey, 0 | 1 | 2>
  colors: string[]
  colorIdx: Record<ColorKey, number>
  eraser: 'precision' | 'standard' | 'stroke'
  eraserSize: 0 | 1 | 2
  erFilter: { pen: boolean; highlighter: boolean; tape: boolean }
  shape: ShapeKind
  fill: boolean
  autoShape: boolean
  lassoMode: 'free' | 'rect'
  lassoStrokes: boolean
  lassoObjects: boolean
  laserColor: string
  laserTrail: boolean
  textStyle: TextStyle
  pinText: boolean
  visibleTools: ToolId[]
  visibleAcc: AccId[]
  recent: string[]
  recentFonts: string[]
  lowLat: boolean
  hlStraight: boolean
  /** Goodnotes: 'Radierer automatisch abwählen' – back to the previous tool after one erase gesture */
  erAuto: boolean
  textPresets: { name: string; style: Partial<TextStyle> }[]
  spell: boolean
  mathSug: boolean
}
export const DEFAULT_PRESETS: ToolPrefs['textPresets'] = [
  { name: 'Titel', style: { size: 32, bold: true, italic: false } },
  { name: 'Überschrift', style: { size: 24, bold: true, italic: false } },
  { name: 'Unterüberschrift', style: { size: 20, bold: true, italic: false } },
  { name: 'Text', style: { size: 16, bold: false, italic: false } },
]
export const DEFAULT_TOOLS: ToolId[] = ['pen', 'eraser', 'text', 'objects', 'images', 'shapes', 'note', 'laser']
export const DEFAULT_ACC: AccId[] = ['record']
export const ALL_ACC: AccId[] = ['record', 'recordings', 'zoom', 'ruler', 'timer']
export const WIDTHS: Record<ColorKey, [number, number, number]> = {
  pen: [1.4, 2.6, 5], highlighter: [12, 18, 28], tape: [18, 28, 40], shape: [1.4, 2.6, 5],
}
export const ERASER_SIZES: [number, number, number] = [10, 22, 42]
export const DEFAULT_PREFS: ToolPrefs = {
  penMode: 'pen', penType: 'fountain', penOpts: { ...DEFAULT_OPTS }, stab: 0,
  thick: { pen: 1, highlighter: 1, tape: 1, shape: 1 },
  colors: ['#000000', '#b9ffb9', '#e00000', '#9b2335', '#ffff88', '#00aa00', '#1f6fe5'],
  colorIdx: { pen: 0, highlighter: 4, tape: 1, shape: 0 },
  eraser: 'stroke', eraserSize: 1, erFilter: { pen: true, highlighter: true, tape: true },
  shape: 'rect', fill: false, autoShape: false,
  lassoMode: 'free', lassoStrokes: true, lassoObjects: true,
  laserColor: '#ff3b30', laserTrail: true,
  textStyle: DEFAULT_TEXT, pinText: false,
  visibleTools: DEFAULT_TOOLS, visibleAcc: DEFAULT_ACC, recent: [], recentFonts: ['Chalkboard SE'], lowLat: false, hlStraight: false, erAuto: false, textPresets: DEFAULT_PRESETS, spell: false, mathSug: false,
}
const KEY = 'gn:tools'
export function loadPrefs(): ToolPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v) return { ...DEFAULT_PREFS, ...v, eraser: ['precision', 'standard', 'stroke'].includes(v.eraser) ? v.eraser : v.eraser === 'pixel' ? 'precision' : 'stroke', erFilter: { ...DEFAULT_PREFS.erFilter, ...v.erFilter }, thick: { ...DEFAULT_PREFS.thick, ...v.thick }, colorIdx: { ...DEFAULT_PREFS.colorIdx, ...v.colorIdx }, penOpts: { ...DEFAULT_PREFS.penOpts, ...v.penOpts }, textStyle: { ...DEFAULT_TEXT, ...v.textStyle } }
  } catch { /* ignore */ }
  return DEFAULT_PREFS
}
export const savePrefs = (p: ToolPrefs) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }

export const colorKey = (tool: ToolId, p: ToolPrefs): ColorKey => (tool === 'shapes' ? 'shape' : p.penMode)
export function currentColor(tool: ToolId, p: ToolPrefs) { const k = colorKey(tool, p); return p.colors[p.colorIdx[k]] ?? '#000000' }

export function buildCanvasTool(tool: ToolId, p: ToolPrefs, readOnly: boolean): CanvasTool {
  const k = colorKey(tool, p)
  const base: CanvasTool = {
    kind: 'none', color: p.colors[p.colorIdx[k]] ?? '#000', width: WIDTHS[k][p.thick[k]], pen: p.penType, opts: p.penOpts[p.penType], stab: p.stab,
    eraser: p.eraser, eraserSize: ERASER_SIZES[p.eraserSize], erFilter: p.erFilter, shape: p.shape, fill: p.fill, autoShape: p.autoShape,
    lassoMode: p.lassoMode, lassoStrokes: p.lassoStrokes, lassoObjects: p.lassoObjects, hlStraight: p.hlStraight,
  }
  if (readOnly) return base
  if (tool === 'pen') base.kind = p.penMode
  else if (tool === 'eraser') base.kind = 'eraser'
  else if (tool === 'shapes') base.kind = 'shape'
  else if (tool === 'lasso') base.kind = 'lasso'
  return base
}
