import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'routines' }
  | { name: 'routine-edit'; id?: string }
  | { name: 'workout'; routineId: string }
  | { name: 'history' }
  | { name: 'session'; id: string; celebrate?: true }
  | { name: 'progress' }
  | { name: 'backup' }

/** Hash-based routes (`#/history`) so the app works on any static host and offline. */
export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const [section, id, action] = path.split('/').map(decodeURIComponent)
  switch (section) {
    case 'routines':
      if (id === 'new') return { name: 'routine-edit' }
      if (id && action === 'edit') return { name: 'routine-edit', id }
      return { name: 'routines' }
    case 'workout':
      return id ? { name: 'workout', routineId: id } : { name: 'routines' }
    case 'history':
      if (!id) return { name: 'history' }
      return new URLSearchParams(query).get('done') === '1' ? { name: 'session', id, celebrate: true } : { name: 'session', id }
    case 'progress':
      return { name: 'progress' }
    case 'backup':
      return { name: 'backup' }
    default:
      return { name: 'routines' }
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseHash(hash)
}

export function go(path: string): void {
  window.location.hash = path
  window.scrollTo(0, 0)
}
