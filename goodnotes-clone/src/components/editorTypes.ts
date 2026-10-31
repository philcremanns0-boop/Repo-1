import type { Selection } from '../lib/draw'
import type { CanvasTool, Ruler } from './NoteCanvas'
import type { TextStyle } from './ObjectsLayer'

export type ToolId = 'lasso' | 'pen' | 'eraser' | 'text' | 'objects' | 'images' | 'shapes' | 'note' | 'laser'
export type AccId = 'record' | 'recordings' | 'zoom' | 'ruler' | 'timer'
/** Zoom-Ansicht: region of a page (page units) mirrored into the magnified writing panel. */
export interface ZoomRegion { pageId: string; x: number; y: number; w: number; h: number }
export interface TextRef { pageId: string; id: number }
export interface EditorProps {
  tool: ToolId
  canvasTool: CanvasTool
  zoom: number
  selection: Selection | null
  setSelection: (s: Selection | null) => void
  textStyle: TextStyle
  selText: TextRef | null
  setSelText: (v: TextRef | null) => void
  editText: TextRef | null
  setEditText: (v: TextRef | null) => void
  ruler: Ruler | null
  setRuler: (r: Ruler | null) => void
  colors: string[]
  onTextCreated: () => void
  onLassoTap: (pageId: string, p: { x: number; y: number }, client: { x: number; y: number }) => void
  toast: (m: string) => void
  readOnly: boolean
  onAddLink: (pageId: string, box: { x: number; y: number; w: number; h: number }) => void
  goPage: (pageId: string) => void
  pageNo: (pageId: string) => number
  zoomRegion: ZoomRegion | null
  setZoomRegion: (r: ZoomRegion | null) => void
  flash: { pageId: string; needle: string } | null
  clearFlash: () => void
  onEraseEnd: () => void
  /** audio playback position: ink written later during the same recording is dimmed (Goodnotes audio sync) */
  playback: { now: number; end: number; start: number } | null
  onSaveElement: (src: string) => void
  spell: boolean
  noteColor: string
}
