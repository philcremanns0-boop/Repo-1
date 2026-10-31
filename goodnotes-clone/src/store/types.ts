import type { Content } from '../lib/draw'
import type { PaperColor, SizeId, TemplateId } from '../lib/paper'
import type { CoverId } from '../lib/covers'

export interface PageMeta { size: SizeId; template: TemplateId; color: PaperColor }
export interface Page extends PageMeta { id: string; content: Content; bookmarked: boolean }
export interface OutlineItem { id: string; pageId: string; title: string }
export interface NotebookData { id: string; title: string; pages: Page[]; currentId: string; outline: OutlineItem[] }
export interface NbMeta {
  id: string; title: string; cover: CoverId; coverColor: string
  created: number; updated: number; pages: number; deleted?: number
}
export interface NewNotebookOpts extends PageMeta { title: string; cover: CoverId; coverColor: string }
