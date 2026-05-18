import type { User, Child, Application, AppAssignment, DailyUsage, ChildProgress, ActivityLog } from '@/lib/types'

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'roditelj@example.com',
    name: 'Amina Hodžić',
    role: 'parent',
    avatar: undefined,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date('2024-12-20')
  },
  {
    id: 'user-2',
    email: 'admin@example.com',
    name: 'Admin Korisnik',
    role: 'admin',
    avatar: undefined,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-12-20')
  },
  {
    id: 'user-3',
    email: 'selmahadzic@example.com',
    name: 'Selma Hadžić',
    role: 'parent',
    avatar: undefined,
    createdAt: new Date('2024-03-10'),
    lastLogin: new Date('2024-12-19')
  },
  {
    id: 'user-4',
    email: 'emirmujic@example.com',
    name: 'Emir Mujić',
    role: 'parent',
    avatar: undefined,
    createdAt: new Date('2024-05-22'),
    lastLogin: new Date('2024-12-18')
  }
]

// Mock Children
export const mockChildren: Child[] = [
  {
    id: 'child-1',
    name: 'Marko',
    dateOfBirth: new Date('2016-05-12'),
    gender: 'male',
    parentId: 'user-1',
    assignedApps: ['app-1', 'app-2', 'app-3', 'app-5'],
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'child-2',
    name: 'Ana',
    dateOfBirth: new Date('2018-09-23'),
    gender: 'female',
    parentId: 'user-1',
    assignedApps: ['app-1', 'app-4', 'app-6'],
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'child-3',
    name: 'Luka',
    dateOfBirth: new Date('2014-02-08'),
    gender: 'male',
    parentId: 'user-1',
    assignedApps: ['app-1', 'app-2', 'app-3', 'app-5', 'app-6'],
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'child-4',
    name: 'Sara',
    dateOfBirth: new Date('2017-11-30'),
    gender: 'female',
    parentId: 'user-1',
    assignedApps: ['app-1', 'app-4', 'app-5'],
    createdAt: new Date('2024-03-01')
  }
]

