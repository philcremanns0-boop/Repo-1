/**
 * Key-value store on IndexedDB for notebook documents. localStorage is capped at ~5 MB in Safari, which
 * a few inserted photos would exhaust; IndexedDB allows far more (and survives with navigator.storage.persist()).
 */
const DB = 'gn-data', STORE = 'kv'
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
const run = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const d = await db()
  return new Promise<T>((res, rej) => {
    const tx = d.transaction(STORE, mode)
    const q = fn(tx.objectStore(STORE))
    tx.oncomplete = () => res(q.result)
    tx.onerror = () => rej(tx.error)
    tx.onabort = () => rej(tx.error)
  })
}
export const kvGet = (key: string) => run<string | undefined>('readonly', (s) => s.get(key))
export const kvSet = (key: string, value: string) => run('readwrite', (s) => s.put(value, key)).then(() => true).catch(() => false)
export const kvDel = (key: string) => run('readwrite', (s) => s.delete(key)).catch(() => undefined)

let migration: Promise<void> | null = null
/** Resolves once old localStorage notebooks have been moved (idempotent; awaited before any notebook read). */
export const ensureMigrated = () => (migration ??= migrateFromLocalStorage('gn:nb:'))
/** One-time move of notebooks that older builds kept in localStorage. */
async function migrateFromLocalStorage(prefix: string) {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix))
  for (const k of keys) {
    const v = localStorage.getItem(k)
    if (v != null && (await kvSet(k, v))) localStorage.removeItem(k)
  }
}
