import { drawStroke, type Content, type TextObj } from './draw'
import { fontStack } from './fonts'
import { PAPER_COLORS, SIZES, paperUri } from './paper'
import type { Page } from '../store/types'

const cache = new Map<string, Promise<HTMLImageElement>>()
export function loadImg(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src)
  if (!p) {
    p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
    cache.set(src, p)
  }
  return p
}

function drawText(ctx: CanvasRenderingContext2D, t: TextObj) {
  ctx.save()
  const pad = t.note ? 12 : 4
  ctx.font = `${t.italic ? 'italic ' : ''}${t.bold ? 'bold ' : ''}${t.size}px ${fontStack(t.font)}`
  ctx.textBaseline = 'top'; ctx.fillStyle = t.color; ctx.textAlign = t.align
  const maxW = t.w - pad * 2
  const lines: string[] = []
  for (const para of t.text.split('\n')) {
    let line = ''
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word
      if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = word } else line = test
    }
    lines.push(line)
  }
  const lh = t.size * t.lh * 1.2
  if (t.note) {
    ctx.fillStyle = '#fff3a6'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8
    ctx.fillRect(t.x, t.y, t.w, lines.length * lh + pad * 2); ctx.shadowBlur = 0; ctx.fillStyle = t.color
  }
  const x = t.align === 'left' ? t.x + pad : t.align === 'center' ? t.x + t.w / 2 : t.x + t.w - pad
  lines.forEach((l, i) => ctx.fillText(l, x, t.y + pad + i * lh))
  ctx.restore()
}

export async function drawContent(ctx: CanvasRenderingContext2D, c: Content) {
  for (const im of c.images) { try { ctx.drawImage(await loadImg(im.src), im.x, im.y, im.w, im.h) } catch { /* skip broken image */ } }
  c.strokes.forEach((s) => drawStroke(ctx, s))
  c.texts.forEach((t) => drawText(ctx, t))
}

export async function renderPage(page: Page, scale: number, withPaper = true): Promise<HTMLCanvasElement> {
  const { w, h } = SIZES[page.size]
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.round(w * scale)); cv.height = Math.max(1, Math.round(h * scale))
  const ctx = cv.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = PAPER_COLORS[page.color].bg; ctx.fillRect(0, 0, w, h)
  if (withPaper && page.template !== 'blank') { try { ctx.drawImage(await loadImg(paperUri(page.template, page.color, w, h)), 0, 0, w, h) } catch { /* ignore */ } }
  await drawContent(ctx, page.content)
  return cv
}

export function download(name: string, data: Blob | string, type = 'application/octet-stream') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/** Minimal PDF writer: one JPEG per page. */
export async function buildPdf(pages: Page[]): Promise<Blob> {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let size = 0
  const push = (b: Uint8Array | string) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); size += u.length }
  const obj = (n: number, body: string | (() => void)) => { offsets[n] = size; push(`${n} 0 obj\n`); typeof body === 'string' ? push(body) : body(); push('\nendobj\n') }
  push('%PDF-1.4\n')
  const n = pages.length
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${n} >>`)
  for (let i = 0; i < n; i++) {
    const { w, h } = SIZES[pages[i].size]
    const cv = await renderPage(pages[i], 1.5)
    const jpg = Uint8Array.from(atob(cv.toDataURL('image/jpeg', 0.9).split(',')[1]), (c) => c.charCodeAt(0))
    const pw = (w * 0.75).toFixed(2), ph = (h * 0.75).toFixed(2)
    const base = 3 + i * 3
    obj(base, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Contents ${base + 1} 0 R /Resources << /XObject << /Im ${base + 2} 0 R >> >> >>`)
    const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im Do Q`
    obj(base + 1, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    obj(base + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`)
      push(jpg); push('\nendstream')
    })
  }
  const xref = size
  const total = 3 + n * 3
  push(`xref\n0 ${total}\n0000000000 65535 f \n`)
  for (let i = 1; i < total; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
}

export async function printPages(pages: Page[]) {
  const urls = await Promise.all(pages.map(async (p) => (await renderPage(p, 1.2)).toDataURL('image/jpeg', 0.9)))
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(`<html><head><title>Print</title><style>@page{margin:0}body{margin:0}img{display:block;width:100%;page-break-after:always}</style></head><body>${urls.map((u) => `<img src="${u}">`).join('')}</body></html>`)
  w.document.close(); w.onload = () => { w.focus(); w.print() }
  return true
}

/** File → downscaled data URL (keeps localStorage small). */
export function readImage(file: Blob, max = 1600): Promise<{ src: string; w: number; h: number }> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onerror = () => rej(fr.error)
    fr.onload = () => {
      const im = new Image()
      im.onerror = rej
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight))
        const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k)
        cv.getContext('2d')!.drawImage(im, 0, 0, cv.width, cv.height)
        res({ src: file.type === 'image/png' ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.85), w: im.naturalWidth, h: im.naturalHeight })
      }
      im.src = String(fr.result)
    }
    fr.readAsDataURL(file)
  })
}
