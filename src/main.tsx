import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/barlow/latin-400.css'
import '@fontsource/barlow/latin-500.css'
import '@fontsource/barlow/latin-600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { db } from './data/db'
import './index.css'
import { StorageUnavailable } from './shared/ErrorScreens'

// Ask the browser not to evict our IndexedDB data under storage pressure.
void navigator.storage?.persist?.().catch(() => false)

const root = createRoot(document.getElementById('root')!)

/** Opens the database first, so a blocked storage shows an explanation instead of a blank screen. */
async function start() {
  try {
    await db.open()
  } catch (error) {
    root.render(<StorageUnavailable error={error} />)
    return
  }
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
