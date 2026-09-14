'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
import { ConfirmationDialog } from '@/components/shared'
import {
  Activity, Search, ShieldAlert, ShieldCheck, Users, UserPlus, Loader2,
  Pencil, Power, PowerOff, ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  apiGetAllUsers,
  apiGetUserSummary,
  apiGetApps,
  apiCreateUser,
  apiUpdateProfile,
  apiActivateUser,
  apiDeactivateUser,
  type UserProfileResponse,
  type UserSummaryResponse,
} from '@/lib/api'
import { ROLE_ID } from '@/lib/constants'

const PAGE_SIZE = 20

interface NewUserForm {
  firstName: string
  lastName: string
  email: string
  password: string
  roleId: string
  guardianId: string
  dateOfBirth: string
  gender: string
}

const EMPTY_FORM: NewUserForm = {
  firstName: '', lastName: '', email: '', password: '', roleId: String(ROLE_ID.PARENT),
  guardianId: '', dateOfBirth: '', gender: 'male',
}

// Only admin/parent rows reach the edit dialog — child rows link to their full
// profile page instead, so this only ever needs name fields.
interface EditUserForm {
  firstName: string
  lastName: string
}

const EMPTY_EDIT_FORM: EditUserForm = { firstName: '', lastName: '' }

export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState<UserProfileResponse[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState<UserSummaryResponse | null>(null)
  const [appsCount, setAppsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [parentOptions, setParentOptions] = useState<UserProfileResponse[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editUser, setEditUser] = useState<UserProfileResponse | null>(null)
  const [editForm, setEditForm] = useState<EditUserForm>(EMPTY_EDIT_FORM)
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [deactivateUser, setDeactivateUser] = useState<UserProfileResponse | null>(null)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Debounce the search box so every keystroke doesn't fire a request; resets to
  // page 1 since the previous page number may not exist in the filtered result set.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Role counts, per-guardian child counts, and app count are computed across the
  // WHOLE directory on the backend — not derived from whichever page is loaded —
  // so they stay correct no matter how many users exist.
  useEffect(() => {
    if (user?.role !== 'admin') return
    Promise.all([apiGetUserSummary(), apiGetApps(true)])
      .then(([summaryData, appsData]) => {
        setSummary(summaryData)
        setAppsCount(appsData.length)
      })
      .catch(() => toast.error(t('admin.loadError')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, reloadKey])

  // The current page of the (server-side-filtered) user table.
  useEffect(() => {
    if (user?.role !== 'admin') return
    setIsLoading(true)
    // includeInactive: this management table shows an Active/Inactive badge and can
    // reactivate deactivated accounts, so it needs to see them (the rest of the app
    // gets active users only by default).
    apiGetAllUsers(page, PAGE_SIZE, search || undefined, undefined, true)
      .then(res => {
        setUsers(res.items)
        setTotalCount(res.totalCount)
      })
      .catch(() => toast.error(t('admin.loadError')))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, page, search, reloadKey])

  // Guardian picker for the "add child" form — fetched once the create dialog opens,
  // since it isn't needed otherwise.
  useEffect(() => {
    if (!isCreateOpen) return
    apiGetAllUsers(1, 100, undefined, ROLE_ID.PARENT)
      .then(res => setParentOptions(res.items))
      .catch(() => setParentOptions([]))
  }, [isCreateOpen])

  const reload = () => setReloadKey(k => k + 1)

  const roleLabel = (roleId: number) => {
    if (roleId === ROLE_ID.ADMIN) return t('admin.roleShort.admin')
    if (roleId === ROLE_ID.PARENT) return t('admin.roleShort.parent')
    return t('admin.roleShort.child')
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(page * PAGE_SIZE, totalCount)

  const isChildRole = form.roleId === String(ROLE_ID.CHILD)

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error(t('admin.requiredFields'))
      return
    }
    if (form.password.length < 6) {
      toast.error(t('admin.passwordTooShort'))
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
        ...(isChildRole ? {
          guardianId: form.guardianId || undefined,
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
          gender: form.gender,
        } : {}),
      })
      if (!result.success) {
        toast.error(result.message || t('admin.createError'))
        return
      }
      toast.success(t('admin.createSuccess', { name: `${form.firstName} ${form.lastName}` }))
      setIsCreateOpen(false)
      setForm(EMPTY_FORM)
      reload()
    } catch {
      toast.error(t('admin.createError'))
    } finally {
      setIsCreating(false)
    }
  }

  const openEdit = (item: UserProfileResponse) => {
    setEditUser(item)
    setEditForm({ firstName: item.firstName, lastName: item.lastName })
  }

  const handleSaveEdit = async () => {
    if (!editUser) return
    if (!editForm.firstName || !editForm.lastName) {
      toast.error(t('admin.requiredNames'))
      return
    }
    setIsEditSaving(true)
    try {
      await apiUpdateProfile(editUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
      })
      toast.success(t('admin.updatedToast'))
      setEditUser(null)
      reload()
    } catch {
      toast.error(t('admin.updateError'))
    } finally {
      setIsEditSaving(false)
    }
  }

  const handleActivate = async (item: UserProfileResponse) => {
    setIsToggling(item.id)
    try {
      await apiActivateUser(item.id)
      toast.success(t('admin.activatedToast', { name: `${item.firstName} ${item.lastName}` }))
      reload()
    } catch {
      toast.error(t('admin.activateError'))
    } finally {
      setIsToggling(null)
    }
  }

  const handleConfirmDeactivate = async () => {
    if (!deactivateUser) return
    setIsToggling(deactivateUser.id)
    try {
      await apiDeactivateUser(deactivateUser.id)
      toast.success(t('admin.deactivatedToast', { name: `${deactivateUser.firstName} ${deactivateUser.lastName}` }))
      setDeactivateUser(null)
      reload()
    } catch {
      toast.error(t('admin.deactivateError'))
      setDeactivateUser(null)
    } finally {
      setIsToggling(null)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.title')} description={t('admin.subtitle')} />
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('admin.accessRestrictedTitle')}</AlertTitle>
          <AlertDescription>
            {t('admin.accessRestrictedDesc')}
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
          {t('admin.addUser')}
        </Button>
      </PageHeader>

      {/* Stats — role counts + app count computed across the whole directory,
          not just whatever page of users happens to be loaded. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-400 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.parents')}</CardTitle>
            <Activity className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.parentCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.totalChildProfiles')}</CardTitle>
            <Users className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.childCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-400 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/80">{t('admin.appsInRegistry')}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-white/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users table — server-side search + pagination, so it stays correct and
          usable regardless of how many users exist. Parent rows show their linked
          child count (from the bulk summary, not a per-parent API call); child rows
          link to their full profile instead of duplicating it in an edit dialog. */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
          <CardDescription>{t('admin.usersOverviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('admin.searchUsersPlaceholder')}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="h-32 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.userColumn')}</TableHead>
                    <TableHead>{t('admin.role')}</TableHead>
                    <TableHead>{t('admin.status')}</TableHead>
                    <TableHead>{t('admin.childrenColumn')}</TableHead>
                    <TableHead className="text-right">{t('admin.actionsColumn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(item => {
                    const isSelf = item.id === user?.id
                    const childCount = summary?.childCountsByGuardian[item.id] ?? 0
                    return (
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
                          <Badge variant={item.roleId === ROLE_ID.ADMIN ? 'default' : 'secondary'}>
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
                        <TableCell>
                          {item.roleId === ROLE_ID.PARENT ? (
                            <Badge variant="secondary" className="text-xs">
                              {childCount} {childCount === 1 ? t('admin.childCountOne') : t('admin.childCountMany')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.roleId === ROLE_ID.CHILD ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title={t('admin.viewProfile')}
                                asChild
                              >
                                <Link href={`/children/${item.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title={t('admin.editUserAction')}
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {!isSelf && (
                              item.isActive ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  title={t('admin.deactivateUser')}
                                  disabled={isToggling === item.id}
                                  onClick={() => setDeactivateUser(item)}
                                >
                                  <PowerOff className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                                  title={t('admin.activateUser')}
                                  disabled={isToggling === item.id}
                                  onClick={() => handleActivate(item)}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t('admin.paginationInfo', { from: String(rangeFrom), to: String(rangeTo), total: String(totalCount) })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    {t('common.next')}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open) setForm(EMPTY_FORM) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.addUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.createUserDialogDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('children.firstName')}</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('children.lastName')}</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder={t('common.emailPlaceholder')}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={t('admin.passwordPlaceholder')}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.role')}</Label>
              <Select
                value={form.roleId}
                onValueChange={v => setForm(f => ({ ...f, roleId: v }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(ROLE_ID.PARENT)}>{t('admin.roleParentOption')}</SelectItem>
                  <SelectItem value={String(ROLE_ID.CHILD)}>{t('admin.roleChildOption')}</SelectItem>
                  <SelectItem value={String(ROLE_ID.ADMIN)}>{t('admin.roleAdminOption')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isChildRole && (
              <>
                <div className="space-y-2">
                  <Label>{t('admin.guardianLabel')}</Label>
                  <Select
                    value={form.guardianId}
                    onValueChange={v => setForm(f => ({ ...f, guardianId: v }))}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.guardianPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {parentOptions.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({p.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="newDob">{t('children.dateOfBirth')}</Label>
                    <Input
                      id="newDob"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('children.gender')}</Label>
                    <Select
                      value={form.gender}
                      onValueChange={v => setForm(f => ({ ...f, gender: v }))}
                      disabled={isCreating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('children.male')}</SelectItem>
                        <SelectItem value="female">{t('children.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('admin.childFieldsHint')}</p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.createUserAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog — admin/parent rows only; child rows link to their full profile instead. */}
      <Dialog open={!!editUser} onOpenChange={open => { if (!open) { setEditUser(null); setEditForm(EMPTY_EDIT_FORM) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.editUser')}</DialogTitle>
            <DialogDescription>
              {editUser && t('admin.editUserDialogDesc', { name: `${editUser.firstName} ${editUser.lastName}`, role: roleLabel(editUser.roleId) })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">{t('children.firstName')}</Label>
                <Input
                  id="editFirstName"
                  value={editForm.firstName}
                  onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                  disabled={isEditSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">{t('children.lastName')}</Label>
                <Input
                  id="editLastName"
                  value={editForm.lastName}
                  onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                  disabled={isEditSaving}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} disabled={isEditSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditSaving}>
              {isEditSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('applications.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate user confirmation */}
      <ConfirmationDialog
        open={!!deactivateUser}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        title={t('admin.deactivateUserTitle')}
        description={deactivateUser
          ? t('admin.deactivateUserConfirm', { name: `${deactivateUser.firstName} ${deactivateUser.lastName}` })
          : ''}
        confirmLabel={t('applications.deactivateAction')}
        variant="destructive"
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  )
}
