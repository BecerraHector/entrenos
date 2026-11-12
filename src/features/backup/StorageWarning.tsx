import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { isStandalone } from '../../shared/standalone'

/**
 * Safari may delete website data after 7 days without use. Installed home screen apps are exempt,
 * so the warning only shows when the app runs in a browser tab.
 */
export function StorageWarning() {
  const [installed] = useState(isStandalone)
  if (installed) return null
  return (
    <a className="banner danger" href="#/backup">
      <TriangleAlert size={22} strokeWidth={2.5} aria-hidden="true" className="banner-icon" />
      <span>
        <strong>Estás usando la app desde el navegador.</strong> Safari puede borrar tus datos si no la abres durante 7 días. Instálala con{' '}
        <strong>Compartir → Agregar a inicio</strong> o exporta un backup.
      </span>
    </a>
  )
}
