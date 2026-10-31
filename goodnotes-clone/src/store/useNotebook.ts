import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Stroke } from '../components/NoteCanvas'

/* ------------------------------------------------------------------ *
 * Data model
 *   Notebook ─┬─ pages[] ─┬─ strokes[]   (vector paths, persisted)
 *             │           ├─ pattern     (persisted)
 *             │           └─ past/future (undo history, in-memory only)
 *             └─ currentId
 * ------------------------------------------------------------------ */

export type Pattern = 'blank' | 'ruled' | 'grid'

export interface Page {
  id: string
  pattern: Pattern
  strokes: Stroke[]
}

export interface Notebook {
  pages: Page[]
  currentId: string
}

interface PageState extends Page {
  past: Stroke[][]
  future: Stroke[][]
}
interface State {
  pages: PageState[]
  currentId: string
}

const STORAGE_KEY = 'goodnotes-clone:notebook:v1'
const HISTORY_LIMIT = 100
const cap = (past: Stroke[][]) => (past.length > HISTORY_LIMIT ? past.slice(-HISTORY_LIMIT) : past)

let uid = 0
const newPageId = () => `p_${Date.now().toString(36)}_${(uid++).toString(36)}`
const blankPage = (pattern: Pattern = 'ruled'): PageState => ({
  id: newPageId(),
  pattern,
  strokes: [],
  past: [],
  future: [],
})

/* ----------------------------- persistence ----------------------------- */

function isStroke(s: any): s is Stroke {
  return (
    s &&
    (s.tool === 'pen' || s.tool === 'highlighter') &&
    typeof s.color === 'string' &&
    typeof s.width === 'number' &&
    typeof s.id === 'number' &&
    Array.isArray(s.points) &&
    s.points.every((p: any) => p && isFinite(p.x) && isFinite(p.y) && isFinite(p.w))
  )
}

function load(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || data.version !== 1 || !Array.isArray(data.pages) || !data.pages.length) return null
    const pages: PageState[] = data.pages.map((p: any) => ({
      id: typeof p.id === 'string' ? p.id : newPageId(),
      pattern: ['blank', 'ruled', 'grid'].includes(p.pattern) ? p.pattern : 'ruled',
      strokes: Array.isArray(p.strokes) ? p.strokes.filter(isStroke) : [],
      past: [],
      future: [],
    }))
    const currentId = pages.some((p) => p.id === data.currentId) ? data.currentId : pages[0].id
    return { pages, currentId }
  } catch {
    return null
  }
}

function save(s: State) {
  try {
    const out: Notebook & { version: 1 } = {
      version: 1,
      currentId: s.currentId,
      pages: s.pages.map(({ id, pattern, strokes }) => ({ id, pattern, strokes })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out))
  } catch {
    /* storage full / unavailable — drawing keeps working in memory */
  }
}

/* -------------------------------- hook -------------------------------- */

export function useNotebook() {
  const [state, setState] = useState<State>(() => {
    const loaded = load()
    if (loaded) return loaded
    const p = blankPage()
    return { pages: [p], currentId: p.id }
  })

  // Debounced save + flush when the tab is hidden / closed.
  const latest = useRef(state)
  latest.current = state
  useEffect(() => {
    const t = setTimeout(() => save(state), 250)
    return () => clearTimeout(t)
  }, [state])
  useEffect(() => {
    const flush = () => save(latest.current)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])

  /** Apply `fn` to the current page. */
  const onCurrent = useCallback((fn: (p: PageState) => PageState) => {
    setState((s) => ({ ...s, pages: s.pages.map((p) => (p.id === s.currentId ? fn(p) : p)) }))
  }, [])

  const actions = useMemo(
    () => ({
      add: (stroke: Stroke) =>
        onCurrent((p) => ({
          ...p,
          strokes: [...p.strokes, stroke],
          past: cap([...p.past, p.strokes]),
          future: [],
        })),
      preview: (next: Stroke[]) => onCurrent((p) => ({ ...p, strokes: next })),
      checkpoint: (base: Stroke[]) =>
        onCurrent((p) => ({ ...p, past: cap([...p.past, base]), future: [] })),
      undo: () =>
        onCurrent((p) =>
          p.past.length
            ? {
                ...p,
                strokes: p.past[p.past.length - 1],
                past: p.past.slice(0, -1),
                future: [p.strokes, ...p.future],
              }
            : p,
        ),
      redo: () =>
        onCurrent((p) =>
          p.future.length
            ? { ...p, strokes: p.future[0], past: [...p.past, p.strokes], future: p.future.slice(1) }
            : p,
        ),
      clear: () =>
        onCurrent((p) =>
          p.strokes.length ? { ...p, strokes: [], past: cap([...p.past, p.strokes]), future: [] } : p,
        ),
      restyle: (ids: number[], patch: Partial<Pick<Stroke, 'color' | 'width'>>) =>
        onCurrent((p) => ({
          ...p,
          strokes: p.strokes.map((s) => (ids.includes(s.id) ? { ...s, ...patch } : s)),
          past: cap([...p.past, p.strokes]),
          future: [],
        })),
      setPattern: (pattern: Pattern) => onCurrent((p) => ({ ...p, pattern })),

      selectPage: (id: string) =>
        setState((s) => (s.pages.some((p) => p.id === id) ? { ...s, currentId: id } : s)),
      /** Insert a new page after the current one and switch to it. */
      addPage: () =>
        setState((s) => {
          const i = s.pages.findIndex((p) => p.id === s.currentId)
          const np = blankPage(s.pages[i]?.pattern)
          const pages = [...s.pages.slice(0, i + 1), np, ...s.pages.slice(i + 1)]
          return { pages, currentId: np.id }
        }),
      /** Delete a page; the last remaining page can't be deleted. */
      deletePage: (id: string) =>
        setState((s) => {
          if (s.pages.length <= 1) return s
          const i = s.pages.findIndex((p) => p.id === id)
          if (i < 0) return s
          const pages = s.pages.filter((p) => p.id !== id)
          const currentId =
            s.currentId === id ? pages[Math.min(i, pages.length - 1)].id : s.currentId
          return { pages, currentId }
        }),
    }),
    [onCurrent],
  )

  const index = Math.max(0, state.pages.findIndex((p) => p.id === state.currentId))
  const page = state.pages[index]

  return {
    ...actions,
    pages: state.pages as Page[],
    page,
    index,
    strokes: page.strokes,
    canUndo: page.past.length > 0,
    canRedo: page.future.length > 0,
  }
}
