import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { emptyContent, newId, type Content, type Stroke } from '../lib/draw'
import { SIZES, type SizeId } from '../lib/paper'
import type { NotebookData, Page, PageMeta, OutlineItem } from './types'
import { ensureMigrated, kvGet, kvSet } from '../lib/kv'

export interface PageStore {
  id: string
  content: Content
  /** one undoable step */
  commit: (fn: (c: Content) => Content) => void
  /** change without history (live preview) */
  live: (fn: (c: Content) => Content) => void
  /** record `base` as the undo step for the current content */
  checkpoint: (base: Content) => void
  undo: () => void
  redo: () => void
}

interface PageState extends Page { past: Content[]; future: Content[] }
interface State { title: string; pages: PageState[]; currentId: string; outline: OutlineItem[] }

export const nbKey = (id: string) => `gn:nb:${id}`
const LIMIT = 100
const cap = (p: Content[]) => (p.length > LIMIT ? p.slice(-LIMIT) : p)
let uid = 0
export const newPageId = () => `p_${Date.now().toString(36)}_${(uid++).toString(36)}`
const blankPage = (m: PageMeta): PageState => ({ id: newPageId(), ...m, content: emptyContent(), bookmarked: false, past: [], future: [] })

export function createNotebookData(id: string, title: string, meta: PageMeta, bgs?: Page['bg'][]): NotebookData {
  const list = bgs?.length ? bgs : [undefined]
  const pages: Page[] = list.map((bg) => { const p = blankPage(meta); return { id: p.id, size: p.size, template: bg ? 'blank' : p.template, color: bg ? 'white' : p.color, content: p.content, bookmarked: false, bg } })
  return { id, title, pages, currentId: pages[0].id, outline: [] }
}
export function saveNotebookData(d: NotebookData): Promise<boolean> {
  return kvSet(nbKey(d.id), JSON.stringify({ v: 2, ...d }))
}
function isStroke(s: any): s is Stroke {
  return s && ['pen', 'highlighter', 'shape'].includes(s.tool) && typeof s.color === 'string' && typeof s.width === 'number' && typeof s.id === 'number' &&
    Array.isArray(s.points) && s.points.every((p: any) => p && isFinite(p.x) && isFinite(p.y) && isFinite(p.w))
}
export async function loadNotebookData(id: string): Promise<NotebookData | null> {
  try {
    await ensureMigrated()
    const raw = await kvGet(nbKey(id))
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || !Array.isArray(d.pages) || !d.pages.length) return null
    const pages: Page[] = d.pages.map((p: any) => ({
      id: typeof p.id === 'string' ? p.id : newPageId(),
      size: SIZES[p.size as SizeId] ? p.size : 'a4p', template: p.template ?? 'wide', color: p.color ?? 'white',
      bookmarked: !!p.bookmarked,
      bg: p.bg && typeof p.bg.key === 'string' ? { key: p.bg.key, w: +p.bg.w, h: +p.bg.h, text: typeof p.bg.text === 'string' ? p.bg.text : undefined } : undefined,
      content: {
        strokes: Array.isArray(p.content?.strokes) ? p.content.strokes.filter(isStroke) : [],
        texts: Array.isArray(p.content?.texts) ? p.content.texts : [],
        images: Array.isArray(p.content?.images) ? p.content.images : [],
        links: Array.isArray(p.content?.links) ? p.content.links : [],
      },
    }))
    return { id, title: d.title ?? '', pages, currentId: pages.some((p) => p.id === d.currentId) ? d.currentId : pages[0].id, outline: Array.isArray(d.outline) ? d.outline : [] }
  } catch { return null }
}


