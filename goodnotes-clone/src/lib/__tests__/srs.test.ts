import { describe, expect, it } from 'vitest'
import { isDue, schedule } from '../srs'

const DAY = 86400000
describe('flashcard scheduling', () => {
  it('new card: Gut → 1 day, Leicht → 3 days', () => {
    expect(schedule(undefined, 1, 0).due).toBe(DAY)
    expect(schedule(undefined, 2, 0).due).toBe(3 * DAY)
  })
  it('Nochmal resets and comes back within minutes', () => {
    const c = schedule(schedule(undefined, 1, 0), 0, 1000)
    expect(c.reps).toBe(0)
    expect(c.due - 1000).toBeLessThan(5 * 60_000)
  })
  it('intervals grow with repeated success', () => {
    let c = schedule(undefined, 1, 0)
    const seen = [c.interval]
    for (let i = 0; i < 4; i++) { c = schedule(c, 1, c.due); seen.push(c.interval) }
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
    expect(seen[seen.length - 1]).toBeGreaterThan(seen[1])
  })
  it('isDue', () => {
    expect(isDue(undefined)).toBe(true)
    expect(isDue({ due: Date.now() + DAY, interval: 1, ease: 2.5, reps: 1 })).toBe(false)
  })
})
