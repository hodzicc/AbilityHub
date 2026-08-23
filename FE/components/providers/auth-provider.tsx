'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/lib/types'
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  type UserProfileResponse,
} from '@/lib/api'
import { ROLE_ID } from '@/lib/constants'

/**
 * Why a login can fail. 'credentials' is a wrong email/password; 'child-account' is a
 * valid sign-in by someone who simply doesn't belong here — the two need different
 * messages, since telling a child their password is wrong would be untrue and unhelpful.
 */
export type LoginFailure = 'credentials' | 'child-account'

export interface LoginResult {
  ok: boolean
  reason?: LoginFailure
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function profileToUser(p: UserProfileResponse): User {
  return {
    id: p.id,
    email: p.email,
    firstName: p.firstName,
    lastName: p.lastName,
    name: `${p.firstName} ${p.lastName}`.trim(),
    role: p.roleId === ROLE_ID.ADMIN ? 'admin' : 'parent',
    helpGuideSeenAt: p.helpGuideSeenAt ? new Date(p.helpGuideSeenAt) : null,
    createdAt: new Date(p.createdAt),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount, ask the server who we are. The session lives in HttpOnly cookies the browser
  // cannot read, so "am I signed in?" is no longer a synchronous storage check — it is this
  // request, where a 401 means no valid session.
  useEffect(() => {
    const restore = async () => {
      try {
        const profile = await apiGetMe()
        // A child account may hold a valid session (it signs in to its own apps), but the
        // guardian dashboard is not theirs to use — end the session rather than render an
        // empty guardian shell around it.
        if (profile.roleId === ROLE_ID.CHILD) {
          await apiLogout()
          setState({ user: null, isAuthenticated: false, isLoading: false })
          return
        }
        setState({ user: profileToUser(profile), isAuthenticated: true, isLoading: false })
      } catch {
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      // The BFF stores the tokens as HttpOnly cookies; nothing comes back here to keep.
      await apiLogin(email, password)
      const profile = await apiGetMe()
      // The credentials are valid, but this platform is for guardians and administrators;
      // children sign in through the apps assigned to them (see the QR pairing flow).
      if (profile.roleId === ROLE_ID.CHILD) {
        await apiLogout()
        setState({ user: null, isAuthenticated: false, isLoading: false })
        return { ok: false, reason: 'child-account' }
      }
      const user = profileToUser(profile)
      setState({ user, isAuthenticated: true, isLoading: false })
      return { ok: true }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
      return { ok: false, reason: 'credentials' }
    }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      // Split name into firstName / lastName (best-effort)
      const parts = name.trim().split(' ')
      const firstName = parts[0] ?? name
      const lastName = parts.slice(1).join(' ') || '-'

      await apiRegister(email, password, firstName, lastName)
      const profile = await apiGetMe()
      const user = profileToUser(profile)
      setState({ user, isAuthenticated: true, isLoading: false })
      return true
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
