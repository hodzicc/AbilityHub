'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Child, Gender } from '@/lib/types'

interface AddChildDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (child: Omit<Child, 'id' | 'createdAt' | 'parentId'>) => void
  editChild?: Child | null
}

export function AddChildDialog({ open, onOpenChange, onAdd, editChild }: AddChildDialogProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(editChild?.name || '')
  const [dateOfBirth, setDateOfBirth] = useState(
    editChild ? editChild.dateOfBirth.toISOString().split('T')[0] : ''
  )
  const [gender, setGender] = useState<Gender | ''>(editChild?.gender || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !dateOfBirth || !gender) {
      toast.error('Molimo popunite sva polja')
      return
    }

    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onAdd({
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender as Gender,
      assignedApps: editChild?.assignedApps || []
    })

    toast.success(editChild ? t('children.editSuccess') : t('children.addSuccess'))
    setIsLoading(false)
    onOpenChange(false)
    
    // Reset form
    setName('')
    setDateOfBirth('')
    setGender('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editChild ? t('children.editChild') : t('children.addChild')}
          </DialogTitle>
          <DialogDescription>
            {editChild 
              ? 'Uredite informacije o djetetu'
              : 'Dodajte novo dijete za praćenje napretka'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('children.name')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ime djeteta"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t('children.dateOfBirth')}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{t('children.gender')}</Label>
              <Select 
                value={gender} 
                onValueChange={(value) => setGender(value as Gender)}
                disabled={isLoading}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Odaberite spol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('children.male')}</SelectItem>
                  <SelectItem value="female">{t('children.female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editChild ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