// Mock Applications
export const mockApplications: Application[] = [
  {
    id: 'app-1',
    name: 'Učimo Slova',
    description: 'Interaktivna aplikacija za učenje slova abecede kroz igru i zvukove. Djeca uče prepoznavati slova, pisati ih i povezivati sa riječima.',
    category: 'education',
    icon: 'BookOpen',
    color: '#4F46E5',
    minAge: 4,
    maxAge: 10,
    features: ['Prepoznavanje slova', 'Pisanje slova', 'Povezivanje sa slikama', 'Zvučna podrška'],
    isActive: true,
    platform: 'mobile',
    integrationStatus: 'ready',
    apiVersion: 'v1.2',
    authMethod: 'SSO',
    dataContract: ['usage_session', 'activity_result', 'preference_profile'],
    syncFrequency: 'Real-time',
    lastSync: new Date('2026-05-18T08:40:00')
  },
  {
    id: 'app-2',
    name: 'Matematička Avantura',
    description: 'Zabavno učenje osnovnih matematičkih operacija - brojanje, sabiranje i oduzimanje kroz igrice i vizualne prikaze.',
    category: 'education',
    icon: 'Calculator',
    color: '#10B981',
    minAge: 5,
    maxAge: 12,
    features: ['Brojanje', 'Sabiranje', 'Oduzimanje', 'Vizualni prikazi'],
    isActive: true,
    platform: 'mobile',
    integrationStatus: 'ready',
    apiVersion: 'v1.1',
    authMethod: 'SSO',
    dataContract: ['usage_session', 'activity_result', 'progress_snapshot'],
    syncFrequency: 'Svakih 15 minuta',
    lastSync: new Date('2026-05-18T08:25:00')
  },
  {
    id: 'app-3',
    name: 'Pričaj sa Mnom',
    description: 'Aplikacija za razvoj govora i komunikacijskih vještina. Uključuje vježbe izgovora, proširivanje vokabulara i jednostavne razgovore.',
    category: 'speech',
    icon: 'MessageCircle',
    color: '#F59E0B',
    minAge: 3,
    maxAge: 12,
    features: ['Vježbe izgovora', 'Vokabular', 'Slike i zvukovi', 'Snimanje glasa'],
    isActive: true,
    platform: 'hybrid',
    integrationStatus: 'in-progress',
    apiVersion: 'v0.9',
    authMethod: 'SSO',
    dataContract: ['usage_session', 'speech_attempt', 'recommendation_event'],
    syncFrequency: 'Dnevno',
    lastSync: new Date('2026-05-17T19:10:00')
  },
  {
    id: 'app-4',
    name: 'Boje i Oblici',
    description: 'Učenje prepoznavanja boja i geometrijskih oblika kroz interaktivne aktivnosti i igre sortiranja.',
    category: 'education',
    icon: 'Palette',
    color: '#EC4899',
    minAge: 3,
    maxAge: 8,
    features: ['Prepoznavanje boja', 'Geometrijski oblici', 'Sortiranje', 'Kreativne aktivnosti'],
    isActive: true,
    platform: 'mobile',
    integrationStatus: 'needs-adapter',
    apiVersion: 'legacy',
    authMethod: 'legacy',
    dataContract: ['local_progress_export'],
    syncFrequency: 'Ručno preko adaptera',
    lastSync: new Date('2026-05-14T16:30:00')
  },
  {
    id: 'app-5',
    name: 'Moja Rutina',
    description: 'Aplikacija za učenje dnevnih rutina i razvijanje samostalnosti. Vizualni rasporedi za pranje zuba, oblačenje, jelo i druge aktivnosti.',
    category: 'daily',
    icon: 'Clock',
    color: '#8B5CF6',
    minAge: 4,
    maxAge: 14,
    features: ['Vizualni rasporedi', 'Podsjetnici', 'Praćenje napretka', 'Nagrade'],
    isActive: true,
    platform: 'mobile',
    integrationStatus: 'ready',
    apiVersion: 'v1.0',
    authMethod: 'SSO',
    dataContract: ['routine_step', 'usage_session', 'preference_profile'],
    syncFrequency: 'Real-time',
    lastSync: new Date('2026-05-18T08:43:00')
  },
  {
    id: 'app-6',
    name: 'Igraj i Uči',
    description: 'Kombinacija edukativnih mini-igara koje razvijaju različite vještine - memoriju, koordinaciju, logičko razmišljanje.',
    category: 'games',
    icon: 'Gamepad2',
    color: '#06B6D4',
    minAge: 4,
    maxAge: 12,
    features: ['Memory igre', 'Puzzle', 'Koordinacija', 'Logičke igre'],
    isActive: true,
    platform: 'web',
    integrationStatus: 'in-progress',
    apiVersion: 'v0.8',
    authMethod: 'planned',
    dataContract: ['game_score', 'usage_session'],
    syncFrequency: 'Svakih 30 minuta',
    lastSync: new Date('2026-05-17T12:05:00')
  }
]

export const mockIntegrationEvents = [
  {
    id: 'sync-1',
    appId: 'app-1',
    type: 'preferences',
    status: 'success',
    message: 'Globalne preferencije poslane na mobilnu aplikaciju',
    timestamp: new Date('2026-05-18T08:42:00')
  },
  {
    id: 'sync-2',
    appId: 'app-5',
    type: 'usage',
    status: 'success',
    message: 'Sinhronizovane 24 aktivnosti dnevnih rutina',
    timestamp: new Date('2026-05-18T08:38:00')
  },
  {
    id: 'sync-3',
    appId: 'app-4',
    type: 'adapter',
    status: 'warning',
    message: 'Potrebno mapiranje starog CSV izvoza u standardizovani format',
    timestamp: new Date('2026-05-18T07:55:00')
  },
  {
    id: 'sync-4',
    appId: 'app-6',
    type: 'auth',
    status: 'pending',
    message: 'Čeka se zamjena lokalne prijave centralizovanim SSO tokom',
    timestamp: new Date('2026-05-17T18:20:00')
  }
]

