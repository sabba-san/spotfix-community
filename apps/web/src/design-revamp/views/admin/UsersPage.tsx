import { useState } from 'react';
import { useUsers } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  UserPlus,
  RefreshCw,
  Search,
  Users2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  Supervisor: 'border-teal-300 bg-teal-50 text-teal-700',
  Cleaner: 'border-amber-300 bg-amber-50 text-amber-700',
  Public: 'border-slate-300 bg-slate-50 text-slate-700',
};

export default function AdminUsersPage() {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">User Directory</h1>
            <Badge variant="outline" className="text-xs">
              {users.length} accounts ({publicCount} public · {supervisorCount} sup · {cleanerCount} cln)
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Search and manage accounts across all system roles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-8 gradient-bg text-white gap-1.5 active:scale-[0.98]">
            <Link to="/admin/onboard"><UserPlus className="h-3.5 w-3.5" />Provision Staff</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()} disabled={usersQuery.isLoading} className="h-8 active:scale-[0.98]">
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
    </div>
  );
}