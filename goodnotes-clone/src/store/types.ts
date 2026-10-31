import type { Content } from '../lib/draw'
import type { PaperColor, SizeId, TemplateId } from '../lib/paper'
import type { CoverId } from '../lib/covers'

export interface PageMeta { size: SizeId; template: TemplateId; color: PaperColor }
/** Imported PDF page: rendered background stored in IndexedDB under `key`, page size in 96-dpi units. */
export interface PageBg { key: string; w: number; h: number; /** extracted PDF text (search) */ text?: string }
export interface Page extends PageMeta { id: string; content: Content; bookmarked: boolean; bg?: PageBg }
export interface OutlineItem { id: string; pageId: string; title: string }
export interface NotebookData { id: string; title: string; pages: Page[]; currentId: string; outline: OutlineItem[] }
export interface NbMeta {
  id: string; title: string; cover: CoverId; coverColor: string
  created: number; updated: number; pages: number; deleted?: number; folder?: string | null; starred?: boolean
}
export interface Folder { id: string; name: string; color: string; icon: string; parent: string | null; created: number }
export interface NewNotebookOpts extends PageMeta { title: string; cover: CoverId; coverColor: string; folder?: string | null }
