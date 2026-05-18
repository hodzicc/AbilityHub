'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers'
import { PageHeader, EmptyState, ConfirmationDialog } from '@/components/shared'
import { ChildCard, AddChildDialog } from '@/components/children'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { mockChildren, mockChildProgress } from '@/lib/mock-data'
import type { Child } from '@/lib/types'
import { Plus, Search, Users } from 'lucide-react'

export default function ChildrenPage() {
  const { t } = useTranslation()
  const [children, setChildren] = useState<Child[]>(mockChildren)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [deleteChild, setDeleteChild] = useState<Child | null>(null)

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getChildProgress = (childId: string) => {
    const progress = mockChildProgress.filter(p => p.childId === childId)
    if (progress.length === 0) return 0
    return Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
  }

  const handleAddChild = (childData: Omit<Child, 'id' | 'createdAt' | 'parentId'>) => {
    if (editChild) {
      setChildren(prev => prev.map(c => 
        c.id === editChild.id 
          ? { ...c, ...childData }
          : c
      ))
      setEditChild(null)
    } else {
      const newChild: Child = {
        ...childData,
        id: `child-${Date.now()}`,
        parentId: 'user-1',
        createdAt: new Date()
      }
      setChildren(prev => [...prev, newChild])
    }
  }

  const handleDeleteChild = () => {
    if (deleteChild) {
      setChildren(prev => prev.filter(c => c.id !== deleteChild.id))
      setDeleteChild(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('children.title')}
        description={t('children.subtitle')}
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('children.addChild')}
        </Button>
      </PageHeader>

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
      {filteredChildren.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredChildren.map(child => (
            <ChildCard 
              key={child.id} 
              child={child}
              progress={getChildProgress(child.id)}
              onEdit={() => {
                setEditChild(child)
                setIsAddDialogOpen(true)
              }}
              onDelete={() => setDeleteChild(child)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'Nema rezultata pretrage' : t('children.noChildren')}
          description={searchQuery ? 'Pokušajte s drugim pojmom' : t('children.noChildrenDesc')}
          action={!searchQuery ? {
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
