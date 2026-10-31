import { pageDims } from '../lib/pageDims'
import { memo, useEffect, useRef, useState } from 'react'
import { PAPER_COLORS } from '../lib/paper'
import PaperLayer from './PaperLayer'
import PdfBg from './PdfBg'
import type { Page } from '../store/types'
import type { PageStore } from '../store/useNotebook'
import NoteCanvas from './NoteCanvas'
import { ImagesLayer, TextLayer } from './ObjectsLayer'
import SelectionLayer from './SelectionLayer'
import LinkLayer from './LinkLayer'
import { RulerOverlay, ZoomFrame } from './Widgets'
import type { EditorProps } from './editorTypes'

interface Props { page: Page; store: PageStore; ed: EditorProps; onActivate: (id: string) => void; panel?: boolean }

function PageViewImpl({ page, store, ed, onActivate, panel }: Props) {
  const { w, h } = pageDims(page)
  const host = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (panel) { setNear(true); return }
    const io = new IntersectionObserver((es) => setNear(es[0].isIntersecting), { rootMargin: '1400px' })
    io.observe(host.current!)
    return () => io.disconnect()
  }, [])
  const z = ed.zoom
  const mode = ed.tool === 'text' ? 'text' : ed.tool === 'note' ? 'note' : null
  const sel = !panel && ed.selection?.pageId === page.id ? ed.selection : null
  const zr = !panel && ed.zoomRegion?.pageId === page.id ? ed.zoomRegion : null
  const c = store.content
  return (
    <div ref={host} data-page={panel ? undefined : page.id} className={`relative shrink-0 rounded-[2px] ${panel ? '' : 'shadow-page'}`} style={{ width: w * z, height: h * z, zIndex: sel ? 2 : undefined }}
      onPointerDownCapture={() => onActivate(page.id)}>
      <div data-page-inner data-zoom={z} data-panel={panel ? '' : undefined} className="absolute left-0 top-0 origin-top-left rounded-[2px]"
        style={{ width: w, height: h, transform: `scale(${z})`, backgroundColor: PAPER_COLORS[page.color].bg }}>
        {page.bg ? <PdfBg storeKey={page.bg.key} /> : <PaperLayer template={page.template} color={page.color} width={w} height={h} />}
        {near && (
          <>
            <div className="absolute inset-0 overflow-hidden"><ImagesLayer images={c.images} /></div>
            <NoteCanvas pageId={page.id} store={store} tool={ed.canvasTool} zoom={z} width={w} height={h} ruler={ed.ruler} onSelect={ed.setSelection} onActivate={() => onActivate(page.id)} onLassoTap={(p, cl) => ed.onLassoTap(page.id, p, cl)} />
            <TextLayer texts={c.texts} store={store} mode={mode} style={ed.textStyle} pageW={w} zoom={z}
              selectedId={ed.selText?.pageId === page.id ? ed.selText.id : null} editingId={ed.editText?.pageId === page.id ? ed.editText.id : null}
              onSelect={(id) => ed.setSelText(id == null ? null : { pageId: page.id, id })} onEdit={(id) => ed.setEditText(id == null ? null : { pageId: page.id, id })} onCreated={ed.onTextCreated} />
            {!panel && <LinkLayer links={c.links ?? []} active={ed.readOnly || ed.tool === 'lasso'} store={store} onGo={ed.goPage} pageNo={ed.pageNo} />}
            {sel && <SelectionLayer store={store} selection={sel} zoom={z} colors={ed.colors} pageW={w} pageH={h} onChange={ed.setSelection} onToast={ed.toast} onLink={(box) => ed.onAddLink(page.id, box)} />}
            {zr && <ZoomFrame region={zr} zoom={z} pageW={w} pageH={h} onChange={ed.setZoomRegion} />}
            {!panel && ed.ruler?.pageId === page.id && <RulerOverlay ruler={ed.ruler} zoom={z} onChange={ed.setRuler} onClose={() => ed.setRuler(null)} />}
          </>
        )}
      </div>
    </div>
  )
}
export default memo(PageViewImpl)
