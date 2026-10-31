import { useCallback, useEffect, useRef, useState } from 'react'

export interface Recording { id: string; url: string; secs: number; at: number }
/** In-memory audio recorder (MediaRecorder). Recordings live for the session. */
export function useRecorder(onError: (msg: string) => void) {
  const [recording, setRecording] = useState(false)
  const [secs, setSecs] = useState(0)
  const [items, setItems] = useState<Recording[]>([])
  const mr = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const t0 = useRef(0)
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
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })
        const secs2 = Math.max(1, Math.round((Date.now() - t0.current) / 1000))
        setItems((l) => [{ id: `r${Date.now()}`, url: URL.createObjectURL(blob), secs: secs2, at: Date.now() }, ...l])
      }
      mr.current = rec; t0.current = Date.now(); setSecs(0); rec.start(); setRecording(true)
    } catch { onError('mic') }
  }, [onError])
  const stop = useCallback(() => { mr.current?.state === 'recording' && mr.current.stop(); setRecording(false) }, [])
  const remove = useCallback((id: string) => setItems((l) => { l.filter((r) => r.id === id).forEach((r) => URL.revokeObjectURL(r.url)); return l.filter((r) => r.id !== id) }), [])
  return { recording, secs, items, start, stop, remove }
}
