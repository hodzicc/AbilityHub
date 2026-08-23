// User Types
export type UserRole = 'parent' | 'admin'

export interface User {
  id: string
  email: string
  name: string         // computed: firstName + lastName
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  /** When this guardian dismissed the introductory guide; null until they have. */
  helpGuideSeenAt: Date | null
  createdAt: Date
  lastLogin?: Date
}

// Child Types
export type Gender = 'male' | 'female'

export interface Child {
  id: string
  name: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  avatar?: string
  parentId: string
  assignedApps: string[]  // array of app IDs (populated separately)
  createdAt: Date
}

// Application Types
export type AppCategory = 'education' | 'speech' | 'motor' | 'daily' | 'games'

export interface Application {
  id: string
  key: string
  name: string
  description: string
  category: AppCategory
  icon: string   // Lucide icon name
  color: string  // hex
  minAge: number
  maxAge: number
  features: string[]
  isActive: boolean
  platform?: 'web' | 'mobile' | 'hybrid'
  dataFormat?: string
  version?: string
}

// Extended per-activity accessibility metrics. Apps may report any subset of
// these; fields are optional because not every app can measure every signal.
export interface ActivityMetrics {
  startedViaAction?: boolean      // activity begun via explicit "start" action
  completedViaAction?: boolean    // activity ended via explicit "done" action
  stepsCompleted?: number
  stepsTotal?: number
  durationSeconds?: number
  hintsShown?: number
  errorsCount?: number
}

// Weekly Parent Evaluation (check-in) Types
export type Mood = 'great' | 'good' | 'neutral' | 'difficult' | 'hard'
export type HelpLevel = 'none' | 'minimal' | 'moderate' | 'extensive'
export type PerformanceQuality = 'excellent' | 'good' | 'partial' | 'poor'
export type DayContext = 'normal' | 'poor-sleep' | 'illness' | 'routine-change' | 'stress' | 'other'

export interface WeeklyCheckIn {
  id: string
  childId: string
  weekStartDate: string // ISO date, Monday of the evaluated week
  moodBefore?: Mood
  moodAfter?: Mood
  helpLevel?: HelpLevel
  performanceQuality?: PerformanceQuality
  safetyIncident: boolean
  safetyIncidentNotes?: string
  dayContext?: DayContext
  dayContextNotes?: string
  usesSkillOutsideApp?: boolean
  generalNotes?: string
  createdAt: string
}

// Preferences Types
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large'
export type ColorScheme = 'default' | 'high-contrast' | 'pastel' | 'warm'
export type FontFamily = 'default' | 'rounded' | 'legible'

export interface UIPreferences {
  fontSize: FontSize
  colorScheme: ColorScheme
  fontFamily: FontFamily
  reducedMotion: boolean
  highContrast: boolean
  soundEnabled: boolean
}

// Auth Context Types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Language Types
export type Language = 'bs' | 'en'
