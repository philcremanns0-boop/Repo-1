import { describe, expect, it } from 'vitest'
import { hitStroke, pixelErase } from '../draw'
import { parseInkHtml, strokesFromPayload, type InkPayload } from '../inkTransfer'

const payload: InkPayload = { v: 1, src: 'eigenhand', unit: 'pt', text: 'Hi', strokes: [
  { p: [0, 0, 10, 20, 20, 0], w: 1.5, c: '#1A2B3C' },
  { p: [30, 0, 30, 20], w: 1.5, c: 'red' },
] }
const html = (o: unknown) => `<meta charset="utf-8"><div data-gn-ink="${btoa(JSON.stringify(o))}">Hi</div>`

describe('ink transfer (Eigenhand -> notebook)', () => {
  it('parses the payload from clipboard HTML', () => {
    const p = parseInkHtml(html(payload))!
    expect(p.strokes).toHaveLength(2)
    expect(p.text).toBe('Hi')
  })
  it('ignores foreign or broken HTML', () => {
    expect(parseInkHtml('<b>hello</b>')).toBeNull()
    expect(parseInkHtml('<div data-gn-ink="!!!">x</div>')).toBeNull()
    expect(parseInkHtml(html({ v: 2, strokes: [] }))).toBeNull()
    expect(parseInkHtml(html({ v: 1, strokes: [{ p: [1], w: 1, c: '#000000' }] }))).toBeNull()
  })
  it('turns ink into pen strokes, pt scaled to px, placed at the target', () => {
    const s = strokesFromPayload(payload, 794, 1123, { x: 100, y: 200 })
    expect(s[0].tool).toBe('pen')
    expect(s[0].points[0]).toEqual({ x: 100, y: 200, w: 1 })
    expect(s[0].points[1].x).toBeCloseTo(100 + 10 * 96 / 72)
    expect(s[0].width).toBeCloseTo(2)
    expect(s[0].color).toBe('#1a2b3c')
    expect(s[1].color).toBe('#000000') // invalid colour falls back
    expect(new Set(s.map((x) => x.id)).size).toBe(2)
  })
  it('shrinks ink wider than the page', () => {
    const wide: InkPayload = { ...payload, strokes: [{ p: [0, 0, 2000, 0], w: 1, c: '#000000' }] }
    const s = strokesFromPayload(wide, 794, 1123)
    expect(Math.max(...s[0].points.map((p) => p.x))).toBeLessThanOrEqual(794 - 48 + 0.01)
  })
  it('pasted strokes can be hit and pixel-erased like drawn ink', () => {
    const [st] = strokesFromPayload(payload, 794, 1123, { x: 100, y: 100 })
    const mid = st.points[1]
    expect(hitStroke(st, mid.x, mid.y, 4)).toBe(true)
    const parts = pixelErase(st, mid.x, mid.y, 6)!
    expect(parts).not.toBeNull()
    expect(parts.every((p) => p.points.every((q) => Math.hypot(q.x - mid.x, q.y - mid.y) >= 5))).toBe(true)
  })
})
