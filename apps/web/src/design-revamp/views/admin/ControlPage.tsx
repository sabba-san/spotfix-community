import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { createMasterAccount, createReportV2, listUsers } from '@/design-revamp/lib/api';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Users2,
  UserPlus,
  KeyRound,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CircleUserRound,
  FilePlus2,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ROLE_CARDS = [
  { role: 'Public', desc: 'Submit and track own reports', tone: 'border-slate-300 bg-slate-50 text-slate-700' },
  { role: 'Supervisor', desc: 'Triage, assign cleaners, endorse resolutions', tone: 'border-teal-300 bg-teal-50 text-teal-700' },
  { role: 'Cleaner', desc: 'Accept tasks, submit resolution evidence', tone: 'border-amber-300 bg-amber-50 text-amber-700' },
  { role: 'Admin', desc: 'Provision users, create master accounts', tone: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
];

export default function AdminControlPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [masterBusy, setMasterBusy] = useState(false);
  const [masterMsg, setMasterMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [reportPriority, setReportPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMsg, setReportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [users, setUsers] = useState<Array<{ _id: string; name: string; role: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);

  async function handleCreateMaster(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || password.length < 6 || password !== confirm) return;
    setMasterBusy(true);
    setMasterMsg(null);
    try {
      await createMasterAccount({ username: username.trim(), name: displayName.trim(), password });
      setMasterMsg({ ok: true, text: 'Master account created.' });
      setUsername(''); setDisplayName(''); setPassword(''); setConfirm('');
    } catch (err) {
      setMasterMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to create master account' });
    } finally {
      setMasterBusy(false);
    }
  }

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (reportTitle.trim().length < 3) return;
    setReportBusy(true);
    setReportMsg(null);
    try {
      await createReportV2({
        title: reportTitle.trim(),
        description: reportDesc.trim() || undefined,
        location_address: reportLocation.trim() || undefined,
        priority: reportPriority,
      });
      setReportMsg({ ok: true, text: 'Report created and broadcast to supervisors.' });
      setReportTitle(''); setReportDesc(''); setReportLocation('');
    } catch (err) {
      setReportMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to create report' });
    } finally {
      setReportBusy(false);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError(false);
    try {
      const data = await listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsersError(true);
    } finally {
      setUsersLoading(false);
    }
  }

  const navLinks = [
    { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users2 },
    { to: '/admin/onboard', label: 'Onboarding', icon: UserPlus },
    { to: '/admin/control', label: 'Control', icon: KeyRound },
    { to: '/admin/account', label: 'Account', icon: CircleUserRound },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 font-bold">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Control Room</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Master Control</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{user?.name} (Admin)</span>
            <Button variant="ghost" size="sm" onClick={logout} className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive active:scale-[0.98]">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Master Control</h1>
          <p className="mt-1 text-xs text-muted-foreground">Role catalog, master account creation, and report creation on behalf of the community.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLE_CARDS.map((r) => (
            <div key={r.role} className="rounded-xl border bg-card p-3">
              <Badge variant="outline" className={`text-[11px] ${r.tone}`}>{r.role}</Badge>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>

        <Card className="border border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-indigo-600" />Create Master Account</CardTitle>
          </CardHeader>
          <CardContent>
            {masterMsg && (
              <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2.5 text-xs ${masterMsg.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}>
                {masterMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {masterMsg.text}
              </div>
            )}
            <form onSubmit={handleCreateMaster} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required aria-label="Master username"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" required aria-label="Master display name"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" required minLength={6} aria-label="Master password"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required aria-label="Confirm master password"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <Button type="submit" disabled={masterBusy || password !== confirm} className="sm:col-span-2 min-h-11">
                {masterBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />}
                Create Master Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><FilePlus2 className="h-4 w-4 text-primary" />Create Report (on behalf)</CardTitle>
          </CardHeader>
          <CardContent>
            {reportMsg && (
              <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2.5 text-xs ${reportMsg.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}>
                {reportMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {reportMsg.text}
              </div>
            )}
            <form onSubmit={handleCreateReport} className="space-y-3">
              <input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Report title (min 3 chars)" required minLength={3} aria-label="Report title"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Description (optional)" rows={2} maxLength={4000} aria-label="Report description"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={reportLocation} onChange={(e) => setReportLocation(e.target.value)} placeholder="Location (optional)" aria-label="Report location"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <select value={reportPriority} onChange={(e) => setReportPriority(e.target.value as 'low' | 'medium' | 'high')} aria-label="Report priority"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <Button type="submit" disabled={reportBusy || reportTitle.trim().length < 3} className="min-h-11">
                {reportBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-1.5 h-4 w-4" />}
                Create Report
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Directory Snapshot</CardTitle>
            <Button size="sm" variant="outline" onClick={loadUsers} disabled={usersLoading}>
              {usersLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load users'}
            </Button>
          </CardHeader>
          <CardContent>
            {usersError && <ErrorState onRetry={loadUsers} />}
            {!usersLoading && !usersError && users.length === 0 && (
              <p className="text-xs text-muted-foreground">No users loaded yet.</p>
            )}
            {users.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {users.slice(0, 12).map((u) => (
                  <div key={u._id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                    <span className="font-medium">{u.name}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
