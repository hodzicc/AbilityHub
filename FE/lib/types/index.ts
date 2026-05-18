// User Types
export type UserRole = 'parent' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
  lastLogin?: Date
}

// Child Types
export type Gender = 'male' | 'female'

export interface Child {
  id: string
  name: string
  dateOfBirth: Date
  gender: Gender
  avatar?: string
  parentId: string
  assignedApps: string[]
  createdAt: Date
}

// Application Types
export type AppCategory = 'education' | 'speech' | 'motor' | 'daily' | 'games'

export interface Application {
  id: string
  name: string
  description: string
  category: AppCategory
  icon: string
  color: string
  minAge: number
  maxAge: number
  features: string[]
  isActive: boolean
  platform?: 'web' | 'mobile' | 'hybrid'
  integrationStatus?: 'ready' | 'in-progress' | 'needs-adapter'
  apiVersion?: string
  authMethod?: 'SSO' | 'legacy' | 'planned'
  dataContract?: string[]
  syncFrequency?: string
  lastSync?: Date
}

export interface AppAssignment {
  id: string
  childId: string
  appId: string
  isActive: boolean
  dailyTimeLimit: number // in minutes
  totalUsageTime: number // in minutes
  lastUsed?: Date
  createdAt: Date
}

// Statistics Types
export interface DailyUsage {
  date: string
  appId: string
  childId: string
  duration: number // in minutes
  sessionsCount: number
}

export interface ChildProgress {
  childId: string
  appId: string
  level: number
  score: number
  completedActivities: number
  totalActivities: number
  lastActivity: Date
}

export interface ActivityLog {
  id: string
  childId: string
  appId: string
  action: 'started' | 'completed' | 'paused' | 'achievement'
  details?: string
  timestamp: Date
}

// Preferences Types
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large'
export type ColorScheme = 'default' | 'high-contrast' | 'pastel' | 'warm'

export interface UIPreferences {
  fontSize: FontSize
  colorScheme: ColorScheme
  reducedMotion: boolean
  highContrast: boolean
  soundEnabled: boolean
}

export interface NotificationSettings {
  dailyReport: boolean
  weeklyReport: boolean
  achievementAlerts: boolean
  timeLimitAlerts: boolean
  emailNotifications: boolean
}

// Auth Context Types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Language Types
export type Language = 'bs' | 'en'
