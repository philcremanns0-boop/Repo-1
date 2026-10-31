import { useEffect, useRef, useState, type RefObject } from 'react'
import { Popover, PopTitle } from '../ui'
import { useT } from '../../context/Settings'

export const hsv2hex = (h: number, s: number, v: number) => {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}
export const hex2hsv = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, mx ? d / mx : 0, mx]
}
const QUICK = ['#000000', '#555555', '#999999', '#ffffff', '#e00000', '#ff8a00', '#ffd60a', '#34c759', '#00aa00', '#0a84ff', '#1f6fe5', '#5e5ce6', '#af52de', '#ff2d92', '#9b2335', '#7d4e30']
const R = 100

export function Wheel({ hsv, onChange }: { hsv: [number, number, number]; onChange: (h: number, s: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!
    const img = ctx.createImageData(2 * R, 2 * R)
    for (let y = 0; y < 2 * R; y++) for (let x = 0; x < 2 * R; x++) {
      const dx = x - R + 0.5, dy = y - R + 0.5, d = Math.hypot(dx, dy), i = (y * 2 * R + x) * 4
      if (d > R) continue
      const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      const hex = hsv2hex(h, d / R, hsv[2]); const n = parseInt(hex.slice(1), 16)
      img.data[i] = n >> 16; img.data[i + 1] = (n >> 8) & 255; img.data[i + 2] = n & 255; img.data[i + 3] = d > R - 1 ? 255 * (R - d) : 255
    }
    ctx.putImageData(img, 0, 0)
  }, [hsv[2]])
  const pick = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
    onChange(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360, Math.min(1, Math.hypot(dx, dy) / (r.width / 2)))
  }
  const a = (hsv[0] * Math.PI) / 180
  return (
    <div className="relative mx-auto h-[200px] w-[200px] touch-none" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e) }} onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && pick(e)}>
      <canvas ref={cv} width={2 * R} height={2 * R} className="h-full w-full rounded-full shadow-[0_0_0_1px_rgba(0,0,0,.12)]" />
      <span className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]"
        style={{ left: R + Math.cos(a) * hsv[1] * R, top: R + Math.sin(a) * hsv[1] * R, background: hsv2hex(hsv[0], hsv[1], hsv[2]) }} />
    </div>
  )
}

interface Props { anchor: RefObject<HTMLElement | null>; open: boolean; onClose: () => void; color: string; onChange: (hex: string) => void; title?: string; onRemove?: () => void }
export default function ColorPopover({ anchor, open, onClose, color, onChange, title, onRemove }: Props) {
  const t = useT()
  const [hsv, setHsv] = useState<[number, number, number]>(() => hex2hsv(color))
  const [text, setText] = useState(color)
  useEffect(() => { if (open) { setHsv(hex2hsv(color)); setText(color) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const apply = (h: [number, number, number]) => { setHsv(h); const hx = hsv2hex(...h); setText(hx); onChange(hx) }
  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={320}>
      <PopTitle>{title ?? t('Farbe')}</PopTitle>
      <div className="px-4 pb-4">
        <Wheel hsv={hsv} onChange={(h, s) => apply([h, s, hsv[2]])} />
        <div className="mt-3 h-6 rounded-full" style={{ background: `linear-gradient(to right,#000,${hsv2hex(hsv[0], hsv[1], 1)})` }}>
          <input type="range" min={0} max={100} value={Math.round(hsv[2] * 100)} aria-label={t('Helligkeit')} onChange={(e) => apply([hsv[0], hsv[1], +e.target.value / 100])} className="h-6 w-full cursor-pointer opacity-0" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: color, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }} />
          <input value={text} aria-label="Hex" maxLength={7} spellCheck={false}
            onChange={(e) => { const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value; setText(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) { setHsv(hex2hsv(v)); onChange(v.toLowerCase()) } }}
            className="min-w-0 flex-1 rounded-xl bg-card px-3 py-2.5 font-mono text-[17px] uppercase outline-none" />
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1.5">
          {QUICK.map((c) => <button key={c} aria-label={c} onClick={() => { setHsv(hex2hsv(c)); setText(c); onChange(c) }} className="h-7 w-7 rounded-full" style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)' }} />)}
        </div>
        {onRemove && <button onClick={() => { onRemove(); onClose() }} className="mt-3 w-full rounded-xl bg-card py-2.5 text-[16px] text-danger">{t('Farbe entfernen')}</button>}
      </div>
    </Popover>
  )
}
