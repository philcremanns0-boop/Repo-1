import { memo, useEffect, useRef, useState } from 'react'
import { PAPER_COLORS, SIZES } from '../lib/paper'
import PaperLayer from './PaperLayer'
import type { Page } from '../store/types'
import type { PageStore } from '../store/useNotebook'
import NoteCanvas from './NoteCanvas'
import { ImagesLayer, TextLayer } from './ObjectsLayer'
import SelectionLayer from './SelectionLayer'
import { RulerOverlay } from './Widgets'
import type { EditorProps } from './editorTypes'

interface Props { page: Page; store: PageStore; ed: EditorProps; onActivate: (id: string) => void }

function PageViewImpl({ page, store, ed, onActivate }: Props) {
  const { w, h } = SIZES[page.size]
  const host = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver((es) => setNear(es[0].isIntersecting), { rootMargin: '1400px' })
    io.observe(host.current!)
    return () => io.disconnect()
  }, [])
  const z = ed.zoom
  const mode = ed.tool === 'text' ? 'text' : ed.tool === 'note' ? 'note' : null
  const sel = ed.selection?.pageId === page.id ? ed.selection : null
  const c = store.content
  return (
    <div ref={host} data-page={page.id} className="relative shrink-0 rounded-[2px] shadow-page" style={{ width: w * z, height: h * z }}
      onPointerDownCapture={() => onActivate(page.id)}>
      <div data-page-inner data-zoom={z} className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[2px]"
        style={{ width: w, height: h, transform: `scale(${z})`, backgroundColor: PAPER_COLORS[page.color].bg }}>
        <PaperLayer template={page.template} color={page.color} width={w} height={h} />
        {near && (
          <>
            <ImagesLayer images={c.images} />
            <NoteCanvas pageId={page.id} store={store} tool={ed.canvasTool} zoom={z} width={w} height={h} ruler={ed.ruler} onSelect={ed.setSelection} onActivate={() => onActivate(page.id)} />
            <TextLayer texts={c.texts} store={store} mode={mode} style={ed.textStyle} pageW={w} zoom={z}
              selectedId={ed.selText?.pageId === page.id ? ed.selText.id : null} editingId={ed.editText?.pageId === page.id ? ed.editText.id : null}
              onSelect={(id) => ed.setSelText(id == null ? null : { pageId: page.id, id })} onEdit={(id) => ed.setEditText(id == null ? null : { pageId: page.id, id })} onCreated={ed.onTextCreated} />
            {sel && <SelectionLayer store={store} selection={sel} zoom={z} colors={ed.colors} onChange={ed.setSelection} />}
            {ed.ruler?.pageId === page.id && <RulerOverlay ruler={ed.ruler} zoom={z} onChange={ed.setRuler} onClose={() => ed.setRuler(null)} />}
          </>
        )}
      </div>
    </div>
  )
}
export default memo(PageViewImpl)
