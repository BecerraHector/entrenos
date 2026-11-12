import { CalendarDays, Dumbbell, Save, TrendingUp } from 'lucide-react'
import { BackupScreen } from './features/backup/BackupScreen'
import { HistoryList } from './features/history/HistoryList'
import { SessionDetail } from './features/history/SessionDetail'
import { ProgressScreen } from './features/progress/ProgressScreen'
import { RoutineEditor } from './features/routines/RoutineEditor'
import { RoutineList } from './features/routines/RoutineList'
import { WorkoutScreen } from './features/workout/WorkoutScreen'
import { ErrorBoundary } from './shared/ErrorScreens'
import { useRoute, type Route } from './shared/router'

const TABS = [
  { href: '#/', label: 'Rutinas', Icon: Dumbbell, match: ['routines', 'routine-edit', 'workout'] },
  { href: '#/history', label: 'Historial', Icon: CalendarDays, match: ['history', 'session'] },
  { href: '#/progress', label: 'Progreso', Icon: TrendingUp, match: ['progress'] },
  { href: '#/backup', label: 'Backup', Icon: Save, match: ['backup'] },
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
      return <SessionDetail id={route.id} celebrate={route.celebrate === true} />
    case 'progress':
      return <ProgressScreen />
    case 'backup':
      return <BackupScreen />
  }
}

export function App() {
  const route = useRoute()
  // A new key per screen replays the entrance animation on every navigation.
  const routeKey = JSON.stringify(route)
  return (
    <div className="app">
      {/* Keyed per screen: navigating away from a crashed screen clears the error. */}
      <ErrorBoundary key={routeKey}>
        <div className="route">{renderRoute(route)}</div>
      </ErrorBoundary>
      <nav className="tabbar">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.includes(route.name)
          return (
            <a key={href} href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <Icon size={24} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              {label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
