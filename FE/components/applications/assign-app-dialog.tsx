'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
import { mockChildren } from '@/lib/mock-data'
import type { Application, Child } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface AssignAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: Application
  onAssign: (childId: string, timeLimit: number) => void
  assignedChildIds: string[]
}

export function AssignAppDialog({ 
  open, 
  onOpenChange, 
  app, 
  onAssign,
  assignedChildIds 
}: AssignAppDialogProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [hasTimeLimit, setHasTimeLimit] = useState(false)
  const [timeLimit, setTimeLimit] = useState(30)

  const availableChildren = mockChildren.filter(c => !assignedChildIds.includes(c.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedChild) {
      toast.error('Molimo odaberite dijete')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onAssign(selectedChild, hasTimeLimit ? timeLimit : 0)
    
    toast.success('Aplikacija uspješno dodijeljena')
    setIsLoading(false)
    onOpenChange(false)
    setSelectedChild('')
    setHasTimeLimit(false)
    setTimeLimit(30)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('children.assignApps')}</DialogTitle>
          <DialogDescription>
            Dodijelite &quot;{app.name}&quot; djetetu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('statistics.selectChild')}</Label>
              <Select 
                value={selectedChild} 
                onValueChange={setSelectedChild}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite dijete" />
                </SelectTrigger>
                <SelectContent>
                  {availableChildren.map(child => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableChildren.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sve djece već imaju ovu aplikaciju
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('applications.timeLimit')}</Label>
                <p className="text-xs text-muted-foreground">
                  Ograničite dnevno vrijeme korištenja
                </p>
              </div>
              <Switch 
                checked={hasTimeLimit} 
                onCheckedChange={setHasTimeLimit}
                disabled={isLoading}
              />
            </div>

            {hasTimeLimit && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('applications.dailyLimit')}</Label>
                  <span className="text-sm font-medium">{timeLimit} min</span>
                </div>
                <Slider
                  value={[timeLimit]}
                  onValueChange={([value]) => setTimeLimit(value)}
                  min={5}
                  max={120}
                  step={5}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>120 min</span>
                </div>
              </div>
            )}
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
            <Button 
              type="submit" 
              disabled={isLoading || availableChildren.length === 0}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('children.assignApps')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
