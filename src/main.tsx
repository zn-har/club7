import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/geist'
import './styles/global.css'
import App from './App.tsx'

// the film starts at the top: don't restore a mid-page scroll under the loader
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
if (!location.hash) window.scrollTo(0, 0)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
