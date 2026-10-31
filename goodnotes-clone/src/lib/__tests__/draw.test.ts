import { describe, expect, it } from 'vitest'
import { hitStroke, pixelErase, recognize, recognizeShape, selectionBBox, shapeOutline, type Stroke } from '../draw'

const pts = (a: [number, number][]) => a.map(([x, y]) => ({ x, y, w: 1 }))
const pen = (p: [number, number][], width = 2): Stroke => ({ id: 1, tool: 'pen', color: '#000', width, points: pts(p) })
const circle = (cx: number, cy: number, r: number, n = 48, jitter = 0) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2) + (i % 2 ? jitter : -jitter), cy + r * Math.sin((i / n) * Math.PI * 2)] as [number, number])

describe('shape recognition (Formen-Werkzeug)', () => {
  it('straight stroke → line', () => {
    expect(recognizeShape(pts([[0, 0], [50, 1], [100, 2], [150, 1], [200, 0]]))?.shape).toBe('line')
  })
  it('round loop → circle (equal radii)', () => {
    const r = recognizeShape(pts(circle(100, 100, 60, 48, 1.5)))!
    expect(r.shape).toBe('ellipse')
    const [a, b] = r.points
    expect(Math.abs((b.x - a.x) - (b.y - a.y))).toBeLessThan(1)
  })
  it('flat loop → ellipse', () => {
    const p = circle(0, 0, 1, 48).map(([x, y]) => [100 + x * 120, 100 + y * 50] as [number, number])
    expect(recognizeShape(pts(p))?.shape).toBe('ellipse')
  })
  it('closed four-corner path → axis-aligned rect', () => {
    const r = recognizeShape(pts([[0, 0], [100, 2], [200, 0], [201, 60], [200, 120], [100, 119], [0, 120], [1, 60], [0, 3]]))!
    expect(r.shape).toBe('rect')
  })
  it('closed three-corner path → polygon with 3 vertices', () => {
    const r = recognizeShape(pts([[100, 0], [150, 85], [200, 170], [100, 170], [0, 170], [50, 85], [99, 4]]))!
    expect(r.shape).toBe('poly')
    expect(r.points).toHaveLength(3)
  })
  it('scribble → not recognised', () => {
    expect(recognizeShape(pts([[0, 0], [40, 80], [80, 0], [120, 80], [160, 0], [200, 80]]))).toBeNull()
  })
  it('draw-and-hold recognises lines', () => {
    expect(recognize(pts([[0, 0], [30, 0], [60, 1], [90, 0], [120, 1], [150, 0], [180, 0]]))?.shape).toBe('line')
  })
})

describe('eraser', () => {
  const s = pen([[0, 0], [100, 0], [200, 0]])
  it('hit test respects radius and stroke width', () => {
    expect(hitStroke(s, 100, 5, 4)).toBe(true)
    expect(hitStroke(s, 100, 20, 4)).toBe(false)
  })
  it('pixel erase splits a stroke in two', () => {
    const parts = pixelErase(s, 100, 0, 10)!
    expect(parts).toHaveLength(2)
    expect(Math.max(...parts[0].points.map((p) => p.x))).toBeLessThan(100)
    expect(Math.min(...parts[1].points.map((p) => p.x))).toBeGreaterThan(100)
  })
  it('pixel erase leaves untouched strokes alone', () => {
    expect(pixelErase(s, 100, 50, 5)).toBeNull()
  })
})

describe('geometry', () => {
  it('rect outline is closed', () => {
    const o = shapeOutline({ id: 2, tool: 'shape', shape: 'rect', color: '#000', width: 2, points: pts([[0, 0], [10, 20]]) })
    expect(o[0]).toEqual(o[o.length - 1])
    expect(o).toHaveLength(5)
  })
  it('selection bbox covers strokes and images', () => {
    const bb = selectionBBox(
      { strokes: [pen([[10, 10], [20, 20]], 0)], texts: [], images: [{ id: 9, x: 50, y: 50, w: 10, h: 10, src: '' }] },
      { pageId: 'p', strokes: [1], texts: [], images: [9] },
    )!
    expect(bb.x0).toBeLessThanOrEqual(10); expect(bb.x1).toBe(60); expect(bb.y1).toBe(60)
  })
})
