import type { ReactNode } from 'react'

interface P { size?: number; active?: boolean; className?: string }
const ACC = 'var(--gn-teal-1)'
const Svg = ({ size = 22, className, children }: { size?: number; className?: string; children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
)
const f = (a?: boolean) => (a ? ACC : 'none')

/** Fountain pen: tilted barrel, split nib with breather hole, writing squiggle (GN6 toolbar glyph). */
export const PenI = ({ active, ...p }: P) => (
  <Svg {...p}>
    <path d="M6.3 15.3L15.9 5.7a2.1 2.1 0 013 0l.2.2a2.1 2.1 0 010 3l-9.6 9.6-4.8 1.4z" fill={f(active)} />
    <path d="M13.7 7.9l3.1 3.1M4.7 20l3.1-3.1" />
    <circle cx="8.3" cy="16.4" r=".7" fill="currentColor" stroke="none" />
    <path d="M12.6 20.7c1.4-.1 1.9-1.3 3-1.3s1.5 1.2 2.9 1.2" />
  </Svg>
)
export const FountainI = (p: P) => (
  <Svg {...p}>
    <path d="M7 14.6L16 5.6a2 2 0 012.8 0l.1.1a2 2 0 010 2.8L9.9 17.5l-4.9 1.5z" fill={f(p.active)} />
    <path d="M14 7.6l2.9 2.9M5 19l3-3" /><circle cx="8.9" cy="15.9" r=".7" fill="currentColor" stroke="none" />
  </Svg>
)
export const BallpointI = (p: P) => (
  <Svg {...p}>
    <path d="M7.2 15.6l9.3-9.3a1.9 1.9 0 012.7 2.7l-9.3 9.3z" fill={f(p.active)} />
    <path d="M7.2 15.6l-1.6 1.6-.8 2.4 2.4-.8 1.6-1.6M14.6 8.2l2.7 2.7" />
  </Svg>
)
export const BrushI = (p: P) => (
  <Svg {...p}>
    <path d="M14.2 10.4l5.3-5.3a1.4 1.4 0 012 2l-5.3 5.3" />
    <path d="M12.6 9.6l3.3 3.3-1.6 1.6-3.3-3.3z" fill={f(p.active)} />
    <path d="M11 11.6c-2.5-.5-4.5.9-4.9 3.3-.3 1.6-1.2 2.6-2.6 3.1 3.6 1.1 7.3.4 8.5-2.3.5-1.1.4-2.4-1-4.1z" fill={f(p.active)} />
  </Svg>
)
export const UndoI = (p: P) => (<Svg {...p}><path d="M9.4 6.8L5.2 11l4.2 4.2" /><path d="M5.6 11h9a4.6 4.6 0 010 9.2h-2.4" /></Svg>)
export const RedoI = (p: P) => (<Svg {...p}><path d="M14.6 6.8l4.2 4.2-4.2 4.2" /><path d="M18.4 11h-9a4.6 4.6 0 000 9.2h2.4" /></Svg>)
/** Segmented eraser: tilted block, ferrule line splitting the rubber tip, baseline. */
export const EraserI = (p: P) => (
  <Svg {...p}>
    <g transform="rotate(-45 12 11)">
      <rect x="3.6" y="6.8" width="16.8" height="8.6" rx="2.2" />
      <rect x="3.6" y="6.8" width="6" height="8.6" rx="2.2" fill={f(p.active)} stroke="none" />
      <path d="M9.6 6.8v8.6" />
    </g>
    <path d="M9.4 20.4h10.2" />
  </Svg>
)
export const TextI = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="4.5" width="15" height="15" rx="1.2" fill={f(p.active)} />
    <path d="M8.5 9.2V8h7v1.2M12 8v8.2M10.4 16.2h3.2" />
    {[[3.6, 3.6], [18.4, 3.6], [3.6, 18.4], [18.4, 18.4]].map(([x, y], i) => <rect key={i} x={x} y={y} width="2" height="2" fill="currentColor" stroke="none" />)}
  </Svg>
)
export const ObjectsI = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2a8.8 8.8 0 108.8 8.8c0-1.6-1.2-2.6-2.7-2.3-2 .4-3.2-.8-2.8-2.8.3-1.5-.7-2.7-3.3-3.7z" fill={f(p.active)} />
    <path d="M20.6 13c-4.6.3-7.2 2.8-7.6 7.4" />
    <path d="M8.8 11v.6M12.4 14.4c-1 .8-2.4.8-3.4 0" />
  </Svg>
)
export const ImageI = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
    <circle cx="9" cy="10" r="1.7" />
    <path d="M4 17.6l4.6-4.4 3.4 3 3.2-3.6 5 5" />
  </Svg>
)
export const ShapesI = (p: P) => (
  <Svg {...p}>
    <path d="M7 3.5l3.5 6h-7zM17 3.5v6M14 6.5h6M17 3.5l3 3" />
    <rect x="3.6" y="13.6" width="6.8" height="6.8" rx="3.4" />
    <rect x="13.6" y="13.6" width="6.8" height="6.8" rx="1.6" />
  </Svg>
)
export const NoteI = (p: P) => (
  <Svg {...p}>
    <path d="M6 3.8h12a2 2 0 012 2V14l-6.2 6.2H6a2 2 0 01-2-2V5.8a2 2 0 012-2z" />
    <path d="M20 14h-4.2a1.8 1.8 0 00-1.8 1.8V20M8 8.8h8M8 12.2h4" />
  </Svg>
)
export const LaserI = (p: P) => (
  <Svg {...p}>
    <rect x="3.4" y="11.6" width="13" height="6" rx="3" transform="rotate(-38 9.9 14.6)" fill={f(p.active)} />
    <circle cx="7.3" cy="16.4" r=".6" fill="currentColor" />
    <path d="M17.2 3.2v2.2M20.4 6.4h-2.2M19.4 4.2l-1.5 1.5M14.8 4.4l.9.9M20 9.4l-.9-.9" />
  </Svg>
)
/** Lasso: dashed rope loop with a short solid tail and a filled cursor arrow. */
export const LassoI = ({ active, ...p }: P) => (
  <Svg {...p}>
    <path d="M8.6 15.1C5.2 14.6 3.1 12.4 3.5 9.7 4 6.5 7.8 4.3 12 4.5c4.2.2 7.3 2.6 6.8 5.6" strokeDasharray="2.3 2.3" fill={active ? ACC : 'none'} fillOpacity={active ? 0.9 : 0} />
    <path d="M8.6 15.1c.9 1.2.3 2.6-1.1 3.4" />
    <path d="M12.4 11.1l7.4 3.2-3.3 1.2-1.3 3.4z" fill="currentColor" />
  </Svg>
)
export const MicSparkI = (p: P) => (
  <Svg {...p}>
    <rect x="8.6" y="3.4" width="6" height="11.2" rx="3" />
    <path d="M5.4 11.4a6.2 6.2 0 0012.4 0M11.6 17.6v3.2M8.8 20.8h5.6" />
    <path d="M19.2 2.6v3.2M17.6 4.2h3.2" />
  </Svg>
)
export const AccessoriesI = (p: P) => (
  <Svg {...p}>
    <rect x="3.4" y="3.8" width="8" height="16.4" rx="1.8" />
    <rect x="13.6" y="3.8" width="7" height="7" rx="1.8" />
    <circle cx="17.1" cy="16.6" r="3.5" />
    <path d="M6.4 8h2M6.4 11h2" />
  </Svg>
)
export const SidebarI = (p: P) => (
  <Svg {...p}>
    <rect x="3.4" y="4.4" width="17.2" height="15.2" rx="3.2" />
    <path d="M9.6 4.4v15.2M6 9h1.8M6 12h1.8" />
  </Svg>
)
export const ReadI = (p: P) => (
  <Svg {...p}>
    <path d="M10 20H7.4A2.4 2.4 0 015 17.6V5.9a2.4 2.4 0 012.4-2.4h6.2L19 8.9V11" />
    <path d="M13.4 3.7V8a1 1 0 001 1H19M8.2 10.2h5.2M8.2 13.4h3" />
    <path d="M12.6 17.2c1.2-1.8 2.6-2.8 4.3-2.8s3.1 1 4.3 2.8c-1.2 1.8-2.6 2.8-4.3 2.8s-3.1-1-4.3-2.8z" />
    <circle cx="16.9" cy="17.2" r="1" />
  </Svg>
)
export const PagePlusI = (p: P) => (
  <Svg {...p}>
    <path d="M13.8 3.5H8A2.5 2.5 0 005.5 6v12A2.5 2.5 0 008 20.5h8a2.5 2.5 0 002.5-2.5V8.2z" />
    <path d="M13.8 3.7v3.6a1.4 1.4 0 001.4 1.4h3.3M12 11.4v6M9 14.4h6" />
  </Svg>
)
export const ShareI = (p: P) => (
  <Svg {...p}>
    <path d="M12 14.8V4M8.2 7.6L12 4l3.8 3.6M8 10.4H6.8A2.3 2.3 0 004.5 12.7v5.6a2.3 2.3 0 002.3 2.3h10.4a2.3 2.3 0 002.3-2.3v-5.6a2.3 2.3 0 00-2.3-2.3H16" />
  </Svg>
)
export const MoreI = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="7.8" cy="12" r=".5" fill="currentColor" /><circle cx="12" cy="12" r=".5" fill="currentColor" /><circle cx="16.2" cy="12" r=".5" fill="currentColor" />
  </Svg>
)
export const SearchI = (p: P) => (<Svg {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.4 15.4L20.5 20.5" /></Svg>)
export const HomeI = (p: P) => (<Svg {...p}><path d="M4 11l8-7 8 7M6 9.6V19a1 1 0 001 1h3.5v-5.5h3V20H17a1 1 0 001-1V9.6" /></Svg>)
export const WashiI = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 9.5l2 2.5-2 2.5 2 2.5H18.5l-2-2.5 2-2.5-2-2.5 2-2.5H5.5z" transform="rotate(-35 12 12)" fill={f(p.active)} />
  </Svg>
)
export const HighlighterI = (p: P) => (
  <Svg {...p}>
    <path d="M13 4.4l6.6 6.6-6.8 6.8-2.4-.4-1.2-1.2-.4-2.4z" fill={f(p.active)} />
    <path d="M9.2 14.2L5.4 18l.2 1.9 1.9.2 3.8-3.8M12 6.8l6 6" />
    <path d="M13.2 20.4h7" />
  </Svg>
)
export const MarkerI = (p: P) => (
  <Svg {...p}>
    <path d="M14.6 4.2l5.2 5.2-8.7 8.7-3.6.9-.8-.8.9-3.6z" fill={f(p.active)} />
    <path d="M8.4 14.5l1.1 1.1M13 5.8l5.2 5.2M5.4 19.6h5" />
    <path d="M18.4 3.4v2M17.4 4.4h2" />
  </Svg>
)
export const ShapeAutoI = (p: P) => (
  <Svg {...p}>
    <circle cx="9.5" cy="10" r="5.2" fill={f(p.active)} />
    <path d="M14.4 12.6l5.2 6.8-7.4-.4z" />
  </Svg>
)
export const PixelEraserI = (p: P) => (
  <Svg {...p}>
    <path d="M8.6 20.2l-4.5-4.5a2 2 0 010-2.8l9.3-9.3a2 2 0 012.8 0l4.5 4.5a2 2 0 010 2.8l-8.2 8.2" fill={f(p.active)} />
    <path d="M8.6 20.2h11" />
  </Svg>
)
export const StrokeEraserI = (p: P) => (
  <Svg {...p}>
    <path d="M4 17c3-9 5-9 8-3s5 3 8-6" />
    <path d="M9 21l-4-4a1.6 1.6 0 010-2.2l6-6a1.6 1.6 0 012.2 0l4 4a1.6 1.6 0 010 2.2L13 21" fill={f(p.active)} />
  </Svg>
)
export const LineStyleI = (p: P) => (<Svg {...p}><path d="M4 20L20 4" strokeWidth="2.2" /></Svg>)
export const TextBoxStyleI = (p: P) => (<Svg {...p}><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M4 20L20 4" /></Svg>)
export const TextStylesI = (p: P) => (<Svg {...p}><rect x="4.5" y="6" width="15" height="13" rx="1.4" /><path d="M8.6 10.4v-1h6.8v1M12 9.4v6.4M10.6 15.8h2.8" /><path d="M17.6 3.4c1-1 2.6 0 2 1.2-.3.7-2 1.8-2 1.8s-1.7-1.1-2-1.8c-.6-1.2 1-2.2 2-1.2z" fill="currentColor" /></Svg>)
export const PinI = (p: P) => (<Svg {...p}><path d="M9 4h6l-1 5 3 3H7l3-3zM12 12v8" /></Svg>)
export const LineSpacingI = (p: P) => (<Svg {...p}><path d="M8 5v14M5 8l3-3 3 3M5 16l3 3 3-3M14 6h6M14 10h6M14 14h6M14 18h6" /></Svg>)
export const AlignI = ({ a = 'left', ...p }: P & { a?: 'left' | 'center' | 'right' }) => (
  <Svg {...p}>
    <path d={a === 'left' ? 'M4 6h16M4 10h10M4 14h16M4 18h10' : a === 'center' ? 'M4 6h16M7 10h10M4 14h16M7 18h10' : 'M4 6h16M10 10h10M4 14h16M10 18h10'} />
  </Svg>
)
