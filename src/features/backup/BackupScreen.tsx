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
        await navigator.share({ files: [file], title: 'Workout Tracker backup' })
      } else {
        const url = URL.createObjectURL(file)
        const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      await setLastExportAt(now.toISOString())
      setMessage({ kind: 'ok', text: `Backup created: ${plural(data.routines.length, 'routine')}, ${plural(data.sessions.length, 'workout')}.` })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return // user closed the share sheet
      setMessage({ kind: 'error', text: `Could not export: ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow picking the same file again
    if (!file) return
    if (mode === 'replace' && !confirm('Replace ALL current data with this backup? Anything not in the backup will be lost.')) return
    const result = await importBackup(await file.text(), mode)
    setMessage(
      result.ok
        ? { kind: 'ok', text: `Import complete. You now have ${plural(result.routines, 'routine')} and ${plural(result.sessions, 'workout')}.` }
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
        <h2>Export</h2>
        <p className="muted">
          Save all your routines and workouts to a file. On iPhone, choose <strong>Save to Files</strong> (iCloud Drive) in the share sheet.
        </p>
        <p className="small">
          {lastExportAt ? `Last backup: ${formatDate(lastExportAt)}` : lastExportAt === null ? 'No backup yet.' : ''}
        </p>
        <button className="btn primary" onClick={exportData} disabled={!data}>
          Export data
        </button>
      </section>

      <section className="card column">
        <h2>Import</h2>
        <p className="muted">Load a backup file. The file is checked before anything changes.</p>
        <fieldset className="radio-group">
          <label>
            <input type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
            <span>
              <strong>Merge</strong> — keep current data and add what's missing, without duplicates
            </span>
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
            <span>
              <strong>Replace</strong> — delete current data and use only the backup
            </span>
          </label>
        </fieldset>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
        <button className="btn" onClick={() => fileInput.current?.click()}>
          Import data
        </button>
      </section>

      <section className="card column">
        <h2>Storage</h2>
        {persisted === undefined ? (
          <p className="muted">Persistent storage is not supported by this browser.</p>
        ) : persisted ? (
          <p className="muted">Persistent storage is on: the system will not clear your data to free up space.</p>
        ) : (
          <>
            <p className="muted">Ask the system to keep your data even when the device is low on space.</p>
            <button className="btn" onClick={requestPersistence}>
              Enable persistent storage
            </button>
          </>
        )}
        {!isStandalone() && (
          <p className="muted small">
            Tip: install the app with Safari's <strong>Share → Add to Home Screen</strong>. Installed apps keep their data more reliably than
            open browser tabs.
          </p>
        )}
      </section>
    </Screen>
  )
}
