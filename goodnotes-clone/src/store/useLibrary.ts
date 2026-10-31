import { useCallback, useState } from 'react'
import { COVERS, type CoverId } from '../lib/covers'
import { createNotebookData, nbKey, saveNotebookData } from './useNotebook'
import { ensureMigrated, kvDel, kvGet, kvSet } from '../lib/kv'
import type { Folder, NbMeta, NewNotebookOpts, PageBg } from './types'

export type View = 'home' | 'favorites' | 'shared' | 'trash' | 'cloud' | string // string = notebook id
export type Layout = 'grid' | 'list'
export type SortBy = 'date' | 'name' | 'created'
interface Lib { notebooks: NbMeta[]; folders: Folder[]; tabs: string[]; view: View; folder: string | null; layout: Layout; sort: SortBy }
const KEY = 'gn:library'
function load(): Lib {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && Array.isArray(v.notebooks)) {
      const folders: Folder[] = Array.isArray(v.folders) ? v.folders : []
      return { notebooks: v.notebooks, folders, tabs: v.tabs ?? [], view: v.view ?? 'home', folder: folders.some((f) => f.id === v.folder) ? v.folder : null, layout: v.layout === 'list' ? 'list' : 'grid', sort: ['date', 'name', 'created'].includes(v.sort) ? v.sort : 'date' }
    }
  } catch { /* ignore */ }
  return { notebooks: [], folders: [], tabs: [], view: 'home', folder: null, layout: 'grid', sort: 'date' }
}
const persist = (l: Lib) => { try { localStorage.setItem(KEY, JSON.stringify(l)) } catch { /* ignore */ } }

