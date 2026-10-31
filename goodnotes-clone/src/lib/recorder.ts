import { useCallback, useEffect, useRef, useState } from 'react'
import { blobUrl, delBlob, putBlob } from './blobstore'

export interface Recording { id: string; url: string; secs: number; at: number }
interface Stored { id: string; secs: number; at: number }
const metaKey = (nb: string) => `gn:rec:${nb}`

/** Audio recorder ("Aufnehmen") – recordings are kept per notebook (audio in IndexedDB, list in localStorage). */
export function useRecorder(notebookId: string, onError: (msg: string) => void) {
  const [recording, setRecording] = useState(false)
  const [secs, setSecs] = useState(0)
  const [items, setItems] = useState<Recording[]>([])
  const mr = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const t0 = useRef(0)
  const saveMeta = (l: Recording[]) => { try { localStorage.setItem(metaKey(notebookId), JSON.stringify(l.map(({ id, secs, at }) => ({ id, secs, at })))) } catch { /* ignore */ } }

  useEffect(() => {
    let on = true
    const list: Stored[] = (() => { try { return JSON.parse(localStorage.getItem(metaKey(notebookId)) || '[]') } catch { return [] } })()
    void Promise.all(list.map(async (r) => ({ ...r, url: (await blobUrl(`rec_${r.id}`)) ?? '' }))).then((l) => on && setItems(l.filter((r) => r.url)))
    return () => { on = false }
  }, [notebookId])
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSecs(Math.round((Date.now() - t0.current) / 1000)), 500)
    return () => clearInterval(id)
  }, [recording])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunks.current = []
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/mp4' })
        const id = `r${Date.now().toString(36)}`
        const s = Math.max(1, Math.round((Date.now() - t0.current) / 1000))
        try { await putBlob(`rec_${id}`, blob) } catch { /* storage full – keep for session */ }
        const item = { id, url: URL.createObjectURL(blob), secs: s, at: Date.now() }
        setItems((l) => { const n = [item, ...l]; saveMeta(n); return n })
      }
      mr.current = rec; t0.current = Date.now(); setSecs(0); rec.start(); setRecording(true)
    } catch { onError('mic') }
  }, [onError]) // eslint-disable-line react-hooks/exhaustive-deps
  const stop = useCallback(() => { if (mr.current?.state === 'recording') mr.current.stop(); setRecording(false) }, [])
  const remove = useCallback((id: string) => {
    void delBlob(`rec_${id}`).catch(() => undefined)
    setItems((l) => { const n = l.filter((r) => r.id !== id); saveMeta(n); return n })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (mr.current?.state === 'recording') mr.current.stop() }, [])
  return { recording, secs, items, start, stop, remove }
}
