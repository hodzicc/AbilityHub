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
  apiGetAllUsers,
  apiCreateUser,
  apiUpdateProfile,
  apiDeactivateUser,
  type UserProfileResponse,
} from '@/lib/api'
import { toast } from 'sonner'

function profileToChild(p: UserProfileResponse, guardianId: string, assignedApps: string[] = []): Child {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`.trim(),
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : new Date('2015-01-01'),
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
  const [deleteChild, setDeleteChild] = useState<Child | null>(null)

  const loadChildren = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      let profiles: UserProfileResponse[]
      if (user.role === 'admin') {
        // Admin sees all children across the system
        const allUsers = await apiGetAllUsers(1, 200)
        profiles = allUsers.items.filter(u => u.roleId === 3)
      } else {
        profiles = await apiGetChildren(user.id)
      }
      const enriched = await Promise.all(
        profiles.map(async p => {
          const apps = await apiGetChildApps(p.id).catch(() => [])
          return profileToChild(p, user.id, apps.map(a => a.applicationId))
        })
      )
      setChildren(enriched)
    } catch {
      toast.error('Greška pri učitavanju djece')
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
        toast.error('Greška pri ažuriranju profila')
      }
    } else {
      // Create new child account
      try {
        const email = `child-${Date.now()}@internal.abilityhub.app`
        const password = Math.random().toString(36).slice(-12) + 'Aa1!'
        const result = await apiCreateUser({
          email,
          password,
          firstName: childData.firstName,
          lastName: childData.lastName,
          roleId: 3, // Child
        })
        if (!result.success) {
          toast.error('Greška pri kreiranju djeteta')
          return
        }
        // Set dateOfBirth and gender via profile update
        await apiUpdateProfile(result.userId, {
          firstName: childData.firstName,
          lastName: childData.lastName,
          dateOfBirth: childData.dateOfBirth.toISOString(),
          gender: childData.gender,
        })
        toast.success(t('children.addSuccess'))
        await loadChildren()
      } catch {
        toast.error('Greška pri dodavanju djeteta')
      }
    }
  }

  const handleDeleteChild = async () => {
    if (!deleteChild) return
    try {
      await apiDeactivateUser(deleteChild.id)
      toast.success('Dijete deaktivirano')
      setDeleteChild(null)
      await loadChildren()
    } catch {
      toast.error('Greška pri brisanju djeteta')
      setDeleteChild(null)
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
            Djecu kreiraju roditelji iz svog naloga. Administrator ima pregled svih dječjih profila (samo za uvid) — upravljanje korisničkim nalozima dostupno je u Admin panelu.
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
              progress={0}
              onEdit={user?.role === 'admin' ? undefined : () => {
                setEditChild(child)
                setIsAddDialogOpen(true)
              }}
              onDelete={user?.role === 'admin' ? undefined : () => setDeleteChild(child)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'Nema rezultata pretrage' : t('children.noChildren')}
          description={searchQuery ? 'Pokušajte s drugim pojmom' : t('children.noChildrenDesc')}
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

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteChild}
        onOpenChange={(open) => !open && setDeleteChild(null)}
        title={t('children.deleteConfirm')}
        description={t('children.deleteWarning')}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={handleDeleteChild}
      />
    </div>
  )
}
