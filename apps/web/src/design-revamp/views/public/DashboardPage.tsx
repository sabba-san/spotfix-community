import { MapPin, FileText, RefreshCw, AlertCircle, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useMyReports, usePublicStatusBoard } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ReportRow } from '@/design-revamp/components/composites/ReportRow';
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

  const metrics = [
    { label: 'Pending', value: summary.pending, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
    { label: 'Urgent', value: summary.urgent, color: 'text-rose-600 dark:text-rose-400', icon: AlertCircle },
    { label: 'Cleaners', value: (summary.availableCleaners || 0) + (summary.busyCleaners || 0), color: 'text-blue-600 dark:text-blue-400', icon: Users },
    { label: 'Open', value: summary.open, color: 'text-indigo-600 dark:text-indigo-400', icon: MapPin },
    { label: 'Resolved', value: summary.resolved, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
    { label: 'Total', value: summary.total, color: 'text-foreground', icon: FileText },
  ];

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

      {/* 6-Metric Civic Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color} opacity-80`} />
              </div>
              <p className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${s.color}`}>
                {(s.value || 0).toLocaleString()}
              </p>
            </div>
          );
        })}
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

      {/* Cleaner Workforce Availability */}
      {cleaners.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Field Cleaner Availability</h2>
            <span className="text-xs text-muted-foreground">
              {summary.availableCleaners || 0} active on duty
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cleaners.slice(0, 8).map((cleaner) => {
              const isBusy = cleaner.status === 'Busy';
              return (
                <div
                  key={cleaner._id}
                  className="rounded-xl border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40"
                >
                  <p className="font-semibold text-foreground truncate text-sm">{cleaner.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Location: {cleaner.workLocation || 'General Area'}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                        isBusy
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900'
                      }`}
                    >
                      {cleaner.status}
                    </span>
                    <span className="text-[11px] text-muted-foreground">ID: {cleaner.workId || 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
