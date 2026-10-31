import {
  ChevronLeft,
  Eraser,
  Highlighter,
  LassoSelect,
  Pen,
  Redo2,
  Shapes,
  Sticker,
  Type,
  Undo2,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react'

export type ToolId =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'shapes'
  | 'lasso'
  | 'elements'
  | 'text'
  | 'zoom'

export type PenColor = 'black' | 'blue' | 'red'
export type Thickness = 0 | 1 | 2

const TOOLS: { id: ToolId; label: string; icon: LucideIcon }[] = [
  { id: 'pen', label: 'Pen', icon: Pen },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'shapes', label: 'Shapes', icon: Shapes },
  { id: 'lasso', label: 'Lasso', icon: LassoSelect },
  { id: 'elements', label: 'Elements', icon: Sticker },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'zoom', label: 'Zoom', icon: ZoomIn },
]

export const COLORS: { id: PenColor; label: string; hex: string }[] = [
  { id: 'black', label: 'Black', hex: '#1c1c1e' },
  { id: 'blue', label: 'Blue', hex: '#1f6fe5' },
  { id: 'red', label: 'Red', hex: '#e5372e' },
]

// Visual stroke weights (px) for the three presets
const THICKNESS = [1.5, 3, 5.5]

interface Props {
  tool: ToolId
  onTool: (t: ToolId) => void
  color: PenColor
  onColor: (c: PenColor) => void
  thickness: Thickness
  onThickness: (t: Thickness) => void
  title?: string
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function Toolbar({
  tool,
  onTool,
  color,
  onColor,
  thickness,
  onThickness,
  title = 'Untitled Notebook',
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const activeHex = COLORS.find((c) => c.id === color)!.hex

  return (
    <header className="relative z-10 flex h-[52px] shrink-0 items-center border-b border-gn-line bg-gn-bar px-3 shadow-bar">
      {/* Left: navigation + title + undo/redo */}
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button className="tool-btn w-9" aria-label="Back to library">
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <span className="mr-2 hidden max-w-[180px] truncate text-[15px] font-semibold md:block">
          {title}
        </span>
        <button
          className={`tool-btn w-9 ${canUndo ? '' : 'text-gn-mute opacity-50'}`}
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={20} strokeWidth={1.75} />
        </button>
        <button
          className={`tool-btn w-9 ${canRedo ? '' : 'text-gn-mute opacity-50'}`}
          aria-label="Redo"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Center: tools */}
      <nav
        className="flex items-center gap-0.5 rounded-[12px] bg-black/[0.04] p-[3px]"
        aria-label="Tools"
      >
        {TOOLS.map(({ id, label, icon: Icon }) => {
          const active = tool === id
          return (
            <button
              key={id}
              className="tool-btn"
              data-active={active}
              aria-label={label}
              aria-pressed={active}
              title={label}
              onClick={() => onTool(id)}
            >
              <Icon size={21} strokeWidth={active ? 2 : 1.75} />
              {/* colour indicator under pen-like tools */}
              {active && (id === 'pen' || id === 'highlighter') && (
                <span
                  className="absolute bottom-[3px] h-[3px] w-4 rounded-full"
                  style={{ background: activeHex, opacity: id === 'highlighter' ? 0.55 : 1 }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Right: thickness + colours */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <div className="flex items-center gap-0.5" role="group" aria-label="Stroke thickness">
          {THICKNESS.map((w, i) => {
            const active = thickness === i
            return (
              <button
                key={i}
                aria-label={`Thickness ${i + 1}`}
                aria-pressed={active}
                onClick={() => onThickness(i as Thickness)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-gn-active' : 'hover:bg-black/5'
                }`}
              >
                <span
                  className="block w-[18px] rounded-full"
                  style={{ height: w, background: active ? activeHex : '#6b6e75' }}
                />
              </button>
            )
          })}
        </div>

        <span className="h-5 w-px bg-gn-line" />

        <div className="flex items-center gap-2" role="group" aria-label="Colours">
          {COLORS.map((c) => {
            const active = color === c.id
            return (
              <button
                key={c.id}
                aria-label={c.label}
                aria-pressed={active}
                onClick={() => onColor(c.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  boxShadow: active ? `0 0 0 2px #f7f7f8, 0 0 0 3.5px ${c.hex}` : undefined,
                }}
              >
                <span
                  className="block h-[22px] w-[22px] rounded-full"
                  style={{
                    background: c.hex,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)',
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
