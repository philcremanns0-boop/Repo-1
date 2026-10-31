import { useEffect, useState } from 'react'
import { getBlob } from '../lib/blobstore'
import type { TextRun } from '../lib/pdf'

/** Yellow boxes over matching PDF text runs after a search jump; fades out after a few seconds. */
export default function SearchFlash({ bgKey, needle, onDone }: { bgKey: string; needle: string; onDone: () => void }) {
  const [boxes, setBoxes] = useState<TextRun[]>([])
  useEffect(() => {
    let on = true
    void getBlob(`${bgKey}_text`).then(async (b) => {
      if (!b || !on) return
      const runs: TextRun[] = JSON.parse(await b.text())
      setBoxes(runs.filter((r) => r.s.toLowerCase().includes(needle)))
    })
    const t = setTimeout(onDone, 4000)
    return () => { on = false; clearTimeout(t) }
  }, [bgKey, needle, onDone])
  return (
    <div className="pointer-events-none absolute inset-0 animate-pulse" style={{ zIndex: 3 }}>
      {boxes.map((r, i) => <div key={i} className="absolute rounded-[2px] bg-[#ffd60a]/50" style={{ left: r.x - 2, top: r.y - 2, width: r.w + 4, height: r.h + 4 }} />)}
    </div>
  )
}
