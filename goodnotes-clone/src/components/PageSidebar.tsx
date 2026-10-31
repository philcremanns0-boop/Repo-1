import { memo } from 'react'
import { Plus, X } from 'lucide-react'
import type { Page } from '../store/useNotebook'
import type { Stroke } from './NoteCanvas'

const PAGE_W = 794
const PAGE_H = 1123

const Thumb = memo(function Thumb({ strokes }: { strokes: Stroke[] }) {
  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className="block h-full w-full" aria-hidden>
      {strokes.map((s) => (
        <polyline
          key={s.id}
          points={s.points.map((p) => `${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeOpacity={s.tool === 'highlighter' ? 0.35 : 1}
          strokeWidth={Math.max(s.width, s.tool === 'highlighter' ? s.width : 7)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
})

interface Props {
  pages: Page[]
  currentId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

export default function PageSidebar({ pages, currentId, onSelect, onAdd, onDelete }: Props) {
  const confirmDelete = (p: Page, i: number) => {
    if (p.strokes.length && !window.confirm(`Delete page ${i + 1}? This can't be undone.`)) return
    onDelete(p.id)
  }

  return (
    <aside className="hidden w-[140px] shrink-0 flex-col border-r border-gn-line bg-gn-bar md:flex">
      <div className="flex h-11 items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gn-mute">
          Pages · {pages.length}
        </span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-full text-gn-ink hover:bg-black/5"
          aria-label="Add page"
          title="Add page"
          onClick={onAdd}
        >
          <Plus size={17} strokeWidth={2} />
        </button>
      </div>

      <ol className="flex flex-1 flex-col items-center gap-4 overflow-y-auto px-3 pb-4 pt-1">
        {pages.map((p, i) => {
          const active = p.id === currentId
          return (
            <li key={p.id} className="group relative">
              <button
                onClick={() => onSelect(p.id)}
                aria-label={`Page ${i + 1}`}
                aria-current={active}
                className={`block w-[92px] overflow-hidden rounded-[3px] bg-white transition-shadow ${
                  active
                    ? 'shadow-[0_0_0_2px_#2f6df6]'
                    : 'shadow-[0_0_0_1px_rgba(0,0,0,.12)] hover:shadow-[0_0_0_1px_rgba(0,0,0,.3)]'
                }`}
                style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
              >
                <Thumb strokes={p.strokes} />
              </button>
              <div
                className={`mt-1.5 text-center text-[12px] font-medium tabular-nums ${
                  active ? 'text-gn-accent' : 'text-gn-mute'
                }`}
              >
                {i + 1}
              </div>
              {pages.length > 1 && (
                <button
                  aria-label={`Delete page ${i + 1}`}
                  title="Delete page"
                  onClick={() => confirmDelete(p, i)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gn-ink text-white opacity-0 shadow transition-opacity focus:opacity-100 group-hover:opacity-100"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
