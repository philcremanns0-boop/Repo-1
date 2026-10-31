import type { CardState } from '../store/types'

/** SM-2 style scheduling for the flashcard study mode. grade: 0 = Nochmal, 1 = Gut, 2 = Leicht */
const DAY = 86400000
export function schedule(prev: CardState | undefined, grade: 0 | 1 | 2, now = Date.now()): CardState {
  const s = prev ?? { due: now, interval: 0, ease: 2.5, reps: 0 }
  if (grade === 0) return { due: now + 60_000, interval: 0, ease: Math.max(1.3, s.ease - 0.2), reps: 0 }
  const ease = Math.max(1.3, s.ease + (grade === 2 ? 0.15 : 0))
  const interval = s.reps === 0 ? (grade === 2 ? 3 : 1) : s.reps === 1 ? (grade === 2 ? 6 : 3) : Math.round(s.interval * ease * (grade === 2 ? 1.3 : 1))
  return { due: now + interval * DAY, interval, ease, reps: s.reps + 1 }
}
export const isDue = (c: CardState | undefined, now = Date.now()) => !c || c.due <= now
