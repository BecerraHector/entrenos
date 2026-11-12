import { BackupScreen } from './features/backup/BackupScreen'
import { HistoryList } from './features/history/HistoryList'
import { SessionDetail } from './features/history/SessionDetail'
import { ProgressScreen } from './features/progress/ProgressScreen'
import { RoutineEditor } from './features/routines/RoutineEditor'
import { RoutineList } from './features/routines/RoutineList'
import { WorkoutScreen } from './features/workout/WorkoutScreen'
import { useRoute, type Route } from './shared/router'

const TABS = [
  { href: '#/', label: 'Rutinas', icon: '🏋️', match: ['routines', 'routine-edit', 'workout'] },
  { href: '#/history', label: 'Historial', icon: '🗓️', match: ['history', 'session'] },
  { href: '#/progress', label: 'Progreso', icon: '📈', match: ['progress'] },
  { href: '#/backup', label: 'Backup', icon: '💾', match: ['backup'] },
]

function renderRoute(route: Route) {
  switch (route.name) {
    case 'routines':
      return <RoutineList />
    case 'routine-edit':
      return <RoutineEditor id={route.id} />
    case 'workout':
      return <WorkoutScreen routineId={route.routineId} />
    case 'history':
      return <HistoryList />
    case 'session':
      return <SessionDetail id={route.id} />
    case 'progress':
      return <ProgressScreen />
    case 'backup':
      return <BackupScreen />
  }
}

export function App() {
  const route = useRoute()
  return (
    <div className="app">
      {renderRoute(route)}
      <nav className="tabbar">
        {TABS.map((tab) => (
          <a key={tab.href} href={tab.href} className={tab.match.includes(route.name) ? 'active' : ''} aria-current={tab.match.includes(route.name) ? 'page' : undefined}>
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
