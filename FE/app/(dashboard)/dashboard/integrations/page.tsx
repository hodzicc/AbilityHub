'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockApplications, mockIntegrationEvents } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileJson,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'

const statusMeta = {
  ready: {
    label: 'Spremno',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  'in-progress': {
    label: 'U izradi',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  'needs-adapter': {
    label: 'Treba adapter',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
}

const architectureItems = [
  {
    title: 'Centralizovana prijava',
    description: 'Jedan nalog za roditelja/staratelja i dijete, uz role-based pristup web i mobilnim aplikacijama.',
    icon: KeyRound,
    done: true,
  },
  {
    title: 'Jedinstveni profil djeteta',
    description: 'Aplikacije čitaju isti skup osnovnih podataka, ograničenja, dozvola i UI preferencija.',
    icon: Database,
    done: true,
  },
  {
    title: 'Standardizovani događaji',
    description: 'Korištenje, napredak, dostignuća i preporuke mapiraju se u zajedničke data contracte.',
    icon: FileJson,
    done: true,
  },
  {
    title: 'Audit i privatnost',
    description: 'Svaka promjena aplikacije, limita ili preferencije ostaje vidljiva administratoru sistema.',
    icon: ShieldCheck,
    done: false,
  },
]

export default function IntegrationsPage() {
  const readyCount = mockApplications.filter(app => app.integrationStatus === 'ready').length
  const progress = Math.round((readyCount / mockApplications.length) * 100)
  const ssoCount = mockApplications.filter(app => app.authMethod === 'SSO').length
  const contractsCount = new Set(mockApplications.flatMap(app => app.dataContract ?? [])).size

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integracije ekosistema"
        description="Plan, status i validacija povezivanja web portala sa referentnim web i mobilnim aplikacijama."
      >
        <Button asChild>
          <Link href="/dashboard/applications">
            Katalog aplikacija
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integracijska spremnost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{progress}%</div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SSO aplikacije</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssoCount}/{mockApplications.length}</div>
            <p className="text-sm text-muted-foreground">koriste centralizovanu prijavu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data contracti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractsCount}</div>
            <p className="text-sm text-muted-foreground">standardizovanih tipova podataka</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zadnja sinhronizacija</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">08:43</div>
            <p className="text-sm text-muted-foreground">danas, preferencije i aktivnosti</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status aplikacija</CardTitle>
            <CardDescription>
              Pregled spremnosti aplikacija za centralizovanu autentifikaciju, sinhronizaciju i izvještavanje.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aplikacija</TableHead>
                  <TableHead>Platforma</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockApplications.map(app => {
                  const meta = statusMeta[app.integrationStatus ?? 'in-progress']

                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Link href={`/dashboard/applications/${app.id}`} className="font-medium hover:text-primary">
                          {app.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{app.apiVersion}</div>
                      </TableCell>
                      <TableCell className="capitalize">{app.platform}</TableCell>
                      <TableCell>{app.authMethod}</TableCell>
                      <TableCell>
                        <Badge className={cn('border-0', meta.className)}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>{app.syncFrequency}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arhitekturni model</CardTitle>
            <CardDescription>
              Elementi koji dokazuju da platforma nije vezana za jednu aplikaciju, nego za proširiv ekosistem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {architectureItems.map(item => (
              <div key={item.title} className="flex gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Standardizovani format podataka</CardTitle>
            <CardDescription>
              Minimalni payload koji referentne aplikacije šalju prema centralnoj platformi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
{`{
  "childId": "child-1",
  "appId": "app-5",
  "eventType": "activity_result",
  "durationSeconds": 420,
  "score": 86,
  "metadata": {
    "module": "morning-routine",
    "completedSteps": 5,
    "recommendedNext": "repeat_after_2_days"
  },
  "createdAt": "2026-05-18T08:42:00Z"
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinhronizacijski tok</CardTitle>
            <CardDescription>Najnoviji događaji između centralnog sistema i aplikacija.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockIntegrationEvents.map(event => {
              const app = mockApplications.find(item => item.id === event.appId)
              const Icon = event.status === 'success' ? CheckCircle2 : event.status === 'warning' ? AlertTriangle : RefreshCw

              return (
                <div key={event.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{app?.name}</span>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.message}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validacijski scenariji</CardTitle>
          <CardDescription>
            Tokovi koji su spremni za demonstraciju u magistrarskom radu i kasnije testiranje sa udruženjem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ['Roditelj dodaje aplikaciju', 'Dodjela aplikacije djetetu, postavljanje limita i prikaz u profilu.'],
            ['Preferencije se propagiraju', 'Font, boje, zvuk i kontrast postaju default za povezane aplikacije.'],
            ['Napredak se agregira', 'Različite aplikacije šalju događaje u jedinstveni dashboard i izvještaj.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-lg border p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {title.includes('Preferencije') ? (
                  <Smartphone className="h-4 w-4" />
                ) : title.includes('Napredak') ? (
                  <Activity className="h-4 w-4" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
