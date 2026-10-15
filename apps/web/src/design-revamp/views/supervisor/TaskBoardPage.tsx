import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import {
  useSupervisorDashboardV2,
  useSupervisorReportsV2,
} from '@/design-revamp/hooks/useV2';
import { ReportDetailDialog } from '@/design-revamp/components/composites/ReportDetailDialog';
import {
  canAssignV2Status,
  formatV2Status,
  v2StatusTone,
} from '@/design-revamp/components/composites/V2Status';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { RoleErrorBanner } from '@/design-revamp/components/feedback/RoleErrorBanner';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldAlert,
  ClipboardList,
  Users,
  UserPlus,
  Home,
  Inbox,
  RefreshCw,
  LogOut,
  MapPin,
  CheckCircle2,
  CircleUserRound,
  Send,
} from 'lucide-react';

const STATUS_FILTERS = [
  'All',
  'submitted',
  'assigned',
  'accepted_by_cleaner',
  'in_progress',
  'resolved_by_cleaner',
  'endorsed_by_supervisor',
  'rejected_by_cleaner',
  'rejected_by_supervisor',
];

export default function SupervisorTaskBoardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const dashboard = useSupervisorDashboardV2();
  const reportsQuery = useSupervisorReportsV2(statusFilter === 'All' ? undefined : statusFilter);

  const summary = dashboard.data?.summary;
  const reports = reportsQuery.data?.reports ?? [];

  const pendingCount = (summary?.submitted ?? 0) + (summary?.rejected_by_cleaner ?? 0);
  const inProgressCount =
    (summary?.assigned ?? 0) + (summary?.accepted_by_cleaner ?? 0) + (summary?.in_progress ?? 0);
  const awaitingReview = summary?.resolved_by_cleaner ?? 0;
  const resolvedCount = (summary?.endorsed_by_supervisor ?? 0) + (summary?.closed ?? 0);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/supervisor/tasks', label: 'Triage Board', icon: ClipboardList },
    { to: '/supervisor/dispatch', label: 'Dispatch', icon: Send },
    { to: '/supervisor/reviews', label: 'Reviews', icon: Inbox, badge: awaitingReview },
    { to: '/supervisor/workforce', label: 'Workforce Roster', icon: Users },
    { to: '/supervisor/onboard', label: 'Onboard Staff', icon: UserPlus },
    { to: '/supervisor/account', label: 'Account', icon: CircleUserRound },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 font-bold">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Operations</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Supervisor Desk</span>
            </div>
          </div>
          <nav className="flex max-w-[55vw] items-center gap-1 overflow-x-auto" aria-label="Supervisor navigation">
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
                  {!!item.badge && item.badge > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{user?.name}</span>
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
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Incident Dispatch & Triage</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Review verified community complaints and assign active field cleaners to open zones.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dashboard.refetch();
                reportsQuery.refetch();
              }}
              disabled={reportsQuery.isLoading}
              className="gap-1.5 text-xs active:scale-[0.98]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reportsQuery.isLoading ? 'animate-spin' : ''}`} />
              Refresh Board
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-5">
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Pending Triage</span>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{dashboard.isLoading ? '…' : pendingCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">In Progress</span>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{dashboard.isLoading ? '…' : inProgressCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Awaiting Review</span>
              <p className="text-2xl font-bold text-violet-600 mt-0.5">{dashboard.isLoading ? '…' : awaitingReview}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Resolved Total</span>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{dashboard.isLoading ? '…' : resolvedCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b pb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.98] ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {st === 'All' ? 'All' : formatV2Status(st)}
            </button>
          ))}
        </div>

        {reportsQuery.isLoading && <PageLoader />}
        {reportsQuery.isError && <ErrorState onRetry={() => reportsQuery.refetch()} />}
        {!reportsQuery.isLoading && (
          <RoleErrorBanner
            errors={[dashboard.error, reportsQuery.error]}
            expectedRole="supervisor"
            onReconnect={() => {
              dashboard.refetch();
              reportsQuery.refetch();
            }}
          />
        )}
        {!reportsQuery.isLoading && !reportsQuery.isError && reports.length === 0 && (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            title="No reports matching filter"
            description="Adjust the filter criteria above or wait for new reports from the community."
          />
        )}
        {!reportsQuery.isLoading && !reportsQuery.isError && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className="flex w-full flex-col gap-2 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-foreground">{report.title}</h3>
                    <Badge variant="outline" className={`text-[11px] ${v2StatusTone(report.status)}`}>
                      {formatV2Status(report.status)}
                    </Badge>
                    {canAssignV2Status(report.status) && (
                      <span className="text-[11px] font-medium text-primary">Tap to assign →</span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{report.location_address || 'Location not specified'}</span>
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">{report.id}</p>
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      {selectedReportId && (
        <ReportDetailDialog
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
}
