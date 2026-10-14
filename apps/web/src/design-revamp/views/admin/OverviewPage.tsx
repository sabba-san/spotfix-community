import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useSupervisorDashboardV2 } from '@/design-revamp/hooks/useV2';
import { formatV2Status, v2StatusTone } from '@/design-revamp/components/composites/V2Status';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
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
  Activity,
  CheckCircle2,
  Users,
  Server,
  CircleUserRound,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data, isLoading, isError, refetch } = useSupervisorDashboardV2();

  const summary = data?.summary ?? {};
  const recent = data?.recent_reports ?? [];

  const activeCount =
    (summary.submitted ?? 0) +
    (summary.assigned ?? 0) +
    (summary.accepted_by_cleaner ?? 0) +
    (summary.in_progress ?? 0);
  const awaitingReview = summary.resolved_by_cleaner ?? 0;
  const resolvedCount = (summary.endorsed_by_supervisor ?? 0) + (summary.closed ?? 0);
  const rejectedCount = (summary.rejected_by_cleaner ?? 0) + (summary.rejected_by_supervisor ?? 0);

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
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Admin Administration</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive active:scale-[0.98]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Community Health & Infrastructure Overview</h1>
            <p className="mt-1 text-xs text-muted-foreground">Operational metrics across all roles, pulled live from the v2 pipeline.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active Reports</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{isLoading ? '…' : activeCount}</p>
            <span className="text-[11px] text-muted-foreground">Awaiting action</span>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Awaiting Review</span>
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-violet-600 mt-2">{isLoading ? '…' : awaitingReview}</p>
            <span className="text-[11px] text-muted-foreground">Cleaner resolutions</span>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Resolved</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{isLoading ? '…' : resolvedCount}</p>
            <span className="text-[11px] text-muted-foreground">Endorsed completions</span>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Rejected</span>
              <Server className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">{isLoading ? '…' : rejectedCount}</p>
            <span className="text-[11px] text-muted-foreground">Declined / sent back</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Recent Incidents Log</h2>
          {isLoading && <PageLoader />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && recent.length === 0 && (
            <p className="text-xs text-muted-foreground">No reports recorded yet.</p>
          )}
          {!isLoading && !isError && recent.length > 0 && (
            <div className="space-y-2.5">
              {recent.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">{r.title}</span>
                    <span className="text-muted-foreground ml-2">({r.location_address || 'Campus'})</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${v2StatusTone(r.status)}`}>
                    {formatV2Status(r.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
