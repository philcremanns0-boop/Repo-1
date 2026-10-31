import { useCallback, useEffect, useState } from 'react'
import { kvGet, kvSet } from './kv'

/** 'Meine Objekte': lasso selections saved as PNG objects – kept in IndexedDB (they can be large). */
const KEY = 'gn:myElements'
export function useMyElements() {
  const [items, setItems] = useState<string[]>([])
  useEffect(() => { void kvGet(KEY).then((v) => setItems(v ? JSON.parse(v) : [])).catch(() => undefined) }, [])
  const add = useCallback((src: string) => setItems((l) => { const n = [src, ...l].slice(0, 100); void kvSet(KEY, JSON.stringify(n)); return n }), [])
  const remove = useCallback((src: string) => setItems((l) => { const n = l.filter((x) => x !== src); void kvSet(KEY, JSON.stringify(n)); return n }), [])
  return { items, add, remove }
}
