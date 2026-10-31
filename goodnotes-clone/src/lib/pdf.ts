import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { putBlob } from './blobstore'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfPage { key: string; w: number; h: number; text: string }
/** Positioned text runs of a PDF page (page units) – stored in IndexedDB under `${key}_text` for hit highlighting. */
export interface TextRun { s: string; x: number; y: number; w: number; h: number }
/** Rasterises every page of a PDF (2× for sharp zoom) into IndexedDB. Sizes are returned in 96-dpi page units. */
export async function importPdf(file: Blob, onProgress?: (done: number, total: number) => void): Promise<PdfPage[]> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const out: PdfPage[] = []
  const base = `pdf_${Date.now().toString(36)}`
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const vp1 = page.getViewport({ scale: 96 / 72 })
    const vp = page.getViewport({ scale: (96 / 72) * 2 })
    const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height)
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height)
    await page.render({ canvasContext: ctx, viewport: vp }).promise
    const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), 'image/jpeg', 0.9))
    const key = `${base}_${i}`
    await putBlob(key, blob)
    const tc = await page.getTextContent()
    const runs: TextRun[] = []
    for (const it of tc.items as { str: string; transform: number[]; width: number; height: number }[]) {
      if (!it.str?.trim()) continue
      const [x, y] = vp1.convertToViewportPoint(it.transform[4], it.transform[5])
      const h = Math.hypot(it.transform[2], it.transform[3]) * vp1.scale
      runs.push({ s: it.str, x, y: y - h, w: it.width * vp1.scale, h })
    }
    await putBlob(`${key}_text`, new Blob([JSON.stringify(runs)], { type: 'application/json' }))
    out.push({ key, w: Math.round(vp1.width), h: Math.round(vp1.height), text: runs.map((r) => r.s).join(' ') })
    onProgress?.(i, doc.numPages)
  }
  await doc.destroy()
  return out
}
