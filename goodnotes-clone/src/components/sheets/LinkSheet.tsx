import { useEffect, useState } from 'react'
import type { Page } from '../../store/types'
import { PageThumb } from '../PaperThumb'
import { CloseBtn, Segmented, Sheet } from '../ui'
import { Check } from '../glyphs'
import { useT } from '../../context/Settings'

/** "Link hinzufügen": target is a page of this notebook or a web address. */
export default function LinkSheet({ open, pages, onClose, onDone }: { open: boolean; pages: Page[]; onClose: () => void; onDone: (to: { page: string } | { url: string }) => void }) {
  const t = useT()
  const [kind, setKind] = useState<'page' | 'url'>('page')
  const [page, setPage] = useState<string | null>(null)
  const [url, setUrl] = useState('https://')
  useEffect(() => { if (open) { setKind('page'); setPage(null); setUrl('https://') } }, [open])
  const okUrl = /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(url.trim())
  const ok = kind === 'page' ? !!page : okUrl
  return (
    <Sheet open={open} onClose={onClose} width={560} className="h-[min(720px,90vh)]">
      <div className="relative flex h-[68px] shrink-0 items-center justify-center">
        <div className="absolute left-3 top-3"><CloseBtn onClick={onClose} /></div>
        <h2 className="text-[21px] font-semibold">{t('Link hinzufügen')}</h2>
        <button aria-label={t('Fertig')} disabled={!ok} onClick={() => onDone(kind === 'page' ? { page: page! } : { url: url.trim() })} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-gn-ui-action text-white shadow-pill disabled:opacity-40"><Check size={26} strokeWidth={3} /></button>
      </div>
      <div className="shrink-0 px-8 pb-3"><Segmented value={kind} onChange={setKind} options={[{ id: 'page', label: t('Seite') }, { id: 'url', label: t('Webadresse') }]} /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        {kind === 'page' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-4 pt-2">
            {pages.map((p, i) => (
              <button key={p.id} onClick={() => setPage(p.id)} className="flex flex-col items-center gap-1.5" aria-label={`${t('Seite')} ${i + 1}`}>
                <PageThumb page={p} className={`w-full rounded-[3px] ${page === p.id ? 'ring-[3px] ring-gn-ui-select' : 'ring-1 ring-hair'}`} />
                <span className="text-[16px] tabular-nums">{i + 1}</span>
              </button>
            ))}
          </div>
        ) : (
          <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && okUrl && onDone({ url: url.trim() })} inputMode="url" aria-label={t('Webadresse')}
            className="mt-2 w-full rounded-2xl bg-card px-4 py-3.5 text-[19px] outline-none" />
        )}
      </div>
    </Sheet>
  )
}
