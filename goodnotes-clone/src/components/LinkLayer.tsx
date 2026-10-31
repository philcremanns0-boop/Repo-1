import { useState } from 'react'
import type { LinkObj } from '../lib/draw'
import type { PageStore } from '../store/useNotebook'
import { useT } from '../context/Settings'

/**
 * Hyperlinks on a page. Active (tappable) in read mode and with the lasso – like Goodnotes, where links
 * do not get in the way of writing. Internal links jump to a page, external ones open the URL.
 */
export default function LinkLayer({ links, active, store, onGo, pageNo }: { links: LinkObj[]; active: boolean; store: PageStore; onGo: (pageId: string) => void; pageNo: (id: string) => number }) {
  const t = useT()
  const [menu, setMenu] = useState<number | null>(null)
  if (!links.length) return null
  const follow = (l: LinkObj) => { if ('page' in l.to) onGo(l.to.page); else window.open(l.to.url, '_blank', 'noopener') }
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
      {links.map((l) => (
        <div key={l.id} data-link className="absolute" style={{ left: l.x, top: l.y, width: l.w, height: l.h, pointerEvents: active ? 'auto' : 'none' }}>
          <button aria-label={t('Link öffnen')} onClick={(e) => { e.stopPropagation(); setMenu(menu === l.id ? null : l.id) }}
            className="absolute inset-0 rounded-[3px] border-b-2 border-[#1a82e0]/70 bg-[#1a82e0]/[.07]" style={{ cursor: active ? 'pointer' : 'default' }} />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a82e0] text-white shadow">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /></svg>
          </span>
          {menu === l.id && active && (
            <div className="absolute left-0 top-full z-10 mt-1 flex origin-top-left gap-0.5 whitespace-nowrap rounded-xl bg-gn-ui-toast p-1 text-[14px] text-white shadow-lg" onPointerDown={(e) => e.stopPropagation()}>
              <button className="rounded-lg px-2.5 py-1.5 hover:bg-white/10" onClick={() => { setMenu(null); follow(l) }}>
                {'page' in l.to ? `${t('Gehe zu Seite')} ${pageNo(l.to.page)}` : t('Link öffnen')}
              </button>
              <button className="rounded-lg px-2.5 py-1.5 text-[#ff6a5e] hover:bg-white/10" onClick={() => { setMenu(null); store.commit((c) => ({ ...c, links: (c.links ?? []).filter((x) => x.id !== l.id) })) }}>{t('Link entfernen')}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