export function useLibrary() {
  const [lib, setLib] = useState<Lib>(() => { const l = load(); return l.view !== 'home' && !l.notebooks.some((n) => n.id === l.view) && !['favorites', 'shared', 'trash', 'cloud'].includes(l.view) ? { ...l, view: 'home' } : l })
  const set = useCallback((fn: (l: Lib) => Lib) => setLib((l) => { const n = fn(l); persist(n); return n }), [])

  const create = useCallback((o: NewNotebookOpts, bgs?: PageBg[]) => {
    const id = `nb_${Date.now().toString(36)}`
    void saveNotebookData(createNotebookData(id, o.title, o, bgs))
    set((l) => {
      const meta: NbMeta = { id, title: o.title, cover: o.cover, coverColor: o.coverColor, created: Date.now(), updated: Date.now(), pages: bgs?.length || 1, folder: o.folder ?? l.folder }
      return { ...l, notebooks: [meta, ...l.notebooks], tabs: [...l.tabs, id], view: id }
    })
    return id
  }, [set])
  const open = useCallback((id: string) => set((l) => ({ ...l, tabs: l.tabs.includes(id) ? l.tabs : [...l.tabs, id], view: id })), [set])
  const close = useCallback((id: string) => set((l) => ({ ...l, tabs: l.tabs.filter((t) => t !== id), view: l.view === id ? 'home' : l.view })), [set])
  const go = useCallback((view: View) => set((l) => ({ ...l, view })), [set])
  const patch = useCallback((id: string, p: Partial<NbMeta>) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, ...p } : n)) })), [set])
  const trash = useCallback((id: string) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, deleted: Date.now() } : n)), tabs: l.tabs.filter((t) => t !== id), view: l.view === id ? 'home' : l.view })), [set])
  const restore = useCallback((id: string) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, deleted: undefined, folder: l.folders.some((f) => f.id === n.folder) ? n.folder : null } : n)) })), [set])
  const purge = useCallback((id: string) => { void kvDel(nbKey(id)); set((l) => ({ ...l, notebooks: l.notebooks.filter((n) => n.id !== id) })) }, [set])

  /* ---- folders ---- */
  const createFolder = useCallback((f: Pick<Folder, 'name' | 'color' | 'icon'>) => set((l) => ({ ...l, folders: [...l.folders, { id: `fd_${Date.now().toString(36)}`, parent: l.folder, created: Date.now(), ...f }] })), [set])
  const patchFolder = useCallback((id: string, p: Partial<Folder>) => set((l) => ({ ...l, folders: l.folders.map((f) => (f.id === id ? { ...f, ...p } : f)) })), [set])
  /** Deleting a folder keeps its content: notebooks and subfolders move up one level. */
  const deleteFolder = useCallback((id: string) => set((l) => {
    const parent = l.folders.find((f) => f.id === id)?.parent ?? null
    return {
      ...l, folders: l.folders.filter((f) => f.id !== id).map((f) => (f.parent === id ? { ...f, parent } : f)),
      notebooks: l.notebooks.map((n) => (n.folder === id ? { ...n, folder: parent } : n)), folder: l.folder === id ? parent : l.folder,
    }
  }), [set])
  const moveNotebook = useCallback((id: string, folder: string | null) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, folder } : n)) })), [set])
  const enterFolder = useCallback((folder: string | null) => set((l) => ({ ...l, folder, view: 'home' })), [set])
  const toggleStar = useCallback((id: string) => set((l) => ({ ...l, notebooks: l.notebooks.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n)) })), [set])
  const setSort = useCallback((sort: SortBy) => set((l) => ({ ...l, sort })), [set])
  /** Duplicate a notebook (pages, ink, outline); imported PDF backgrounds are shared read-only blobs. */
  const duplicate = useCallback(async (id: string, copyLabel: string) => {
    await ensureMigrated()
    const raw = await kvGet(nbKey(id))
    if (!raw) return
    const nid = `nb_${Date.now().toString(36)}`
    const d = JSON.parse(raw); d.id = nid; d.title = `${d.title || ''} ${copyLabel}`.trim()
    if (!(await kvSet(nbKey(nid), JSON.stringify(d)))) return
    set((l) => {
      const src = l.notebooks.find((n) => n.id === id)!
      return { ...l, notebooks: [{ ...src, id: nid, title: d.title, created: Date.now(), updated: Date.now(), starred: false }, ...l.notebooks] }
    })
  }, [set])
  const setLayout = useCallback((layout: Layout) => set((l) => ({ ...l, layout })), [set])

  const backup = useCallback(async () => {
    await ensureMigrated()
    const data: Record<string, string | null> = {}
    for (const n of lib.notebooks) data[n.id] = (await kvGet(nbKey(n.id))) ?? null
    return JSON.stringify({ app: 'goodnotes-clone', v: 2, notebooks: lib.notebooks, folders: lib.folders, data })
  }, [lib.notebooks, lib.folders])
  /** Single notebook as a backup file (re-importable through 'Backup wiederherstellen' / Import). */
  const backupOne = useCallback(async (id: string) => {
    const n = lib.notebooks.find((x) => x.id === id)
    return JSON.stringify({ app: 'goodnotes-clone', v: 2, notebooks: n ? [{ ...n, folder: null }] : [], folders: [], data: { [id]: (await kvGet(nbKey(id))) ?? null } })
  }, [lib.notebooks])
  const restoreBackup = useCallback(async (json: string) => {
    const b = JSON.parse(json)
    if (b?.app !== 'goodnotes-clone' || !Array.isArray(b.notebooks)) throw new Error('bad backup')
    for (const n of b.notebooks as NbMeta[]) if (b.data?.[n.id]) await kvSet(nbKey(n.id), b.data[n.id])
    set((l) => ({
      ...l,
      notebooks: [...(b.notebooks as NbMeta[]).filter((n) => !l.notebooks.some((m) => m.id === n.id)), ...l.notebooks],
      folders: [...(Array.isArray(b.folders) ? (b.folders as Folder[]).filter((f) => !l.folders.some((m) => m.id === f.id)) : []), ...l.folders],
    }))
  }, [set])
  return { ...lib, create, open, close, go, patch, trash, restore, purge, createFolder, patchFolder, toggleStar, deleteFolder, moveNotebook, enterFolder, setLayout, setSort, duplicate, backup, backupOne, restoreBackup, defaultCover: COVERS[0].id as CoverId }
}
export type Library = ReturnType<typeof useLibrary>