// Mock App Assignments
export const mockAppAssignments: AppAssignment[] = [
  // Marko's assignments
  { id: 'assign-1', childId: 'child-1', appId: 'app-1', isActive: true, dailyTimeLimit: 30, totalUsageTime: 450, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-01-20') },
  { id: 'assign-2', childId: 'child-1', appId: 'app-2', isActive: true, dailyTimeLimit: 30, totalUsageTime: 320, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-01-20') },
  { id: 'assign-3', childId: 'child-1', appId: 'app-3', isActive: true, dailyTimeLimit: 20, totalUsageTime: 180, lastUsed: new Date('2024-12-19'), createdAt: new Date('2024-02-01') },
  { id: 'assign-4', childId: 'child-1', appId: 'app-5', isActive: true, dailyTimeLimit: 0, totalUsageTime: 520, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-01-20') },
  
  // Ana's assignments
  { id: 'assign-5', childId: 'child-2', appId: 'app-1', isActive: true, dailyTimeLimit: 20, totalUsageTime: 280, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-01-20') },
  { id: 'assign-6', childId: 'child-2', appId: 'app-4', isActive: true, dailyTimeLimit: 25, totalUsageTime: 350, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-01-20') },
  { id: 'assign-7', childId: 'child-2', appId: 'app-6', isActive: true, dailyTimeLimit: 30, totalUsageTime: 410, lastUsed: new Date('2024-12-19'), createdAt: new Date('2024-02-15') },
  
  // Luka's assignments
  { id: 'assign-8', childId: 'child-3', appId: 'app-1', isActive: true, dailyTimeLimit: 30, totalUsageTime: 680, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-02-15') },
  { id: 'assign-9', childId: 'child-3', appId: 'app-2', isActive: true, dailyTimeLimit: 45, totalUsageTime: 890, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-02-15') },
  { id: 'assign-10', childId: 'child-3', appId: 'app-3', isActive: true, dailyTimeLimit: 30, totalUsageTime: 420, lastUsed: new Date('2024-12-18'), createdAt: new Date('2024-02-15') },
  { id: 'assign-11', childId: 'child-3', appId: 'app-5', isActive: true, dailyTimeLimit: 0, totalUsageTime: 750, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-02-15') },
  { id: 'assign-12', childId: 'child-3', appId: 'app-6', isActive: true, dailyTimeLimit: 40, totalUsageTime: 560, lastUsed: new Date('2024-12-19'), createdAt: new Date('2024-03-01') },
  
  // Sara's assignments
  { id: 'assign-13', childId: 'child-4', appId: 'app-1', isActive: true, dailyTimeLimit: 25, totalUsageTime: 220, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-03-01') },
  { id: 'assign-14', childId: 'child-4', appId: 'app-4', isActive: true, dailyTimeLimit: 20, totalUsageTime: 180, lastUsed: new Date('2024-12-19'), createdAt: new Date('2024-03-01') },
  { id: 'assign-15', childId: 'child-4', appId: 'app-5', isActive: true, dailyTimeLimit: 0, totalUsageTime: 340, lastUsed: new Date('2024-12-20'), createdAt: new Date('2024-03-01') }
]

// Generate usage data for the last 30 days
function generateDailyUsage(): DailyUsage[] {
  const usage: DailyUsage[] = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Generate usage for each child-app combination
    mockChildren.forEach(child => {
      child.assignedApps.forEach(appId => {
        // Random usage between 5-45 minutes, with some zero days
        const hasUsage = Math.random() > 0.2
        if (hasUsage) {
          usage.push({
            date: dateStr,
            appId,
            childId: child.id,
            duration: Math.floor(Math.random() * 40) + 5,
            sessionsCount: Math.floor(Math.random() * 3) + 1
          })
        }
      })
    })
  }
  
  return usage
}

export const mockDailyUsage: DailyUsage[] = generateDailyUsage()

// Mock Child Progress
export const mockChildProgress: ChildProgress[] = [
  // Marko's progress
  { childId: 'child-1', appId: 'app-1', level: 8, score: 85, completedActivities: 42, totalActivities: 50, lastActivity: new Date('2024-12-20') },
  { childId: 'child-1', appId: 'app-2', level: 5, score: 72, completedActivities: 28, totalActivities: 40, lastActivity: new Date('2024-12-20') },
  { childId: 'child-1', appId: 'app-3', level: 4, score: 68, completedActivities: 20, totalActivities: 35, lastActivity: new Date('2024-12-19') },
  { childId: 'child-1', appId: 'app-5', level: 6, score: 78, completedActivities: 35, totalActivities: 45, lastActivity: new Date('2024-12-20') },
  
  // Ana's progress
  { childId: 'child-2', appId: 'app-1', level: 4, score: 65, completedActivities: 22, totalActivities: 50, lastActivity: new Date('2024-12-20') },
  { childId: 'child-2', appId: 'app-4', level: 6, score: 82, completedActivities: 30, totalActivities: 35, lastActivity: new Date('2024-12-20') },
  { childId: 'child-2', appId: 'app-6', level: 5, score: 75, completedActivities: 25, totalActivities: 40, lastActivity: new Date('2024-12-19') },
  
  // Luka's progress
  { childId: 'child-3', appId: 'app-1', level: 10, score: 95, completedActivities: 48, totalActivities: 50, lastActivity: new Date('2024-12-20') },
  { childId: 'child-3', appId: 'app-2', level: 9, score: 92, completedActivities: 38, totalActivities: 40, lastActivity: new Date('2024-12-20') },
  { childId: 'child-3', appId: 'app-3', level: 7, score: 80, completedActivities: 28, totalActivities: 35, lastActivity: new Date('2024-12-18') },
  { childId: 'child-3', appId: 'app-5', level: 8, score: 88, completedActivities: 40, totalActivities: 45, lastActivity: new Date('2024-12-20') },
  { childId: 'child-3', appId: 'app-6', level: 7, score: 85, completedActivities: 32, totalActivities: 40, lastActivity: new Date('2024-12-19') },
  
  // Sara's progress
  { childId: 'child-4', appId: 'app-1', level: 3, score: 55, completedActivities: 15, totalActivities: 50, lastActivity: new Date('2024-12-20') },
  { childId: 'child-4', appId: 'app-4', level: 4, score: 62, completedActivities: 18, totalActivities: 35, lastActivity: new Date('2024-12-19') },
  { childId: 'child-4', appId: 'app-5', level: 4, score: 60, completedActivities: 22, totalActivities: 45, lastActivity: new Date('2024-12-20') }
]

// Mock Activity Logs
export const mockActivityLogs: ActivityLog[] = [
  { id: 'log-1', childId: 'child-1', appId: 'app-1', action: 'completed', details: 'Završio lekciju "Slovo A"', timestamp: new Date('2024-12-20T14:30:00') },
  { id: 'log-2', childId: 'child-1', appId: 'app-2', action: 'achievement', details: 'Osvojio značku "Matematički Genije"', timestamp: new Date('2024-12-20T13:15:00') },
  { id: 'log-3', childId: 'child-2', appId: 'app-4', action: 'started', details: 'Započeo sesiju', timestamp: new Date('2024-12-20T12:00:00') },
  { id: 'log-4', childId: 'child-3', appId: 'app-2', action: 'completed', details: 'Završio sve zadatke sabiranja do 20', timestamp: new Date('2024-12-20T11:45:00') },
  { id: 'log-5', childId: 'child-4', appId: 'app-5', action: 'achievement', details: 'Kompletirao jutarnju rutinu 7 dana zaredom', timestamp: new Date('2024-12-20T10:30:00') },
  { id: 'log-6', childId: 'child-1', appId: 'app-5', action: 'completed', details: 'Završio večernju rutinu', timestamp: new Date('2024-12-19T20:00:00') },
  { id: 'log-7', childId: 'child-3', appId: 'app-6', action: 'achievement', details: 'Riješio 50 puzzle-a', timestamp: new Date('2024-12-19T16:30:00') },
  { id: 'log-8', childId: 'child-2', appId: 'app-1', action: 'started', details: 'Započeo sesiju', timestamp: new Date('2024-12-19T15:00:00') },
  { id: 'log-9', childId: 'child-1', appId: 'app-3', action: 'completed', details: 'Naučio 5 novih riječi', timestamp: new Date('2024-12-19T14:00:00') },
  { id: 'log-10', childId: 'child-4', appId: 'app-4', action: 'completed', details: 'Prepoznao sve osnovne boje', timestamp: new Date('2024-12-19T11:00:00') }
]

// Helper function to get child's age
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDiff = today.getMonth() - dateOfBirth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--
  }
  
  return age
}

// Helper function to format duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}
