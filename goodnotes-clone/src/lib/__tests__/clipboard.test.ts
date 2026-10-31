import { describe, expect, it } from 'vitest'
import { clipFor, copySel, hasClip, remove } from '../clipboard'
import type { Content } from '../draw'

const c: Content = {
  strokes: [{ id: 1, tool: 'pen', color: '#000', width: 2, points: [{ x: 10, y: 10, w: 1 }, { x: 30, y: 30, w: 1 }] }],
  texts: [{ id: 2, x: 100, y: 100, w: 120, text: 'Hallo', font: 'Helvetica', size: 16, color: '#000', bold: false, italic: false, align: 'left', lh: 1 }],
  images: [],
}
describe('lasso clipboard', () => {
  it('copy → paste places a fresh copy at the target point', () => {
    copySel(c, { pageId: 'a', strokes: [1], texts: [], images: [] })
    expect(hasClip()).toBe(true)
    const r = clipFor('b', { x: 200, y: 300 })!
    expect(r.sel.pageId).toBe('b')
    expect(r.add.strokes[0].id).not.toBe(1)
    expect(Math.min(...r.add.strokes[0].points.map((p) => p.x))).toBeGreaterThanOrEqual(198)
  })
  it('remove drops only the selected items', () => {
    const left = remove(c, { pageId: 'a', strokes: [1], texts: [], images: [] })
    expect(left.strokes).toHaveLength(0)
    expect(left.texts).toHaveLength(1)
  })
})
