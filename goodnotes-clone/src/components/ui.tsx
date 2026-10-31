import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { GN_SPRING } from './motion'
import { ChevronRight, X } from './glyphs'

/* ------------------------------ Popover ------------------------------ */
interface PopProps {
  anchor: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  width?: number
  align?: 'center' | 'left' | 'right'
  children: ReactNode
  className?: string
  arrow?: boolean
  style?: CSSProperties
}
export function Popover({ anchor, open, onClose, width = 360, align = 'center', children, className = '', arrow = false, style }: PopProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0, ax: 0, maxH: 600 })
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return
      const vw = window.innerWidth, vh = window.innerHeight
      const w = Math.min(width, vw - 24)
      let left = align === 'center' ? r.left + r.width / 2 - w / 2 : align === 'left' ? r.left : r.right - w
      left = Math.max(12, Math.min(left, vw - w - 12))
      const top = r.bottom + 12
      setPos({ left, top, ax: Math.max(24, Math.min(r.left + r.width / 2 - left, w - 24)), maxH: vh - top - 12 })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, anchor, width, align])
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      if ((t as HTMLElement).closest?.('[data-popover]')) return // nested popovers
      onClose()
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key) }
  }, [open, onClose, anchor])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} data-popover key="pop" className={`fixed z-[60] flex flex-col rounded-[26px] bg-pop text-ink shadow-popover ${className}`}
          style={{ left: pos.left, top: pos.top, width: Math.min(width, window.innerWidth - 16), maxHeight: pos.maxH, transformOrigin: `${pos.ax}px -8px`, ...style }}
          initial={{ opacity: 0, scale: 0.82, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -4, pointerEvents: 'none', transition: { duration: 0.14, ease: 'easeIn' } }}
          transition={GN_SPRING}>
          {arrow && <div className="absolute -top-[7px] h-4 w-4 rotate-45 rounded-[3px] bg-pop" style={{ left: pos.ax - 8 }} />}
          <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-[26px] no-scrollbar">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Spring used for every popover / sheet – quick, slightly under-damped like UIKit's popover presentation. */
export { GN_SPRING as SPRING } from './motion'

