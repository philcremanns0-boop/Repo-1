import { Component, type ReactNode } from 'react'

/** Last-resort guard: a render error shows a recovery screen instead of a blank app. Data stays in local storage. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error('[Goodnotes] render error', error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-canvas p-8 text-center text-ink">
        <h1 className="text-[24px] font-bold">Etwas ist schiefgelaufen</h1>
        <p className="max-w-md text-[17px] text-sub">Deine Notizbücher sind lokal gespeichert und nicht verloren. Lade die App neu, um weiterzumachen.</p>
        <pre className="max-w-lg overflow-auto rounded-xl bg-card p-3 text-left text-[12px] text-sub">{String(this.state.error.message)}</pre>
        <div className="flex gap-3">
          <button className="rounded-full bg-gn-ui-action px-5 py-2.5 text-[17px] font-semibold text-white" onClick={() => location.reload()}>Neu laden</button>
          <button className="rounded-full bg-card px-5 py-2.5 text-[17px] font-semibold" onClick={() => { localStorage.setItem('gn:library', JSON.stringify({ ...JSON.parse(localStorage.getItem('gn:library') || '{}'), view: 'home', tabs: [] })); location.reload() }}>Zur Bibliothek</button>
        </div>
      </div>
    )
  }
}
