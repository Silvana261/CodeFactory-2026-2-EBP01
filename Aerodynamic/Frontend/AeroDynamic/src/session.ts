export type AppRole = 'admin' | 'analyst'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: AppRole
}

export interface AuthSession {
  token: string
  user: SessionUser
}

const SESSION_KEY = 'aerodynamic.session'

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === 'number'
    && typeof user.name === 'string'
    && typeof user.email === 'string'
    && (user.role === 'admin' || user.role === 'analyst')
  )
}

export function saveSession(token: string, user: SessionUser): void {
  const session: AuthSession = { token, user }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession(): AuthSession | null {
  const stored = window.sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null

  try {
    const value: unknown = JSON.parse(stored)
    if (
      typeof value === 'object'
      && value !== null
      && typeof (value as Record<string, unknown>).token === 'string'
      && isSessionUser((value as Record<string, unknown>).user)
    ) {
      return value as AuthSession
    }
  } catch {
    clearSession()
  }

  clearSession()
  return null
}

export function clearSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY)
}
