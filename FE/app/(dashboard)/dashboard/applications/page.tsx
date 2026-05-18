'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers'
import { PageHeader, EmptyState } from '@/components/shared'
import { AppCard } from '@/components/applications'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockApplications, mockAppAssignments } from '@/lib/mock-data'
import type { AppCategory } from '@/lib/types'
import { Search, AppWindow } from 'lucide-react'

const categories: (AppCategory | 'all')[] = ['all', 'education', 'speech', 'motor', 'daily', 'games']

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all')

  const filteredApps = mockApplications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getAssignedCount = (appId: string) => {
    return mockAppAssignments.filter(a => a.appId === appId).length
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('applications.title')}
        description={t('applications.subtitle')}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`${t('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? t('common.all') : t(`applications.categories.${category}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map(app => (
            <AppCard 
              key={app.id} 
              app={app}
              assignedCount={getAssignedCount(app.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={AppWindow}
          title={searchQuery ? 'Nema rezultata pretrage' : t('applications.noApps')}
          description={searchQuery ? 'Pokušajte s drugim pojmom' : t('applications.noAppsDesc')}
        />
      )}
    </div>
  )
}
