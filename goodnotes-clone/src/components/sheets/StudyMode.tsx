import { useEffect, useMemo, useRef, useState } from 'react'
import type { Page } from '../../store/types'
import { renderPage } from '../../lib/export'
import { isDue, schedule } from '../../lib/srs'
import { CloseBtn, Sheet } from '../ui'
import { Check } from '../glyphs'
import { useT } from '../../context/Settings'

/** Lernmodus: flashcard pages, answer half covered until tapped, graded with spaced repetition. */
export default function StudyMode({ open, pages, onClose, onGrade }: { open: boolean; pages: Page[]; onClose: () => void; onGrade: (pageId: string, card: Page['card']) => void }) {
  const t = useT()
  const cards = useMemo(() => pages.filter((p) => p.template === 'flashcard'), [pages])
  const [queue, setQueue] = useState<string[]>([])
  const [shown, setShown] = useState(false)
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (!open) return
    const due = cards.filter((p) => isDue(p.card)).sort((a, b) => (a.card?.due ?? 0) - (b.card?.due ?? 0))
    setQueue((due.length ? due : cards).map((p) => p.id)); setShown(false); setDone(0)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const cur = cards.find((p) => p.id === queue[0])
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!cur || !open) return
    let on = true
    void renderPage(cur, 1.2).then((c) => { if (!on || !cv.current) return; cv.current.width = c.width; cv.current.height = c.height; cv.current.getContext('2d')!.drawImage(c, 0, 0) })
    return () => { on = false }
  }, [cur, open])
  const grade = (g: 0 | 1 | 2) => {
    if (!cur) return
    onGrade(cur.id, schedule(cur.card, g))
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)))
    setShown(false); if (g) setDone((n) => n + 1)
  }
  return (
    <Sheet open={open} onClose={onClose} width={760} className="h-[min(940px,96vh)]">
      <div className="relative flex h-[64px] shrink-0 items-center justify-center">
        <div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div>
        <h2 className="text-[21px] font-semibold">{t('Lernkarten')}</h2>
        <span className="absolute right-5 top-5 text-[15px] tabular-nums text-sub">{done} / {done + queue.length}</span>
      </div>
      {!cards.length ? (
        <p className="px-8 pt-10 text-center text-[18px] text-sub">{t('Noch keine Lernkarten. Füge über „Seite hinzufügen → Mehr Vorlagen“ die Vorlage „Lernkarte“ hinzu: oben die Frage, unten die Antwort.')}</p>
      ) : !cur ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-chip text-accent"><Check size={36} strokeWidth={2.4} /></span><p className="text-[22px] font-semibold">{t('Alle fälligen Karten gelernt!')}</p>
          <button onClick={onClose} className="rounded-full bg-gn-ui-action px-6 py-2.5 text-[17px] font-semibold text-white">{t('Fertig')}</button>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 items-center justify-center px-6">
            <div className="relative h-full max-h-full overflow-hidden rounded-md shadow-page" style={{ aspectRatio: `${cv.current?.width ?? 3} / ${cv.current?.height ?? 4}` }} onClick={() => setShown(true)} role="button" aria-label={t('Antwort zeigen')}>
              <canvas ref={cv} className="block h-full w-full" />
              {!shown && <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center bg-card text-[18px] font-medium text-sub">{t('Tippen, um die Antwort zu zeigen')}</div>}
            </div>
          </div>
          <div className="flex shrink-0 justify-center gap-3 p-5">
            {shown ? (
              <>
                <button onClick={() => grade(0)} className="rounded-full bg-danger/15 px-6 py-3 text-[17px] font-semibold text-danger">{t('Nochmal')}</button>
                <button onClick={() => grade(1)} className="rounded-full bg-chip px-6 py-3 text-[17px] font-semibold">{t('Gut')}</button>
                <button onClick={() => grade(2)} className="rounded-full bg-good/15 px-6 py-3 text-[17px] font-semibold text-good">{t('Leicht')}</button>
              </>
            ) : <button onClick={() => setShown(true)} className="rounded-full bg-gn-ui-action px-8 py-3 text-[17px] font-semibold text-white">{t('Antwort zeigen')}</button>}
          </div>
        </>
      )}
    </Sheet>
  )
}
