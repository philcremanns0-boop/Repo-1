import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { SettingsProvider } from './context/Settings'
import '@fontsource-variable/albert-sans'
import './index.css'
import { loadCustomFonts } from './lib/customFonts'
import { ensureMigrated } from './lib/kv'

void loadCustomFonts().catch(() => undefined)
void ensureMigrated()

// Ask the browser to keep our IndexedDB / localStorage (PDF pages, fonts, notebooks) when storage is tight.
void navigator.storage?.persist?.().catch(() => undefined)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`).catch(() => undefined) })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