export function useNotebook(id: string, initial: NotebookData, onMeta: (m: { pages: number; title: string }) => void) {
  const [state, setState] = useState<State>(() => {
    const d = initial
    return { title: d.title, currentId: d.currentId, outline: d.outline, pages: d.pages.map((p) => ({ ...p, past: [], future: [] })) }
  })
  const [saveError, setSaveError] = useState(false)
  const latest = useRef(state)
  latest.current = state
  const metaRef = useRef(onMeta); metaRef.current = onMeta

  const flush = useCallback(() => {
    const s = latest.current
    void saveNotebookData({ id, title: s.title, currentId: s.currentId, outline: s.outline, pages: s.pages.map(({ past, future, ...p }) => p) }).then((ok) => setSaveError(!ok))
    metaRef.current({ pages: s.pages.length, title: s.title })
  }, [id])
  useEffect(() => { const t = setTimeout(flush, 300); return () => clearTimeout(t) }, [state, flush])
  useEffect(() => {
    const f = () => flush()
    window.addEventListener('pagehide', f); document.addEventListener('visibilitychange', f)
    return () => { window.removeEventListener('pagehide', f); document.removeEventListener('visibilitychange', f); flush() }
  }, [flush])

  const upd = useCallback((pid: string, fn: (p: PageState) => PageState) =>
    setState((s) => ({ ...s, pages: s.pages.map((p) => (p.id === pid ? fn(p) : p)) })), [])

  const actions = useMemo(() => ({
    commit: (pid: string, fn: (c: Content) => Content) => upd(pid, (p) => ({ ...p, content: fn(p.content), past: cap([...p.past, p.content]), future: [] })),
    live: (pid: string, fn: (c: Content) => Content) => upd(pid, (p) => ({ ...p, content: fn(p.content) })),
    checkpoint: (pid: string, base: Content) => upd(pid, (p) => ({ ...p, past: cap([...p.past, base]), future: [] })),
    undo: (pid: string) => upd(pid, (p) => (p.past.length ? { ...p, content: p.past[p.past.length - 1], past: p.past.slice(0, -1), future: [p.content, ...p.future] } : p)),
    redo: (pid: string) => upd(pid, (p) => (p.future.length ? { ...p, content: p.future[0], past: [...p.past, p.content], future: p.future.slice(1) } : p)),
    setCurrent: (pid: string) => setState((s) => (s.pages.some((p) => p.id === pid) && s.currentId !== pid ? { ...s, currentId: pid } : s)),
    setTitle: (title: string) => setState((s) => ({ ...s, title })),
    setMeta: (pid: string, m: Partial<PageMeta>) => upd(pid, (p) => {
      const next = { ...p, ...m }
      if (m.size && m.size !== p.size) {
        const a = SIZES[p.size], b = SIZES[m.size], sx = b.w / a.w, sy = b.h / a.h
        next.content = { ...p.content, strokes: p.content.strokes.map((s) => ({ ...s, points: s.points.map((q) => ({ ...q, x: q.x * sx, y: q.y * sy })) })) }
      }
      return next
    }),
    toggleBookmark: (pid: string) => upd(pid, (p) => ({ ...p, bookmarked: !p.bookmarked })),
    addPage: (where: 'before' | 'after' | 'last', meta?: Partial<PageMeta>, content?: Content, bg?: Page['bg']) => {
      const nid = newPageId()
      setState((s) => {
        const i = s.pages.findIndex((p) => p.id === s.currentId)
        const base = s.pages[i] ?? s.pages[s.pages.length - 1]
        const np: PageState = { ...blankPage({ size: meta?.size ?? base.size, template: meta?.template ?? base.template, color: meta?.color ?? base.color }), id: nid }
        if (content) np.content = content
        if (bg) np.bg = bg
        const at = where === 'before' ? Math.max(0, i) : where === 'after' ? i + 1 : s.pages.length
        return { ...s, pages: [...s.pages.slice(0, at), np, ...s.pages.slice(at)], currentId: nid }
      })
      return nid
    },
    duplicatePage: (pid: string) => setState((s) => {
      const i = s.pages.findIndex((p) => p.id === pid)
      if (i < 0) return s
      const src = s.pages[i]
      const cp: PageState = { ...src, id: newPageId(), bookmarked: false, past: [], future: [], content: JSON.parse(JSON.stringify(src.content)) }
      return { ...s, pages: [...s.pages.slice(0, i + 1), cp, ...s.pages.slice(i + 1)], currentId: cp.id }
    }),
    deletePage: (pid: string) => setState((s) => {
      if (s.pages.length <= 1) return { ...s, pages: s.pages.map((p) => (p.id === pid ? { ...p, content: emptyContent(), past: [], future: [] } : p)) }
      const i = s.pages.findIndex((p) => p.id === pid)
      const pages = s.pages.filter((p) => p.id !== pid)
      return { ...s, pages, outline: s.outline.filter((o) => o.pageId !== pid), currentId: s.currentId === pid ? pages[Math.min(i, pages.length - 1)].id : s.currentId }
    }),
    rotatePage: (pid: string, dir: 1 | -1) => upd(pid, (p) => {
      const { w: ow, h: oh } = SIZES[p.size]
      const swap: Record<string, SizeId> = { a4p: 'a4l', a4l: 'a4p', a5p: 'a5l', a5l: 'a5p', lp: 'll', ll: 'lp' }
      const rp = (x: number, y: number) => (dir === 1 ? { x: oh - y, y: x } : { x: y, y: ow - x })
      const c = p.content
      const content: Content = {
        strokes: c.strokes.map((s) => ({ ...s, points: s.points.map((q) => ({ ...q, ...rp(q.x, q.y) })) })),
        texts: c.texts.map((t) => ({ ...t, ...rp(t.x, t.y) })),
        images: c.images.map((i) => { const a = rp(i.x, i.y), b = rp(i.x + i.w, i.y + i.h); return { ...i, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: i.h, h: i.w } }),
        links: (c.links ?? []).map((i) => { const a = rp(i.x, i.y), b = rp(i.x + i.w, i.y + i.h); return { ...i, x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: i.h, h: i.w } }),
      }
      return { ...p, size: swap[p.size], content, past: cap([...p.past, p.content]), future: [] }
    }),
    addOutline: (pid: string, title: string) => setState((s) => ({ ...s, outline: [...s.outline.filter((o) => o.pageId !== pid), { id: newPageId(), pageId: pid, title }] })),
    renameOutline: (oid: string, title: string) => setState((s) => ({ ...s, outline: s.outline.map((o) => (o.id === oid ? { ...o, title } : o)) })),
    removeOutline: (oid: string) => setState((s) => ({ ...s, outline: s.outline.filter((o) => o.id !== oid) })),
    movePage: (pid: string, to: number) => setState((s) => {
      const i = s.pages.findIndex((p) => p.id === pid)
      if (i < 0 || to < 0 || to >= s.pages.length) return s
      const pages = [...s.pages]; const [m] = pages.splice(i, 1); pages.splice(to, 0, m)
      return { ...s, pages }
    }),
  }), [upd])

  const cache = useRef(new Map<string, PageStore>())
  const stores = useMemo(() => {
    const m = new Map<string, PageStore>()
    for (const p of state.pages) {
      const hit = cache.current.get(p.id)
      m.set(p.id, hit && hit.content === p.content ? hit : {
        id: p.id, content: p.content,
        commit: (fn) => actions.commit(p.id, fn), live: (fn) => actions.live(p.id, fn),
        checkpoint: (b) => actions.checkpoint(p.id, b), undo: () => actions.undo(p.id), redo: () => actions.redo(p.id),
      })
    }
    cache.current = m
    return m
  }, [state.pages, actions])

  const cur = state.pages.find((p) => p.id === state.currentId) ?? state.pages[0]
  return {
    ...actions, title: state.title, pages: state.pages as Page[], outline: state.outline, saveError,
    page: cur, index: Math.max(0, state.pages.findIndex((p) => p.id === cur.id)),
    store: (pid: string) => stores.get(pid)!,
    canUndo: (pid: string) => (state.pages.find((p) => p.id === pid)?.past.length ?? 0) > 0,
    canRedo: (pid: string) => (state.pages.find((p) => p.id === pid)?.future.length ?? 0) > 0,
    flush,
  }
}
export type Notebook = ReturnType<typeof useNotebook>
