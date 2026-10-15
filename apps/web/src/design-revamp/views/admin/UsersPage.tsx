import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useUsers } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Users2,
  UserPlus,
  KeyRound,
  RefreshCw,
  LogOut,
  Search,
  CircleUserRound,
  Home,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// v1 serialized user: {_id, name, idNumber, email?, phone?, workLocation?,
// role: 'public'|'supervisor'|'cleaner', status, ...}
interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  workLocation?: string;
  idNumber: string;
  status: string;
  role: 'public' | 'supervisor' | 'cleaner';
}

function roleLabel(u: AdminUser): string {
  if (u.role === 'supervisor') return 'Supervisor';
  if (u.role === 'cleaner') return 'Cleaner';
  return 'Public';
}

const ROLE_STYLE: Record<string, string> = {
  Admin: 'border-indigo-300 bg-indigo-50 text-indigo-700',
  Supervisor: 'border-teal-300 bg-teal-50 text-teal-700',
  Cleaner: 'border-amber-300 bg-amber-50 text-amber-700',
  Public: 'border-slate-300 bg-slate-50 text-slate-700',
};

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  // Master sessions stay on the v1 API by design: live directory from
  // GET /users (master role allowed). Role changes for existing accounts
  // are done by provisioning a new account via Onboarding.
  const usersQuery = useUsers();

  const users = (Array.isArray(usersQuery.data) ? usersQuery.data : []) as AdminUser[];
  const q = applied.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.idNumber.toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q),
      )
    : users;

  const publicCount = users.filter((u) => u.role === 'public').length;
  const supervisorCount = users.filter((u) => u.role === 'supervisor').length;
  const cleanerCount = users.filter((u) => u.role === 'cleaner').length;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
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
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Admin Administration</span>
            </div>
          </div>
          <nav className="flex max-w-[55vw] items-center gap-1 overflow-x-auto" aria-label="Admin navigation">
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

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">User Directory</h1>
            <p className="mt-1 text-xs text-muted-foreground">Search accounts across all roles. {users.length} total ({publicCount} public · {supervisorCount} supervisors · {cleanerCount} cleaners).</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="gradient-bg text-white gap-1.5">
              <Link to="/admin/onboard"><UserPlus className="h-4 w-4" />Provision Staff</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()} disabled={usersQuery.isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${usersQuery.isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(search.trim().toLowerCase()); }}>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or ID…"
              aria-label="Search users"
              className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Search</Button>
        </form>

        {usersQuery.isLoading && <PageLoader />}
        {usersQuery.isError && <ErrorState onRetry={() => usersQuery.refetch()} />}
        {!usersQuery.isLoading && !usersQuery.isError && filtered.length === 0 && (
          <EmptyState icon={<Users2 className="h-8 w-8 text-muted-foreground" />} title="No users match search" description="Adjust your search or provision a new account." />
        )}
        {!usersQuery.isLoading && !usersQuery.isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((u) => {
              const role = roleLabel(u);
              return (
                <div key={u._id} className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm">{u.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">ID: {u.idNumber}</p>
                    </div>
                    <Badge variant="outline" className={`text-[11px] ${ROLE_STYLE[role] ?? ROLE_STYLE.Public}`}>{role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email ?? 'No email on file'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[u.phone, u.workLocation].filter(Boolean).join(' · ') || 'No contact details on file'}
                  </p>
                  <div className="flex items-center gap-1.5 border-t pt-2">
                    <span className="text-[11px] text-muted-foreground">
                      Status: <span className="font-medium capitalize">{u.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!usersQuery.isLoading && !usersQuery.isError && filtered.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            To change someone's role, provision a new account from{' '}
            <Link to="/admin/onboard" className="font-medium text-primary hover:underline">
              Onboarding
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}
