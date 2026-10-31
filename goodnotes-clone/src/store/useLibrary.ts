import { useCallback, useState } from 'react'
import { COVERS, type CoverId } from '../lib/covers'
import { createNotebookData, nbKey, saveNotebookData } from './useNotebook'
import type { NbMeta, NewNotebookOpts } from './types'

export type View = 'home' | 'shared' | 'trash' | 'cloud' | string // string = notebook id
interface Lib { notebooks: NbMeta[]; tabs: string[]; view: View }
const KEY = 'gn:library'
function load(): Lib {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && Array.isArray(v.notebooks)) return { notebooks: v.notebooks, tabs: v.tabs ?? [], view: v.view ?? 'home' }
  } catch { /* ignore */ }
  return { notebooks: [], tabs: [], view: 'home' }
}
const persist = (l: Lib) => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* ignore */ } }

export function useLibrary() {
  const [lib, setLib] = useState<Lib>(() => { const l = load(); return l.view !== 'home' && !l.notebooks.some((n) => n.id === l.view) && !['shared', 'trash', 'cloud'].includes(l.view) ? { ...l, view: 'home' } : l })
  const set = useCallback((fn: (l: Lib) => Lib) => setLib((l) => { const n = fn(l); persist(n); return n }), [])

  const create = useCallback((o: NewNotebookOpts) => {
    const id = `nb_${Date.now().toString(36)}`
    saveNotebookData(createNotebookData(id, o.title, o))
    const meta: NbMeta = { id, title: o.title, cover: o.cover, coverColor: o.coverColor, created: Date.now(), updated: Date.now(), pages: 1 }
    set((l) => ({ ...l, notebooks: [meta, ...l.notebooks], tabs: [...l.tabs, id], view: id }))
    return id
  }, [set])
  const open = useCallback((id: string) => set((l) => ({ ...l, tabs: l.tabs.includes(id) ? l.tabs : [...l.tabs, id], view: id })), [set])
  const close = useCallback((id: string) => set((l) => {
    const tabs = l.tabs.filter((t) => t !== id)
    return { ...l, tabs, view: l.view === id ? 'home' : l.view }
  }), [set])
  const go = useCallback((view: View) => set((l) => ({ ...l, view })), [set])
  const patch = useCallback((id: string, p: Partial<NbMeta>) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, ...p } : n)) })), [set])
  const trash = useCallback((id: string) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, deleted: Date.now() } : n)), tabs: l.tabs.filter((t) => t !== id), view: l.view === id ? 'home' : l.view })), [set])
  const restore = useCallback((id: string) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, deleted: undefined } : n)) })), [set])
  const purge = useCallback((id: string) => { try { localStorage.removeItem(nbKey(id)) } catch { /* ignore */ } set((l) => ({ ...l, notebooks: l.notebooks.filter((n) => n.id !== id) })) }, [set])

  const backup = useCallback(() => {
    const data: Record<string, string | null> = {}
    lib.notebooks.forEach((n) => { data[n.id] = localStorage.getItem(nbKey(n.id)) })
    return JSON.stringify({ app: 'goodnotes-clone', v: 1, notebooks: lib.notebooks, data })
  }, [lib.notebooks])
  const restoreBackup = useCallback((json: string) => {
    const b = JSON.parse(json)
    if (b?.app !== 'goodnotes-clone' || !Array.isArray(b.notebooks)) throw new Error('bad backup')
    for (const n of b.notebooks as NbMeta[]) if (b.data?.[n.id]) localStorage.setItem(nbKey(n.id), b.data[n.id])
    set((l) => ({ ...l, notebooks: [...(b.notebooks as NbMeta[]).filter((n) => !l.notebooks.some((m) => m.id === n.id)), ...l.notebooks] }))
  }, [set])
  return { ...lib, create, open, close, go, patch, trash, restore, purge, backup, restoreBackup, defaultCover: COVERS[0].id as CoverId }
}
export type Library = ReturnType<typeof useLibrary>
