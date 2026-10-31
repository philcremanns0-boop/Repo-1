/** IndexedDB blob store for large page backgrounds (imported PDF pages) – keeps localStorage small. */
const DB = 'gn-blobs', STORE = 'blobs'
let dbp: Promise<IDBDatabase> | null = null
function db() {
  dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  return dbp
}
const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const d = await db()
  return new Promise<T>((res, rej) => { const q = fn(d.transaction(STORE, mode).objectStore(STORE)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
}
export const putBlob = (key: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, key))
export const getBlob = (key: string) => tx<Blob | undefined>('readonly', (s) => s.get(key))
export const delBlob = (key: string) => tx('readwrite', (s) => s.delete(key))

const urls = new Map<string, Promise<string | null>>()
/** Cached object URL for a stored blob (null when missing). */
export function blobUrl(key: string) {
  let p = urls.get(key)
  if (!p) { p = getBlob(key).then((b) => (b ? URL.createObjectURL(b) : null)).catch(() => null); urls.set(key, p) }
  return p
}
