'use client'

import { useState } from 'react'
import { useTranslation } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
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
import type { Application, Child } from '@/lib/types'

const MIN_LIMIT = 5
const MAX_LIMIT = 120

interface AssignAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: Application
  onAssign: (childId: string, timeLimit: number) => Promise<void>
  availableChildren: Child[]
}

export function AssignAppDialog({
  open,
  onOpenChange,
  app,
  onAssign,
  availableChildren,
}: AssignAppDialogProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [hasTimeLimit, setHasTimeLimit] = useState(false)
  const [timeLimit, setTimeLimit] = useState(30)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChild) return

    setIsLoading(true)
    try {
      const clampedLimit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, timeLimit))
      await onAssign(selectedChild, hasTimeLimit ? clampedLimit : 0)
      onOpenChange(false)
      setSelectedChild('')
      setHasTimeLimit(false)
      setTimeLimit(30)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('children.assignApps')}</DialogTitle>
          <DialogDescription>
            {t('applications.assignToChild', { name: app.name })}
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
                  <SelectValue placeholder={t('applications.selectChildPlaceholder')} />
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
                  {t('applications.allChildrenHaveApp')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('applications.timeLimit')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('applications.limitSwitchDesc')}
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
                <div className="flex items-center justify-between gap-3">
                  <Label>{t('applications.dailyLimit')}</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={MIN_LIMIT}
                      max={MAX_LIMIT}
                      step={5}
                      value={timeLimit}
                      onChange={e => {
                        const raw = Number(e.target.value)
                        if (!Number.isNaN(raw)) setTimeLimit(raw)
                      }}
                      onBlur={() => setTimeLimit(v => Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, v)))}
                      disabled={isLoading}
                      className="h-8 w-16 text-right"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <Slider
                  value={[Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, timeLimit))]}
                  onValueChange={([value]) => setTimeLimit(value)}
                  min={MIN_LIMIT}
                  max={MAX_LIMIT}
                  step={5}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{MIN_LIMIT} min</span>
                  <span>{MAX_LIMIT} min</span>
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
              disabled={isLoading || availableChildren.length === 0 || !selectedChild}
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
