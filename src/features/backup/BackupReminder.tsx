import { useLiveQuery } from 'dexie-react-hooks'
import { db, getLastExportAt } from '../../data/db'
import { daysSinceBackup, isBackupDue } from '../../domain/session'

export function BackupReminder() {
  const status = useLiveQuery(async () => {
    const [lastExportAt, sessions, routines] = await Promise.all([getLastExportAt(), db.sessions.count(), db.routines.count()])
    const now = new Date()
    return { due: isBackupDue(lastExportAt, sessions + routines > 0, now), days: daysSinceBackup(lastExportAt, now) }
  })
  if (!status?.due) return null
  const { days } = status
  return (
    <a className="banner warning" href="#/backup">
      {days === undefined ? "You haven't backed up your data yet." : `It's been ${days} days since your last backup.`} Tap to export a backup.
    </a>
  )
}
