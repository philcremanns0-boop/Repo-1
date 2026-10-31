import { useEffect, useState } from 'react'
import { blobUrl } from '../lib/blobstore'

/** Rendered page of an imported PDF, drawn under ink and objects. */
export default function PdfBg({ storeKey }: { storeKey: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => { let on = true; void blobUrl(storeKey).then((u) => on && setSrc(u)); return () => { on = false } }, [storeKey])
  return src ? <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" /> : null
}
