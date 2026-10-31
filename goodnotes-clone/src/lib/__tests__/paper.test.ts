import { describe, expect, it } from 'vitest'
import { MM, PITCH, TEMPLATE_GROUPS, paperInner } from '../paper'

describe('paper templates', () => {
  it('ruling uses real notebook pitch', () => {
    expect(PITCH.wide / MM).toBeCloseTo(8.7, 5)
    expect(PITCH.narrow / MM).toBeCloseTo(7.1, 5)
  })
  it('every template renders without throwing', () => {
    for (const g of TEMPLATE_GROUPS) for (const it2 of g.items) {
      const svg = paperInner(it2.id, 'white', 794, 1123, 'x')
      if (it2.id === 'blank') expect(svg).toBe('')
      else expect(svg.length).toBeGreaterThan(10)
    }
  })
})
