'use client'

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
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { locale, setLocale } = useLanguage()

  const handleSave = () => {
    toast.success(t('settings.saveSuccess'))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('settings.general')}
        description="Upravljajte postavkama vašeg računa"
      />

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>
            Vaše osobne informacije
          </CardDescription>
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
                  {user?.role === 'admin' ? 'Administrator' : 'Roditelj/Staratelj'}
                </Badge>
                {user?.createdAt && (
                  <Badge variant="outline">
                    <Calendar className="mr-1 h-3 w-3" />
                    Član od {new Date(user.createdAt).toLocaleDateString('bs-BA')}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline">Promijeni sliku</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t('auth.fullName')}</Label>
              <Input id="name" defaultValue={user?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" defaultValue={user?.email} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.language')}</CardTitle>
          <CardDescription>
            Odaberite jezik sučelja
          </CardDescription>
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

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Promjena lozinke</CardTitle>
          <CardDescription>
            Ažurirajte vašu lozinku za pristup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Trenutna lozinka</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div />
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova lozinka</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potvrdi novu lozinku</Label>
              <Input id="confirmPassword" type="password" />
            </div>
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
