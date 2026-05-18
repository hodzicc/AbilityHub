'use client'

import { useTranslation, usePreferences } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Bell, Mail, Trophy, Clock, BarChart3 } from 'lucide-react'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const { notifications, updateNotifications } = usePreferences()

  const handleSave = () => {
    toast.success(t('settings.saveSuccess'))
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('settings.notifications')}
        description="Upravljajte obavještenjima i izvještajima"
      />

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Izvještaji
          </CardTitle>
          <CardDescription>
            Primajte redovne izvještaje o napretku i korištenju
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {t('settings.dailyReport')}
              </Label>
              <p className="text-xs text-muted-foreground">
                Primite dnevni pregled aktivnosti svakog dana u 20:00
              </p>
            </div>
            <Switch 
              checked={notifications.dailyReport}
              onCheckedChange={(checked) => updateNotifications({ dailyReport: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {t('settings.weeklyReport')}
              </Label>
              <p className="text-xs text-muted-foreground">
                Primite sedmični izvještaj svake nedjelje
              </p>
            </div>
            <Switch 
              checked={notifications.weeklyReport}
              onCheckedChange={(checked) => updateNotifications({ weeklyReport: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upozorenja
          </CardTitle>
          <CardDescription>
            Real-time obavještenja o aktivnostima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                {t('settings.achievementAlerts')}
              </Label>
              <p className="text-xs text-muted-foreground">
                Obavještenja kada dijete postigne novo dostignuće
              </p>
            </div>
            <Switch 
              checked={notifications.achievementAlerts}
              onCheckedChange={(checked) => updateNotifications({ achievementAlerts: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                {t('settings.timeLimitAlerts')}
              </Label>
              <p className="text-xs text-muted-foreground">
                Obavještenja kada dijete dostigne dnevno vremensko ograničenje
              </p>
            </div>
            <Switch 
              checked={notifications.timeLimitAlerts}
              onCheckedChange={(checked) => updateNotifications({ timeLimitAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email obavještenja
          </CardTitle>
          <CardDescription>
            Primajte obavještenja putem emaila
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.emailNotifications')}</Label>
              <p className="text-xs text-muted-foreground">
                Primite sva obavještenja i izvještaje na vašu email adresu
              </p>
            </div>
            <Switch 
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => updateNotifications({ emailNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
