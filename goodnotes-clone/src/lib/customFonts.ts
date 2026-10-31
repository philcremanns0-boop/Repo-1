import { delBlob, getBlob, putBlob } from './blobstore'
import { setCustomFonts } from './fonts'

/** "Schriften verwalten": user-imported font files (.ttf/.otf/.woff/.woff2), stored in IndexedDB, registered with FontFace. */
export interface CustomFont { name: string; key: string }
const KEY = 'gn:fonts'
const list = (): CustomFont[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }
const save = (l: CustomFont[]) => { localStorage.setItem(KEY, JSON.stringify(l)); setCustomFonts(l.map((f) => f.name)) }
const loaded = new Set<string>()

async function register(f: CustomFont) {
  if (loaded.has(f.key)) return
  const blob = await getBlob(f.key)
  if (!blob) return
  const face = new FontFace(f.name, await blob.arrayBuffer())
  await face.load(); document.fonts.add(face); loaded.add(f.key)
}
/** Register all stored fonts (call once at start). */
export async function loadCustomFonts() {
  const l = list(); setCustomFonts(l.map((f) => f.name))
  await Promise.all(l.map((f) => register(f).catch(() => undefined)))
  return l
}
export async function importFont(file: File): Promise<CustomFont> {
  const name = file.name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[-_]+/g, ' ').trim() || 'Schrift'
  const key = `font_${Date.now().toString(36)}`
  await putBlob(key, file)
  const f = { name, key }
  try { await register(f) } catch (e) { await delBlob(key); throw e }
  save([...list().filter((x) => x.name !== name), f])
  return f
}
export async function removeFont(name: string) {
  const f = list().find((x) => x.name === name)
  if (f) await delBlob(f.key).catch(() => undefined)
  save(list().filter((x) => x.name !== name))
}
export const listFonts = list
