'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState, UserRole } from '@/lib/types'
import { mockUsers } from '@/lib/mock-data'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('abilityhub-user')

    if (!storedUser) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const user = JSON.parse(storedUser)
      setState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch {
      localStorage.removeItem('abilityhub-user')
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Find user by email (mock authentication)
    const user = mockUsers.find(u => u.email === email)
    
    if (user) {
      const updatedUser = { ...user, lastLogin: new Date() }
      localStorage.setItem('abilityhub-user', JSON.stringify(updatedUser))
      setState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false
      })
      return true
    }
    
    setState(prev => ({ ...prev, isLoading: false }))
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('abilityhub-user')
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }, [])

  const register = useCallback(async (email: string, _password: string, name: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      setState(prev => ({ ...prev, isLoading: false }))
      return false
    }
    
    // Create new user (in real app, this would be saved to backend)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'parent' as UserRole,
      createdAt: new Date(),
      lastLogin: new Date()
    }
    
    localStorage.setItem('abilityhub-user', JSON.stringify(newUser))
    setState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false
    })
    return true
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

