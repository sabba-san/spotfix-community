import { useState } from 'react';
import { MapPin, FileText, RefreshCw, AlertCircle, CheckCircle2, Clock, Users, ArrowRight, Send, ClipboardList, Inbox, ClipboardCheck, ShieldCheck, UserPlus } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useMyReports, usePublicStatusBoard } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ReportRow } from '@/design-revamp/components/composites/ReportRow';
import { filterReportsByMetric, CleanerCard, type MetricId } from '@/design-revamp/components/composites/StatusBoard';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: myReports, isLoading: isLoadingMyReports, isError, refetch } = useMyReports(user?.id);
  const { data: statusBoard, refetch: refetchStatus } = usePublicStatusBoard();

  const summary = statusBoard?.summary || {
    total: 0,
    open: 0,
    resolved: 0,
    pending: 0,
    urgent: 0,
    cleaners: 0,
    availableCleaners: 0,
    busyCleaners: 0,
  };
  const publicReports = Array.isArray(statusBoard?.reports) ? statusBoard.reports! : [];
  const cleaners = Array.isArray(statusBoard?.cleaners) ? statusBoard.cleaners! : [];
  const displayReports = user ? (myReports || []).slice(0, 6) : publicReports.slice(0, 6);

  const metrics: { id: MetricId; label: string; value: number; color: string; icon: typeof Clock }[] = [
    { id: 'pending', label: 'Pending', value: summary.pending, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
    { id: 'urgent', label: 'Urgent', value: summary.urgent, color: 'text-rose-600 dark:text-rose-400', icon: AlertCircle },
    { id: 'cleaners', label: 'Cleaners', value: (summary.availableCleaners || 0) + (summary.busyCleaners || 0), color: 'text-blue-600 dark:text-blue-400', icon: Users },
    { id: 'open', label: 'Open', value: summary.open, color: 'text-indigo-600 dark:text-indigo-400', icon: MapPin },
    { id: 'resolved', label: 'Resolved', value: summary.resolved, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    { id: 'total', label: 'Total', value: summary.total, color: 'text-foreground', icon: FileText },
  ];

  // Active filter for the inline community status section
  const [statusFilter, setStatusFilter] = useState<MetricId>('total');

  // Staff workspace shortcuts — supervisors land on /dashboard after login,
  // so surface their operational pages here instead of hiding them in
  // role-only nav bars.
  const workspaceLinks =
    user?.role === 'supervisor'
      ? [
          { to: '/supervisor/dispatch', label: 'Dispatch Desk', desc: 'Approve & assign jobs', icon: Send, primary: true },
          { to: '/supervisor/tasks', label: 'Triage Board', desc: 'Review reports', icon: ClipboardList, primary: false },
          { to: '/supervisor/reviews', label: 'Reviews', desc: 'Endorse resolutions', icon: Inbox, primary: false },
          { to: '/supervisor/workforce', label: 'Workforce', desc: 'Cleaner roster', icon: Users, primary: false },
        ]
      : user?.role === 'cleaner'
        ? [
            { to: '/cleaner/tasks', label: 'My Tasks', desc: 'Assigned & available jobs', icon: ClipboardCheck, primary: true },
          ]
        : user?.role === 'master'
          ? [
              { to: '/admin/overview', label: 'Control Room', desc: 'Overview & metrics', icon: ShieldCheck, primary: true },
              { to: '/admin/users', label: 'User Directory', desc: 'Totals & roles', icon: Users, primary: false },
              { to: '/admin/onboard', label: 'Onboarding', desc: 'Provision staff', icon: UserPlus, primary: false },
            ]
          : [];

  return (
    <div className="space-y-6">
      {/* Civic Greeting Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Community Incident Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user
                ? 'Report civic infrastructure issues and track live resolutions in real time.'
                : 'Live overview of active reports, cleaner deployments, and community maintenance.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {user && (
              <Button asChild className="gradient-bg shadow-accent hover:brightness-110 active:scale-[0.98]">
                <Link to="/submit" className="gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Submit Issue
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                refetch();
                refetchStatus();
              }}
              title="Refresh dashboard data"
              className="active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Staff workspace shortcuts (supervisor / cleaner / master only) */}
      {workspaceLinks.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">Your Workspace</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Jump straight into your operational pages.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {workspaceLinks.map((item) => (
              <Button
                key={item.to}
                asChild
                variant={item.primary ? 'default' : 'outline'}
                className="h-auto min-h-11 justify-start gap-2.5 px-3.5 py-2.5 active:scale-[0.98]"
              >
                <Link to={item.to}>
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className={`text-[11px] font-normal ${item.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {item.desc}
                    </span>
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 6-Metric Civic Grid with inline community status filtering */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((s) => {
          const Icon = s.icon;
          const isActive = statusFilter === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              aria-pressed={isActive}
              aria-label={isActive ? `Filtering by ${s.label}` : `Show ${s.label}`}
              className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98] text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color} opacity-80`} />
              </div>
              <p className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${s.color}`}>
                {(s.value || 0).toLocaleString()}
              </p>
              {isActive && (
                <div className="mt-2 h-0.5 bg-primary/60 rounded-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Inline community status section */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Community status: {metrics.find((m) => m.id === statusFilter)?.label ?? 'Total'} reports
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {statusBoard?.generatedAt
                ? `Updated ${new Date(statusBoard.generatedAt).toLocaleString()}`
                : 'Live data'}
            </p>
          </div>
        </div>

        {statusFilter === 'cleaners' ? (
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Busy cleaners</h3>
                    <p className="text-xs text-muted-foreground">Currently handling an active report.</p>
                  </div>
                  <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                    {cleaners.filter((c: any) => c.status === 'Busy').length}
                  </span>
                </div>
                {cleaners.filter((c: any) => c.status === 'Busy').length === 0 ? (
                  <EmptyState title="Nothing to show yet" description="All cleaners are currently available." className="p-6 bg-muted/20" />
                ) : (
                  <div className="space-y-3">
                    {cleaners.filter((c: any) => c.status === 'Busy').map((cleaner: any) => (
                      <CleanerCard key={cleaner._id || cleaner.id} cleaner={cleaner} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Available cleaners</h3>
                    <p className="text-xs text-muted-foreground">Ready for the next assignment.</p>
                  </div>
                  <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    {cleaners.filter((c: any) => c.status !== 'Busy').length}
                  </span>
                </div>
                {cleaners.filter((c: any) => c.status !== 'Busy').length === 0 ? (
                  <EmptyState title="Nothing to show yet" description="All cleaners are currently busy." className="p-6 bg-muted/20" />
                ) : (
                  <div className="space-y-3">
                    {cleaners.filter((c: any) => c.status !== 'Busy').map((cleaner: any) => (
                      <CleanerCard key={cleaner._id || cleaner.id} cleaner={cleaner} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {(() => {
              const filtered = filterReportsByMetric(publicReports, statusFilter);
              if (filtered.length === 0) {
                return (
                  <EmptyState
                    title="Nothing to show yet"
                    description={`No ${metrics.find((m) => m.id === statusFilter)?.label.toLowerCase()} reports right now.`}
                    className="p-8 bg-muted/15"
                  />
                );
              }
              return (
                <div className="space-y-3">
                  {filtered.slice(0, 10).map((report: any) => (
                    <ReportRow
                      key={report._id || report.id}
                      report={report}
                      showAssignee
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Reports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {user ? 'My Recent Reports' : 'Recent Public Incidents'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {user ? 'Issues submitted from your account' : 'Verified community reports across campus'}
            </p>
          </div>
          {user && (
            <Button asChild variant="ghost" size="sm" className="text-xs text-primary gap-1 active:scale-[0.98]">
              <Link to="/my-reports">
                View all ({myReports?.length || 0})
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {isLoadingMyReports && user && <PageLoader />}
        {isError && user && <ErrorState onRetry={() => refetch()} />}
        {!isLoadingMyReports && displayReports.length === 0 && (
          <EmptyState
            icon={<FileText className="h-8 w-8 text-muted-foreground" />}
            title={user ? 'No issues reported yet' : 'No public incidents recorded'}
            description={
              user
                ? 'Spot an infrastructure issue? Click "Submit Issue" above to dispatch cleaners.'
                : 'All community areas currently report normal operation.'
            }
          />
        )}
        {!isLoadingMyReports && displayReports.length > 0 && (
          <div className="space-y-3">
            {displayReports.map((report) => (
              <ReportRow
                key={report._id || report.id}
                report={report}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
