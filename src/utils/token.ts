import type { AuthTokens, User } from '@/types'

const ACCESS_TOKEN_KEY  = 'no_access'
const REFRESH_TOKEN_KEY = 'no_refresh'
const USER_KEY          = 'no_user'

// ── Secure-ish storage (httpOnly cookies preferred in prod; localStorage here for SPA) ──

export const tokenStorage = {
  setTokens(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY,  tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  },

  getTokens(): AuthTokens | null {
    const access_token  = localStorage.getItem(ACCESS_TOKEN_KEY)
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!access_token || !refresh_token) return null
    return { access_token, refresh_token, token_type: 'bearer' }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const userStorage = {
  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  },

  clearUser() {
    localStorage.removeItem(USER_KEY)
  },
}

// ── Decode JWT payload (no verification — server is source of truth) ─────────

export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload || typeof payload.exp !== 'number') return true
  return Date.now() >= payload.exp * 1000
}