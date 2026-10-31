import { newId, selectionBBox, translateStroke, type Content, type Selection } from './draw'

/** In-app clipboard for lasso Copy / Cut / Paste (works across pages and notebooks in this tab). */
let clip: Content | null = null
export const hasClip = () => !!clip && clip.strokes.length + clip.texts.length + clip.images.length > 0

export function pick(c: Content, s: Selection): Content {
  return {
    strokes: c.strokes.filter((x) => s.strokes.includes(x.id)),
    texts: c.texts.filter((x) => s.texts.includes(x.id)),
    images: c.images.filter((x) => s.images.includes(x.id)),
  }
}
export function remove(c: Content, s: Selection): Content {
  return {
    strokes: c.strokes.filter((x) => !s.strokes.includes(x.id)),
    texts: c.texts.filter((x) => !s.texts.includes(x.id)),
    images: c.images.filter((x) => !s.images.includes(x.id)),
  }
}
export const copySel = (c: Content, s: Selection) => { clip = JSON.parse(JSON.stringify(pick(c, s))) }

/** Content to paste with fresh ids; placed with its top-left at `at` (or offset 24 from the original). */
export function clipFor(pageId: string, at?: { x: number; y: number }): { add: Content; sel: Selection } | null {
  if (!clip || !hasClip()) return null
  const all: Selection = { pageId, strokes: clip.strokes.map((x) => x.id), texts: clip.texts.map((x) => x.id), images: clip.images.map((x) => x.id) }
  const bb = selectionBBox(clip, all)
  const dx = at && bb ? at.x - bb.x0 : 24, dy = at && bb ? at.y - bb.y0 : 24
  const sel: Selection = { pageId, strokes: [], texts: [], images: [] }
  const add: Content = {
    strokes: clip.strokes.map((s) => { const n = { ...translateStroke(s, dx, dy), id: newId() }; sel.strokes.push(n.id); return n }),
    texts: clip.texts.map((s) => { const n = { ...s, x: s.x + dx, y: s.y + dy, id: newId() }; sel.texts.push(n.id); return n }),
    images: clip.images.map((s) => { const n = { ...s, x: s.x + dx, y: s.y + dy, id: newId() }; sel.images.push(n.id); return n }),
  }
  return { add, sel }
}
