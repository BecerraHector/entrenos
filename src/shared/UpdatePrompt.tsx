import { CloudOff, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_MS = 60 * 60 * 1000

/**
 * Tells the user when a new version is ready and lets them choose when to reload.
 * An in-progress workout is saved on every change, so updating never loses it.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed PWAs can stay open for days: look for updates every hour.
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (needRefresh) {
    return (
      <div className="toast" role="status">
        <Sparkles size={22} strokeWidth={2.5} className="toast-icon" aria-hidden="true" />
        <div className="grow">
          <strong>Nueva versión disponible</strong>
          <span className="muted small">Tu entrenamiento en curso se conserva.</span>
        </div>
        <div className="toast-actions">
          <button className="btn small ghost" onClick={() => setNeedRefresh(false)}>
            Después
          </button>
          <button className="btn small primary" onClick={() => void updateServiceWorker(true)}>
            Actualizar
          </button>
        </div>
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="toast" role="status">
        <CloudOff size={22} strokeWidth={2.5} className="toast-icon" aria-hidden="true" />
        <div className="grow">
          <strong>Lista para usar sin conexión</strong>
        </div>
      </div>
    )
  }

  return null
}
