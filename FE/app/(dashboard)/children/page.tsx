'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/components/providers'
import { useAuth } from '@/components/providers'
import { PageHeader, EmptyState, ConfirmationDialog } from '@/components/shared'
import { ChildCard, AddChildDialog } from '@/components/children'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Child } from '@/lib/types'
import { Plus, Search, Users, Info } from 'lucide-react'
import {
  apiGetChildren,
  apiGetChildApps,
  apiGetAllUsersUnpaged,
  apiCreateUser,
  apiUpdateProfile,
  apiDeactivateUser,
  apiGetDashboard,
  type UserProfileResponse,
} from '@/lib/api'
import { ROLE_ID, FALLBACK_DATE_OF_BIRTH } from '@/lib/constants'
import { toast } from 'sonner'

function profileToChild(p: UserProfileResponse, guardianId: string, assignedApps: string[] = []): Child {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`.trim(),
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : FALLBACK_DATE_OF_BIRTH,
    gender: (p.gender as 'male' | 'female') ?? 'male',
    parentId: guardianId,
    assignedApps,
    createdAt: new Date(p.createdAt),
  }
}

export default function ChildrenPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [deactivateChild, setDeactivateChild] = useState<Child | null>(null)
  const [progressById, setProgressById] = useState<Record<string, number>>({})

  // `expectId` — a just-created child's id. The profile + guardian link are built
  // asynchronously from an event, so we briefly poll until it appears (read-after-
  // write in an eventually-consistent system) rather than show a stale list.
  const loadChildren = async (expectId?: string) => {
    if (!user) return
    setIsLoading(true)
    try {
      let profiles: UserProfileResponse[] = []
      for (let attempt = 0; attempt < 6; attempt++) {
        if (user.role === 'admin') {
          profiles = await apiGetAllUsersUnpaged(ROLE_ID.CHILD)
        } else {
          profiles = await apiGetChildren(user.id)
        }
        if (!expectId || profiles.some(p => p.id === expectId)) break
        await new Promise(r => setTimeout(r, 500)) // wait for the create event to land
      }
      const enriched = await Promise.all(
        profiles.map(async p => {
          const [apps, dashboard] = await Promise.all([
            apiGetChildApps(p.id).catch(() => []),
            apiGetDashboard(p.id).catch(() => null),
          ])
          return {
            child: profileToChild(p, user.id, apps.map(a => a.applicationId)),
            progress: Math.round(dashboard?.avgProgressPercent ?? 0),
          }
        })
      )
      setChildren(enriched.map(e => e.child))
      setProgressById(Object.fromEntries(enriched.map(e => [e.child.id, e.progress])))
    } catch {
      toast.error(t('children.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChildren()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddChild = async (childData: {
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: 'male' | 'female'
  }) => {
    if (!user) return
    if (editChild) {
      // Update existing child profile
      try {
        await apiUpdateProfile(editChild.id, {
          firstName: childData.firstName,
          lastName: childData.lastName,
          dateOfBirth: childData.dateOfBirth.toISOString(),
          gender: childData.gender,
        })
        toast.success(t('children.editSuccess'))
        setEditChild(null)
        await loadChildren()
      } catch {
        toast.error(t('children.updateError'))
      }
    } else {
      // Create new child account
      try {
        const email = `child-${Date.now()}@internal.abilityhub.app`
        const password = Math.random().toString(36).slice(-12) + 'Aa1!'
        // dateOfBirth + gender are set atomically at creation (no racey follow-up update).
        const result = await apiCreateUser({
          email,
          password,
          firstName: childData.firstName,
          lastName: childData.lastName,
          roleId: ROLE_ID.CHILD,
          dateOfBirth: childData.dateOfBirth.toISOString(),
          gender: childData.gender,
        })
        if (!result.success) {
          toast.error(t('children.createError'))
          return
        }
        toast.success(t('children.addSuccess'))
        await loadChildren(result.userId)
      } catch {
        toast.error(t('children.addError'))
      }
    }
  }

  const handleDeactivateChild = async () => {
    if (!deactivateChild) return
    try {
      await apiDeactivateUser(deactivateChild.id)
      toast.success(t('children.deactivatedToast'))
      setDeactivateChild(null)
      await loadChildren()
    } catch {
      toast.error(t('children.deactivateError'))
      setDeactivateChild(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('children.title')}
        description={t('children.subtitle')}
      >
        {user?.role !== 'admin' && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('children.addChild')}
          </Button>
        )}
      </PageHeader>

      {user?.role === 'admin' && (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('children.adminInfo')}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`${t('common.search')}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Children Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredChildren.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredChildren.map(child => (
            <ChildCard
              key={child.id}
              child={child}
              progress={progressById[child.id] ?? 0}
              onEdit={user?.role === 'admin' ? undefined : () => {
                setEditChild(child)
                setIsAddDialogOpen(true)
              }}
              onDelete={user?.role === 'admin' ? undefined : () => setDeactivateChild(child)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchQuery ? t('common.noSearchResults') : t('children.noChildren')}
          description={searchQuery ? t('common.tryDifferentTerm') : t('children.noChildrenDesc')}
          action={!searchQuery && user?.role !== 'admin' ? {
            label: t('children.addChild'),
            onClick: () => setIsAddDialogOpen(true)
          } : undefined}
        />
      )}

      {/* Add/Edit Dialog */}
      <AddChildDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setEditChild(null)
        }}
        onAdd={handleAddChild}
        editChild={editChild}
      />

      {/* Deactivation confirmation — the account is disabled, not erased. */}
      <ConfirmationDialog
        open={!!deactivateChild}
        onOpenChange={(open) => !open && setDeactivateChild(null)}
        title={t('children.deactivateConfirm')}
        description={t('children.deactivateWarning')}
        confirmLabel={t('children.deactivateChild')}
        variant="destructive"
        onConfirm={handleDeactivateChild}
      />
    </div>
  )
}
