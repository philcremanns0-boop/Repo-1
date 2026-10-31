import { pageDims } from '../lib/pageDims'
import { useEffect, useRef } from 'react'
import { paperStyle, SIZES, type PaperColor, type SizeId, type TemplateId } from '../lib/paper'
import { renderPage } from '../lib/export'
import type { Page } from '../store/types'

export function PaperThumb({ template, color, size = 'a4p', className = '', style }: { template: TemplateId; color: PaperColor; size?: SizeId; className?: string; style?: React.CSSProperties }) {
  const { w, h } = SIZES[size]
  return <div className={className} style={{ aspectRatio: `${w} / ${h}`, ...paperStyle(template, color, w, h), ...style }} />
}

/** Page thumbnail: paper + ink/objects rendered to a small canvas. */
export function PageThumb({ page, className = '' }: { page: Page; className?: string }) {
  const { w, h } = pageDims(page)
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let cancel = false
    const id = setTimeout(async () => {
      const out = await renderPage(page, 0.3)
      if (cancel || !cv.current) return
      cv.current.width = out.width; cv.current.height = out.height
      cv.current.getContext('2d')!.drawImage(out, 0, 0)
    }, 150)
    return () => { cancel = true; clearTimeout(id) }
  }, [page])
  return <canvas ref={cv} className={className} style={{ aspectRatio: `${w} / ${h}`, background: '#fff' }} />
}
