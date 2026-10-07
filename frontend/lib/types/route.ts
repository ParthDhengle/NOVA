export type Route =
  | 'chat'
  | 'projects'
  | 'connectors'
  | 'personalization'
  | 'settings'

export function routeFromPath(): Route {
  if (typeof window === 'undefined') return 'chat'
  const p = window.location.pathname
  if (p.startsWith('/projects')) return 'projects'
  if (p.startsWith('/connectors')) return 'connectors'
  if (p.startsWith('/personalization')) return 'personalization'
  if (p.startsWith('/settings')) return 'settings'
  return 'chat'
}