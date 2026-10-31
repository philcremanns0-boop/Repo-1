import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SettingsProvider } from './context/Settings'
import '@fontsource-variable/albert-sans'
import './index.css'
import { loadCustomFonts } from './lib/customFonts'

void loadCustomFonts().catch(() => undefined)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </React.StrictMode>,
)
