import { useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import NoteCanvas from './components/NoteCanvas'
import PageSidebar from './components/PageSidebar'
import { useNotebook, type Pattern } from './store/useNotebook'
import Toolbar, { type PenColor, type Thickness, type ToolId } from './components/Toolbar'

const PAGE_W = 794 // A4 @ 96dpi
const PAGE_H = 1123

const PATTERNS: Record<Pattern, React.CSSProperties> = {
  blank: {},
  ruled: {
    backgroundImage:
      'linear-gradient(to bottom, transparent 31px, #bcd3ee 31px, #bcd3ee 32px)',
    backgroundSize: '100% 32px',
    backgroundPosition: '0 72px',
  },
  grid: {
    backgroundImage:
      'linear-gradient(to right, #d3dfee 1px, transparent 1px), linear-gradient(to bottom, #d3dfee 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
}

export default function App() {
  const [tool, setTool] = useState<ToolId>('pen')
  const [color, setColor] = useState<PenColor>('black')
  const [thickness, setThickness] = useState<Thickness>(1)
  const [zoom, setZoom] = useState(0.9)
  const store = useNotebook()
  const { page, pages, index } = store
  const pattern = page.pattern

  const clamp = (z: number) => Math.min(2, Math.max(0.4, +z.toFixed(2)))
  const handleTool = (t: ToolId) => {
    setTool(t)
    if (t === 'zoom') setZoom((z) => clamp(z >= 1.5 ? 0.75 : z + 0.25))
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        tool={tool}
        onTool={handleTool}
        color={color}
        onColor={setColor}
        thickness={thickness}
        onThickness={setThickness}
        onUndo={store.undo}
        onRedo={store.redo}
        onClear={store.clear}
        canClear={store.strokes.length > 0}
        title={`Notebook · Page ${index + 1} of ${pages.length}`}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
      />

      <div className="flex min-h-0 flex-1">
      <PageSidebar
        pages={pages}
        currentId={page.id}
        onSelect={store.selectPage}
        onAdd={store.addPage}
        onDelete={store.deletePage}
      />

      {/* Document viewer */}
      <main className="relative flex-1 overflow-auto bg-gn-canvas">
        <div className="flex min-h-full justify-center px-6 py-8">
          <div style={{ width: PAGE_W * zoom, height: PAGE_H * zoom, flexShrink: 0 }}>
            <div
              className="relative origin-top-left bg-white shadow-page"
              style={{
                width: PAGE_W,
                height: PAGE_H,
                transform: `scale(${zoom})`,
                borderRadius: 2,
                ...PATTERNS[pattern],
              }}
            >
              <NoteCanvas
                key={page.id}
                store={store}
                tool={tool}
                color={color}
                thickness={thickness}
                width={PAGE_W}
                height={PAGE_H}
                zoom={zoom}
              />
            </div>
          </div>
        </div>

        {/* Floating page-template + zoom controls */}
        <div className="pointer-events-none sticky bottom-4 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-gn-bar/95 p-1 text-[13px] shadow-page backdrop-blur">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous page"
              disabled={index === 0}
              onClick={() => store.selectPage(pages[index - 1].id)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[44px] text-center font-medium tabular-nums">
              {index + 1} / {pages.length}
            </span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next page"
              disabled={index === pages.length - 1}
              onClick={() => store.selectPage(pages[index + 1].id)}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
              aria-label="Add page"
              onClick={store.addPage}
            >
              <Plus size={15} />
            </button>
            <span className="mx-1 h-4 w-px bg-gn-line" />
            {(['blank', 'ruled', 'grid'] as Pattern[]).map((p) => (
              <button
                key={p}
                onClick={() => store.setPattern(p)}
                className={`rounded-full px-3 py-1.5 font-medium capitalize transition-colors ${
                  pattern === p ? 'bg-gn-active text-gn-accent' : 'text-gn-mute hover:bg-black/5'
                }`}
              >
                {p}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-gn-line" />
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => clamp(z - 0.1))}
            >
              <Minus size={15} />
            </button>
            <span className="w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => clamp(z + 0.1))}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}
