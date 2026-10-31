/**
 * Inline line-art glyphs in the Goodnotes 6 style (24 grid, 1.7 stroke, round caps/joins).
 * Replaces every icon previously taken from lucide-react; names are kept so call sites stay readable.
 */
import type { ReactNode, SVGProps } from 'react'

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> { size?: number; strokeWidth?: number; color?: string }
export type GlyphIcon = (p: GlyphProps) => JSX.Element

const g = (children: ReactNode, sw = 1.7): GlyphIcon => ({ size = 24, strokeWidth = sw, color = 'currentColor', fill = 'none', width, height, ...rest }) => (
  <svg viewBox="0 0 24 24" width={width ?? size} height={height ?? size} fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
    {children}
  </svg>
)
const dot = (cx: number, cy: number, r = 1.1) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />
const DOC = 'M14 3.5H7.5a2 2 0 00-2 2v13a2 2 0 002 2h9a2 2 0 002-2V8zM14 3.5V8h4.5'
const FOLDER = 'M3.5 7a2 2 0 012-2h4l2 2.5h7a2 2 0 012 2V17a2 2 0 01-2 2h-13a2 2 0 01-2-2z'

export const ArrowRightToLine = g(<path d="M4 12h11M11 7l5 5-5 5M20 5v14" />)
export const Book = g(<path d="M5 17.5V6.5a2 2 0 012-2h11v13H7a2 2 0 00-2 2 2 2 0 002 2h11" />)
export const BookOpen = g(<path d="M12 6.6C10 5.1 7 4.6 4 5.1v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6.6v13" />)
export const Bookmark = g(<path d="M7 3.5h10a1 1 0 011 1v16l-6-4.2-6 4.2v-16a1 1 0 011-1z" />)
export const BookmarkCheck = g(<><path d="M7 3.5h10a1 1 0 011 1v16l-6-4.2-6 4.2v-16a1 1 0 011-1z" /><path d="M9.4 9.6l1.9 1.9 3.4-3.4" /></>)
export const Briefcase = g(<><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><path d="M9 7.5V6a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 6v1.5M3.5 12.5h17" /></>)
export const Camera = g(<><path d="M4 8.5a2 2 0 012-2h2l1.5-2h5l1.5 2h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><circle cx="12" cy="13" r="3.4" /></>)
export const Check = g(<path d="M5 12.5l4.5 4.5L19 7.5" />, 2)
export const ChevronDown = g(<path d="M6 9.5l6 6 6-6" />, 2)
export const ChevronLeft = g(<path d="M15 5l-7 7 7 7" />, 2)
export const ChevronRight = g(<path d="M9 5l7 7-7 7" />, 2)
export const Clock = g(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>)
export const Cloud = g(<path d="M7 18.5a4.5 4.5 0 01-.6-9 6 6 0 0111.3 1.6 3.8 3.8 0 01-.5 7.4z" />)
export const Copy = g(<><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5v-2a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2" /></>)
export const Download = g(<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />)
export const FileDown = g(<><path d={DOC} /><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5" /></>)
export const FilePen = g(<><path d={DOC} /><path d="M9 17l.5-2 4-4 1.5 1.5-4 4z" /></>)
export const Folder = g(<path d={FOLDER} />)
export const FolderPlus = g(<><path d={FOLDER} /><path d="M12 10.5v5M9.5 13h5" /></>)
export const GraduationCap = g(<path d="M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.6v4c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4M21.5 9.5v5" />)
export const GripHorizontal = g(<path d="M5 8h14M5 12h14M5 16h14" />)
export const Heart = g(<path d="M12 19.5s-7.5-4.6-7.5-10A4 4 0 0112 7a4 4 0 017.5 2.5c0 5.4-7.5 10-7.5 10z" />)
export const Image = g(<><rect x="3.5" y="4.5" width="17" height="15" rx="2.2" /><circle cx="9" cy="10" r="1.7" /><path d="M4 17.6l4.6-4.4 3.4 3 3.2-3.6 5 5" /></>)
export const Import = g(<path d="M12 4v10M8 10l4 4 4-4M5 14.5V18a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 18v-3.5" />)
export const Info = g(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" />{dot(12, 7.9)}</>)
export const LayoutGrid = g(<><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></>)
export const LayoutTemplate = g(<><rect x="3.5" y="4" width="17" height="6" rx="1.5" /><rect x="3.5" y="13" width="7" height="7" rx="1.5" /><rect x="13.5" y="13" width="7" height="7" rx="1.5" /></>)
export const List = g(<><path d="M9 6.5h11M9 12h11M9 17.5h11" />{dot(4.8, 6.5)}{dot(4.8, 12)}{dot(4.8, 17.5)}</>)
export const ListTree = g(<path d="M4 5.5h3M10.5 5.5H20M5.5 7v9.5A1.5 1.5 0 007 18h1.5M5.5 12h3M12 12h8M12 18h8" />)
export const Minus = g(<path d="M5 12h14" />, 2)
export const MoreHorizontal = g(<>{dot(6, 12, 1.4)}{dot(12, 12, 1.4)}{dot(18, 12, 1.4)}</>)
export const Music = g(<><path d="M9 18V6l11-2v12" /><circle cx="6.8" cy="18" r="2.2" /><circle cx="17.8" cy="16" r="2.2" /></>)
export const NotebookPen = g(<><path d="M13 20.5H6.5a2 2 0 01-2-2v-13a2 2 0 012-2h9a2 2 0 012 2V9M8 3.5v17" /><path d="M20.4 11.6l-5.4 5.4-1.9.5.5-1.9 5.4-5.4a1 1 0 011.4 1.4z" /></>)
export const Palette = g(<><path d="M12 3.5a8.5 8.5 0 100 17c1.2 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2s-.5-.7-.5-1.1c0-.9.8-1.6 1.7-1.6h2a4 4 0 004-4.4C20.5 6.6 16.7 3.5 12 3.5z" />{dot(7.6, 11.6)}{dot(9.6, 7.6)}{dot(14.4, 7.6)}</>)
export const Pause = g(<path d="M9 5.5v13M15 5.5v13" />, 2.4)
export const Play = g(<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" />)
export const Plus = g(<path d="M12 5v14M5 12h14" />, 2)
export const Presentation = g(<><rect x="3.5" y="4" width="17" height="11" rx="1.5" /><path d="M12 15v4M8.5 20l3.5-1 3.5 1" /></>)
export const Printer = g(<><path d="M7 8.5V4h10v4.5" /><rect x="3.5" y="8.5" width="17" height="8" rx="2" /><path d="M7 14h10v6H7z" /></>)
export const RotateCcw = g(<path d="M4 4.5V9h4.5M4.7 9A7.8 7.8 0 114.6 14.6" />)
export const RotateCw = g(<path d="M20 4.5V9h-4.5M19.3 9a7.8 7.8 0 10.1 5.6" />)
export const ScanLine = g(<path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M7.5 12h9" />)
export const Search = g(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.4 15.4L20.5 20.5" /></>)
export const Settings = g(<><path d="M12 2.9l1.6 2.1 2.6-.5.9 2.5 2.5.9-.5 2.6 2 1.5-2 1.6.5 2.6-2.5.9-.9 2.5-2.6-.5L12 21.1l-1.6-2-2.6.5-.9-2.5-2.5-.9.5-2.6-2-1.6 2-1.5-.5-2.6 2.5-.9.9-2.5 2.6.5z" /><circle cx="12" cy="12" r="3.1" /></>)
export const Shapes = g(<><path d="M7 3.5l3.5 6h-7zM17 3.5v6M14 6.5h6" /><circle cx="7" cy="17" r="3.4" /><rect x="13.6" y="13.6" width="6.8" height="6.8" rx="1.6" /></>)
export const Star = g(<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />)
export const Trash2 = g(<path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 011.3-1.3h2.4a1.3 1.3 0 011.3 1.3v1.7M6.5 6.5l.9 12.2a1.8 1.8 0 001.8 1.8h5.6a1.8 1.8 0 001.8-1.8l.9-12.2M10 10.5v6M14 10.5v6" />)
export const Upload = g(<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14" />)
export const User = g(<><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></>)
export const Users = g(<><circle cx="9" cy="8.5" r="3.3" /><path d="M3 19.5c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8M15.5 5.5a3.2 3.2 0 010 6.2M17.5 14.8c2 .5 3.2 2 3.5 4.7" /></>)
export const X = g(<path d="M6 6l12 12M18 6L6 18" />, 2)
