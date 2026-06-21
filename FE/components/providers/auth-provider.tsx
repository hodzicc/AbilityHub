'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/lib/types'
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  type UserProfileResponse,
} from '@/lib/api'
import { ROLE_ID } from '@/lib/constants'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
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
    createdAt: new Date(p.createdAt),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount: if we have a stored token try to restore the session.
  useEffect(() => {
    const restore = async () => {
      if (!getAccessToken()) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }
      try {
        const profile = await apiGetMe()
        setState({ user: profileToUser(profile), isAuthenticated: true, isLoading: false })
      } catch {
        clearTokens()
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const auth = await apiLogin(email, password)
      setTokens(auth.accessToken, auth.refreshToken)
      const profile = await apiGetMe()
      const user = profileToUser(profile)
      setState({ user, isAuthenticated: true, isLoading: false })
      return true
    } catch {
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    const rt = getRefreshToken()
    if (rt) await apiLogout(rt)
    clearTokens()
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      // Split name into firstName / lastName (best-effort)
      const parts = name.trim().split(' ')
      const firstName = parts[0] ?? name
      const lastName = parts.slice(1).join(' ') || '-'

      const auth = await apiRegister(email, password, firstName, lastName)
      setTokens(auth.accessToken, auth.refreshToken)
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
