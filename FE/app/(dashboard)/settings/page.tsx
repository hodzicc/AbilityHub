'use client'

import { useState } from 'react'
import { useAuth, useTranslation, useLanguage } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { locales, localeNames } from '@/lib/i18n/config'
import type { Language } from '@/lib/types'
import { toast } from 'sonner'
import { User, Mail, Shield, Calendar, Loader2 } from 'lucide-react'
import { apiUpdateProfile } from '@/lib/api'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { locale, setLocale } = useLanguage()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!user || !firstName || !lastName) return
    setIsSaving(true)
    try {
      await apiUpdateProfile(user.id, { firstName, lastName })
      toast.success(t('settings.saveSuccess'))
    } catch {
      toast.error(t('settings.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings.general')}
        description={t('settings.generalDesc')}
      />

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.profile')}
          </CardTitle>
          <CardDescription>{t('settings.profileDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 mx-auto sm:mx-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="secondary">
                  <Shield className="mr-1 h-3 w-3" />
                  {user?.role === 'admin' ? t('admin.roles.admin') : t('admin.roles.parent')}
                </Badge>
                {user?.createdAt && (
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    {t('settings.memberSince', { date: new Date(user.createdAt).toLocaleDateString(locale === 'bs' ? 'bs-BA' : 'en-US') })}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('children.firstName')}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('children.lastName')}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">
                <Mail className="inline mr-1 h-3 w-3" />
                {t('auth.email')}
              </Label>
              <Input id="email" type="email" value={user?.email ?? ''} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
          <CardDescription>{t('settings.languageDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select value={locale} onValueChange={(value) => setLocale(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map(loc => (
                  <SelectItem key={loc} value={loc}>
                    {localeNames[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
