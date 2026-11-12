import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { importBackup, type ImportMode } from '../../data/backupService'
import { getLastExportAt, readAllData, setLastExportAt } from '../../data/db'
import { createBackup } from '../../domain/backup'
import { formatDate, plural } from '../../shared/format'
import { Screen } from '../../shared/ui'

type Message = { kind: 'ok' | 'error'; text: string } | null

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function BackupScreen() {
  // Data is preloaded so the share sheet opens directly from the tap (iOS requires a user gesture).
  const data = useLiveQuery(() => readAllData())
  const lastExportAt = useLiveQuery(() => getLastExportAt().then((v) => v ?? null))
  const [mode, setMode] = useState<ImportMode>('merge')
  const [message, setMessage] = useState<Message>(null)
  const [persisted, setPersisted] = useState<boolean | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  async function exportData() {
    if (!data) return
    const now = new Date()
    const json = JSON.stringify(createBackup(data, now), null, 2)
    const fileName = `workout-backup-${now.toISOString().slice(0, 10)}.json`
    const file = new File([json], fileName, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Backup de Workout Tracker' })
      } else {
        const url = URL.createObjectURL(file)
        const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      await setLastExportAt(now.toISOString())
      setMessage({ kind: 'ok', text: `Backup creado: ${plural(data.routines.length, 'rutina')}, ${plural(data.sessions.length, 'entrenamiento')}.` })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return // user closed the share sheet
      setMessage({ kind: 'error', text: `No se pudo exportar: ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow picking the same file again
    if (!file) return
    if (mode === 'replace' && !confirm('¿Reemplazar TODOS los datos actuales con este backup? Se perderá todo lo que no esté en el backup.')) return
    const result = await importBackup(await file.text(), mode)
    setMessage(
      result.ok
        ? { kind: 'ok', text: `Importación completa. Ahora tienes ${plural(result.routines, 'rutina')} y ${plural(result.sessions, 'entrenamiento')}.` }
        : { kind: 'error', text: result.error },
    )
  }

  async function requestPersistence() {
    setPersisted(await navigator.storage.persist())
  }

  return (
    <Screen title="Backup">
      {message && <p className={message.kind === 'ok' ? 'notice' : 'error'}>{message.text}</p>}

      <section className="card column">
        <h2>Exportar</h2>
        <p className="muted">
          Guarda todas tus rutinas y entrenamientos en un archivo. En el iPhone, elige <strong>Guardar en Archivos</strong> (iCloud Drive) en el menú de compartir.
        </p>
        <p className="small">
          {lastExportAt ? `Último backup: ${formatDate(lastExportAt)}` : lastExportAt === null ? 'Aún no hay backups.' : ''}
        </p>
        <button className="btn primary" onClick={exportData} disabled={!data}>
          Exportar datos
        </button>
      </section>

      <section className="card column">
        <h2>Importar</h2>
        <p className="muted">Carga un archivo de backup. Se verifica antes de modificar cualquier dato.</p>
        <fieldset className="radio-group">
          <label>
            <input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
            <span>
              <strong>Combinar</strong>: conserva los datos actuales y agrega lo que falte, sin duplicados
            </span>
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
            <span>
              <strong>Reemplazar</strong>: borra los datos actuales y usa solo el backup
            </span>
          </label>
        </fieldset>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button className="btn" onClick={() => fileInput.current?.click()}>
          Importar datos
        </button>
      </section>

      <section className="card column">
        <h2>Almacenamiento</h2>
        {persisted === undefined ? (
          <p className="muted">Este navegador no admite almacenamiento persistente.</p>
        ) : persisted ? (
          <p className="muted">El almacenamiento persistente está activado: el sistema no borrará tus datos para liberar espacio.</p>
        ) : (
          <>
            <p className="muted">Pide al sistema que conserve tus datos aunque el dispositivo tenga poco espacio.</p>
            <button className="btn" onClick={requestPersistence}>
              Activar almacenamiento persistente
            </button>
          </>
        )}
        {!isStandalone() && (
          <p className="muted small">
            Consejo: instala la app desde Safari con <strong>Compartir → Agregar a inicio</strong>. Las apps instaladas conservan sus datos
            de forma más confiable que las pestañas del navegador.
          </p>
        )}
      </section>
    </Screen>
  )
}
