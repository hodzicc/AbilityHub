'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth, useTranslation } from '@/components/providers'
import { PageHeader } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, Search, ShieldAlert, ShieldCheck, Users, UserPlus, Loader2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  apiGetAllUsers,
  apiGetApps,
  apiCreateUser,
  type UserProfileResponse,
} from '@/lib/api'

interface NewUserForm {
  firstName: string
  lastName: string
  email: string
  password: string
  roleId: '1' | '2'   // Admin=1, Parent=2
}

const EMPTY_FORM: NewUserForm = {
  firstName: '', lastName: '', email: '', password: '', roleId: '2',
}

export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserProfileResponse[]>([])
  const [appsCount, setAppsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [isCreating, setIsCreating] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, appsData] = await Promise.all([
        apiGetAllUsers(1, 100),
        apiGetApps(true),
      ])
      setUsers(usersData.items)
      setAppsCount(appsData.length)
    } catch {
      toast.error('Greška pri učitavanju podataka')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadData()
  }, [user?.role])

  const filteredUsers = useMemo(() => {
    const normalized = query.toLowerCase()
    return users.filter(item =>
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(normalized) ||
      item.email.toLowerCase().includes(normalized)
    )
  }, [query, users])

  const roleLabel = (roleId: number) => {
    if (roleId === 1) return 'Admin'
    if (roleId === 2) return 'Roditelj'
    return 'Dijete'
  }

  const parentCount = users.filter(u => u.roleId === 2).length
  const childCount  = users.filter(u => u.roleId === 3).length

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Popunite sva polja')
      return
    }
    if (form.password.length < 6) {
      toast.error('Lozinka mora imati najmanje 6 karaktera')
      return
    }
    setIsCreating(true)
    try {
      const result = await apiCreateUser({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        roleId:    Number(form.roleId),
      })
      if (!result.success) {
        toast.error(result.message || 'Greška pri kreiranju korisnika')
        return
      }
      toast.success(`Korisnik ${form.firstName} ${form.lastName} uspješno kreiran`)
      setIsCreateOpen(false)
      setForm(EMPTY_FORM)
      await loadData()
    } catch {
      toast.error('Greška pri kreiranju korisnika')
    } finally {
      setIsCreating(false)
    }
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
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Dodaj korisnika
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-400 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Roditelji</CardTitle>
            <Activity className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentCount}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.totalChildProfiles')}</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childCount}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-400 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Aplikacije u registru</CardTitle>
            <ShieldCheck className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Parents & children overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Roditelji i djeca</CardTitle>
          <CardDescription>Pregled roditelja i njihovih dječjih profila.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 bg-muted animate-pulse rounded" />
          ) : users.filter(u => u.roleId === 2).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nema registrovanih roditelja.</p>
          ) : (
            <div className="space-y-2">
              {users.filter(u => u.roleId === 2).map(parent => {
                const children = users.filter(u => u.roleId === 3)
                return (
                  <div key={parent.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-500 text-white text-xs font-semibold">
                          {`${parent.firstName} ${parent.lastName}`.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{parent.firstName} {parent.lastName}</p>
                        <p className="text-xs text-muted-foreground">{parent.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {children.length} {children.length === 1 ? 'dijete' : 'djece'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
          <CardDescription>Pregled svih korisnika sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Pretraži korisnike..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="h-32 bg-muted animate-pulse rounded" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Korisnik</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-semibold">
                            {`${item.firstName} ${item.lastName}`.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{item.firstName} {item.lastName}</div>
                          <div className="text-sm text-muted-foreground">{item.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.roleId === 1 ? 'default' : 'secondary'}>
                        {roleLabel(item.roleId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={item.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0'}
                      >
                        {item.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open) setForm(EMPTY_FORM) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj korisnika</DialogTitle>
            <DialogDescription>
              Kreirajte novi korisnički nalog. Roditeljem se dodjeljuje uloga Roditelja, a privilegovanim korisnicima Administratora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Amina"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Hodžić"
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="amina@example.com"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 karaktera"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>Uloga</Label>
              <Select
                value={form.roleId}
                onValueChange={v => setForm(f => ({ ...f, roleId: v as '1' | '2' }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Roditelj / Staratelj</SelectItem>
                  <SelectItem value="1">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Odustani
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kreiraj korisnika
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
