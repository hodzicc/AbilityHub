'use client'

import { useMemo, useState } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockApplications, mockChildren, mockUsers } from '@/lib/mock-data'
import type { User } from '@/lib/types'
import { Activity, Search, ShieldAlert, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>(mockUsers)

  const filteredUsers = useMemo(() => {
    const normalized = query.toLowerCase()
    return users.filter(item =>
      item.name.toLowerCase().includes(normalized) ||
      item.email.toLowerCase().includes(normalized) ||
      item.role.toLowerCase().includes(normalized)
    )
  }, [query, users])

  const toggleRole = (id: string) => {
    setUsers(prev => prev.map(item =>
      item.id === id
        ? { ...item, role: item.role === 'admin' ? 'parent' : 'admin' }
        : item
    ))
    toast.success('Uloga korisnika je ažurirana')
  }

  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.title')} description={t('admin.subtitle')} />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Pristup ograničen</AlertTitle>
          <AlertDescription>
            Administracijski panel je dostupan samo korisnicima sa administratorskom ulogom.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.title')} description={t('admin.subtitle')}>
        <Button onClick={() => toast.info('Forma za dodavanje korisnika je spremna za povezivanje sa backendom')}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('admin.addUser')}
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.activeUsers')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(item => item.lastLogin).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.totalChildProfiles')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockChildren.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Povezane aplikacije</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockApplications.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
          <CardDescription>
            Administratori mogu pregledati roditelje/staratelje, mijenjati uloge i pripremiti naloge za buduće povezivanje sa backendom.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pretraži korisnike..."
              className="pl-9"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Korisnik</TableHead>
                <TableHead>{t('admin.role')}</TableHead>
                <TableHead>{t('admin.lastLogin')}</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{item.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>
                      {t(`admin.roles.${item.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString('bs-BA') : 'Nikad'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleRole(item.id)}>
                      Promijeni ulogu
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
