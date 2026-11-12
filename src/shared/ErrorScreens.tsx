import { DatabaseZap, RefreshCw, TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

function FatalScreen({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <main className="screen fatal" role="alert">
      <div className="empty-icon fatal-icon">{icon}</div>
      <h1>{title}</h1>
      {children}
    </main>
  )
}

/** Shown when IndexedDB cannot be opened (private browsing, blocked site data, full disk). */
export function StorageUnavailable({ error }: { error: unknown }) {
  return (
    <FatalScreen icon={<DatabaseZap size={40} strokeWidth={2} />} title="No se pudo acceder al almacenamiento">
      <p className="muted">
        La app guarda tus rutinas en este dispositivo, pero el navegador no lo está permitiendo. Si usas navegación privada, abre la app en
        una pestaña normal o instálala con <strong>Compartir → Agregar a inicio</strong>.
      </p>
      <button className="btn primary" onClick={() => window.location.reload()}>
        <RefreshCw size={18} strokeWidth={2.5} /> Reintentar
      </button>
      <details className="error-details">
        <summary>Detalles técnicos</summary>
        <code>{error instanceof Error ? `${error.name}: ${error.message}` : String(error)}</code>
      </details>
    </FatalScreen>
  )
}

interface BoundaryState {
  error: Error | null
}

/** Catches unexpected render errors so the app never ends up as a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <FatalScreen icon={<TriangleAlert size={40} strokeWidth={2} />} title="Algo salió mal">
        <p className="muted">Tus datos siguen guardados en el dispositivo. Vuelve al inicio o recarga la app para continuar.</p>
        <a className="btn primary" href="#/">
          Volver al inicio
        </a>
        <button className="btn" onClick={() => window.location.reload()}>
          <RefreshCw size={18} strokeWidth={2.5} /> Recargar
        </button>
        <details className="error-details">
          <summary>Detalles técnicos</summary>
          <code>{`${error.name}: ${error.message}`}</code>
        </details>
      </FatalScreen>
    )
  }
}
