import type { Application, AppCategory } from '@/lib/types'
import type { ApplicationResponse } from '@/lib/api'
import { DEFAULT_APP_COLOR } from '@/lib/constants'

/** Maps the backend's ApplicationResponse to the frontend's Application shape. */
export function responseToApp(r: ApplicationResponse): Application {
  let features: string[] = []
  try { features = JSON.parse(r.featuresJson) } catch {}
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    category: (r.category as AppCategory) || 'education',
    icon: r.iconName || 'AppWindow',
    color: r.color || DEFAULT_APP_COLOR,
    minAge: r.minAge,
    maxAge: r.maxAge,
    features,
    isActive: r.isActive,
    platform: (r.platform?.toLowerCase() as 'web' | 'mobile' | 'hybrid') || 'mobile',
    dataFormat: r.dataFormat,
    version: r.version,
  }
}
