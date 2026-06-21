'use client'

import { useState, useEffect } from 'react'
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
import { Loader2 } from 'lucide-react'
import type { Child, Gender } from '@/lib/types'

interface AddChildDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (child: {
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: Gender
  }) => Promise<void>
  editChild?: Child | null
}

export function AddChildDialog({ open, onOpenChange, onAdd, editChild }: AddChildDialogProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')

  useEffect(() => {
    if (editChild) {
      setFirstName(editChild.firstName ?? editChild.name.split(' ')[0])
      setLastName(editChild.lastName ?? editChild.name.split(' ').slice(1).join(' '))
      setDateOfBirth(editChild.dateOfBirth instanceof Date
        ? editChild.dateOfBirth.toISOString().split('T')[0]
        : '')
      setGender(editChild.gender)
    } else {
      setFirstName('')
      setLastName('')
      setDateOfBirth('')
      setGender('')
    }
  }, [editChild, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !dateOfBirth || !gender) return

    setIsLoading(true)
    try {
      await onAdd({
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender as Gender,
      })
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
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
              ? t('children.editDialogDesc')
              : t('children.addDialogDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('children.firstName')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('children.firstNamePlaceholder')}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('children.lastName')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('children.lastNamePlaceholder')}
                  disabled={isLoading}
                  required
                />
              </div>
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
                required
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
                  <SelectValue placeholder={t('children.selectGenderPlaceholder')} />
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
            <Button type="submit" disabled={isLoading || !firstName || !lastName || !dateOfBirth || !gender}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editChild ? t('common.save') : t('common.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