/** Push / pop transition for nested menu pages (dir 1 = deeper, -1 = back). */
export function Push({ id, dir, children }: { id: string; dir: 1 | -1; children: ReactNode }) {
  return (
    <motion.div key={id} initial={{ x: dir * 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={GN_SPRING}>
      {children}
    </motion.div>
  )
}

/* ------------------------------ Sheet ------------------------------ */
export function Sheet({ open, onClose, children, width = 680, className = '' }: { open: boolean; onClose: () => void; children: ReactNode; width?: number; className?: string }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="sheet" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3" onPointerDown={(e) => e.target === e.currentTarget && onClose()}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.16 } }} transition={{ duration: 0.18 }}>
          <motion.div data-popover className={`relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-[30px] bg-pop text-ink shadow-popover ${className}`} style={{ maxWidth: width }}
            initial={{ y: 36, scale: 0.97, opacity: 0.6 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 24, scale: 0.98, opacity: 0, pointerEvents: 'none', transition: { duration: 0.16 } }} transition={GN_SPRING}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ------------------------------ small controls ------------------------------ */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-[29px] w-[54px] shrink-0 rounded-full transition-colors ${on ? 'bg-good' : 'bg-gn-ink-3/40 dark:bg-gn-ink-2'}`}>
      <motion.span layout transition={{ type: 'spring', stiffness: 700, damping: 36 }} className="absolute top-[2px] h-[25px] w-[33px] rounded-full bg-white shadow" style={{ left: on ? 19 : 2 }} />
    </button>
  )
}

export function Slider({ value, onChange, min = 0, max = 100, ticks = 0, step = 1 }: { value: number; onChange: (v: number) => void; min?: number; max?: number; ticks?: number; step?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const frac = (value - min) / (max - min)
  const setFrom = (x: number) => {
    const r = ref.current!.getBoundingClientRect()
    const raw = min + ((x - r.left - 17) / (r.width - 34)) * (max - min)
    onChange(Math.round(Math.max(min, Math.min(max, raw)) / step) * step)
  }
  return (
    <div ref={ref} className="relative h-[40px] touch-none select-none"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setFrom(e.clientX) }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && setFrom(e.clientX)}>
      <div className="absolute left-0 right-0 top-[19px] h-[2px] rounded bg-hair" />
      <div className="absolute left-0 top-[19px] h-[2px] rounded bg-accent" style={{ width: `calc(17px + ${frac} * (100% - 34px))` }} />
      {ticks > 1 && Array.from({ length: ticks }, (_, i) => (
        <span key={i} className="absolute top-[29px] h-[3px] w-[3px] rounded-full bg-sub/60" style={{ left: `calc(17px + ${i / (ticks - 1)} * (100% - 34px) - 1.5px)` }} />
      ))}
      <div className="absolute top-[8px] h-[23px] w-[34px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.35)]" style={{ left: `calc(${frac} * (100% - 34px))` }} />
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, className = '' }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  const id = useId()
  return (
    <div className={`flex gap-0.5 rounded-full bg-chip p-[3px] ${className}`}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className="relative flex-1 rounded-full px-3 py-1.5 text-[15px] font-semibold text-ink">
          {value === o.id && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,.2)]" transition={GN_SPRING} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="px-4 pb-1.5 pt-4 text-[17px] font-semibold text-sub">{children}</div>
)
export const Group = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`mx-3 overflow-hidden rounded-[20px] bg-card ${className}`}>{children}</div>
)
export function Row({ icon, children, trailing, onClick, danger, chevron, ext, sub, disabled, as = 'button', className = '' }: {
  icon?: ReactNode; children: ReactNode; trailing?: ReactNode; onClick?: () => void; danger?: boolean; chevron?: boolean; ext?: boolean; sub?: ReactNode; disabled?: boolean; as?: 'button' | 'div'; className?: string
}) {
  const inner = (
    <>
      {icon && <span className={`flex w-7 shrink-0 justify-center ${danger ? 'text-danger' : 'text-ink'}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block text-[17px] leading-tight ${danger ? 'text-danger' : ''}`}>{children}</span>
        {sub && <span className="mt-0.5 block text-[16px] leading-snug text-sub">{sub}</span>}
      </span>
      {trailing}
      {chevron && <ChevronRight size={18} className="shrink-0 text-sub" />}
      {ext && <ExtI />}
    </>
  )
  const cls = `flex w-full items-center gap-3 px-3.5 py-[13px] text-left [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair disabled:opacity-40 ${onClick ? 'active:bg-chip' : ''} ${className}`
  return as === 'div'
    ? <div className={cls}>{inner}</div>
    : <button className={cls} onClick={onClick} disabled={disabled}>{inner}</button>
}
const ExtI = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13.5V18a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4.5M14 4h6v6M20 4l-9 9" /></svg>
)

export const PopTitle = ({ children, left, right }: { children: ReactNode; left?: ReactNode; right?: ReactNode }) => (
  <div className="relative flex h-[52px] items-center justify-center px-4 pt-2">
    {left && <div className="absolute left-3 top-2.5">{left}</div>}
    <h2 className="text-[19px] font-semibold">{children}</h2>
    {right && <div className="absolute right-3 top-2.5">{right}</div>}
  </div>
)
export const CircleBtn = ({ onClick, children, label, primary }: { onClick?: () => void; children: ReactNode; label: string; primary?: boolean }) => (
  <button aria-label={label} onClick={onClick}
    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-pill ${primary ? 'bg-gn-ui-action text-white' : 'bg-card text-ink'}`}>
    {children}
  </button>
)
export const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button aria-label="Zurück" onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-full bg-chip text-ink">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
)
export const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <CircleBtn label="Schließen" onClick={onClick}><X size={22} strokeWidth={2.4} /></CircleBtn>
)
