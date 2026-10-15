import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Clock, Users, MapPin, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { usePublicStatusBoard } from '@/design-revamp/hooks/useReports';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent } from '@/design-revamp/components/ui/card';
import { Badge } from '@/design-revamp/components/ui/badge';
import { ReportRow } from '@/design-revamp/components/composites/ReportRow';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Skeleton } from '@/design-revamp/components/feedback/Skeletons';
import { cn } from '@/design-revamp/lib/utils';

// Mirror the backend public-status buckets (reports.service.ts):
// PENDING = Reported + legacy aliases (Pending, Submitted) + Assigned;
// OPEN = Assigned, In Progress, Awaiting Endorsement, Rejected.
// The public board normalizes legacy aliases to Reported, but My Reports
// (v1 serializeMany) keeps raw values — so match every alias here.
const PUBLIC_PENDING_STATUSES = new Set(['Reported', 'Pending', 'Submitted', 'Assigned']);
const PUBLIC_OPEN_STATUSES = new Set(['Assigned', 'In Progress', 'Awaiting Endorsement', 'Rejected']);
const PUBLIC_URGENT_PRIORITIES = new Set(['High', 'Critical']);

export type MetricId = 'pending' | 'urgent' | 'cleaners' | 'open' | 'resolved' | 'total';

/** Single source of truth for bucket filtering — shared with the dashboard. */
export function filterReportsByMetric(reports: any[], metricId: MetricId): any[] {
  return reports.filter((report: any) => {
    if (metricId === 'pending') return PUBLIC_PENDING_STATUSES.has(report.status || '');
    if (metricId === 'urgent') return report.status !== 'Resolved' && PUBLIC_URGENT_PRIORITIES.has(report.priority || '');
    if (metricId === 'open') return PUBLIC_OPEN_STATUSES.has(report.status || '');
    if (metricId === 'resolved') return report.status === 'Resolved';
    if (metricId === 'total') return true;
    return true;
  });
}

const METRIC_IDS: MetricId[] = ['pending', 'urgent', 'cleaners', 'open', 'resolved', 'total'];

function metricFromSearchParam(value: string | null): MetricId {
  return value && (METRIC_IDS as string[]).includes(value) ? (value as MetricId) : 'urgent';
}

interface Metric {
  id: MetricId;
  label: string;
  value: number;
  icon: React.ElementType;
  tone: 'warning' | 'urgent' | 'teal' | 'info' | 'success' | 'default';
}

const toneStyles: Record<string, string> = {
  warning: 'border-amber-200/80 bg-card hover:border-amber-400 dark:border-amber-900/60',
  urgent: 'border-purple-200/80 bg-card hover:border-purple-400 dark:border-purple-900/60',
  teal: 'border-teal-200/80 bg-card hover:border-teal-400 dark:border-teal-900/60',
  info: 'border-blue-200/80 bg-card hover:border-blue-400 dark:border-blue-900/60',
  success: 'border-green-200/80 bg-card hover:border-green-400 dark:border-green-900/60',
  default: 'border-border bg-card hover:border-primary/50',
};

const activeToneStyles: Record<string, string> = {
  warning: 'ring-2 ring-amber-400/80 border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm',
  urgent: 'ring-2 ring-purple-400/80 border-purple-400 bg-purple-50/50 dark:bg-purple-950/25 shadow-sm',
  teal: 'ring-2 ring-teal-400/80 border-teal-400 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm',
  info: 'ring-2 ring-blue-400/80 border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm',
  success: 'ring-2 ring-green-400/80 border-green-400 bg-green-50/40 dark:bg-green-950/20 shadow-sm',
  default: 'ring-2 ring-primary/40 border-primary bg-muted/30 shadow-sm',
};

const valueToneStyles: Record<string, string> = {
  warning: 'text-amber-600 dark:text-amber-400',
  urgent: 'text-purple-600 dark:text-purple-400',
  teal: 'text-teal-600 dark:text-teal-400',
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  default: 'text-foreground',
};

function MetricCard({ metric, active, onClick }: { metric: Metric; active: boolean; onClick: () => void }) {
  const Icon = metric.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[58px] flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all',
        'hover:shadow-sm active:scale-[0.98]',
        toneStyles[metric.tone],
        active && activeToneStyles[metric.tone],
      )}
      aria-pressed={active}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {metric.label}
        </span>
      </div>
      <span className={cn('text-2xl font-bold tracking-tight tabular-nums', valueToneStyles[metric.tone])}>
        {metric.value.toLocaleString()}
      </span>
    </button>
  );
}

export function CleanerCard({ cleaner }: { cleaner: any }) {
  const isBusy = cleaner.status === 'Busy';
  return (
    <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate text-foreground">{cleaner.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            Work location: {cleaner.workLocation || 'General Area'}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'shrink-0 border font-medium',
            isBusy
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
              : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
          )}
        >
          {cleaner.status}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
        Assigned task: <span className="text-foreground font-medium">{cleaner.assignedTaskId || 'No active task'}</span>
      </p>
    </div>
  );
}

export function StatusBoard() {
  const { data: board, isLoading, isError, isFetching, refetch } = usePublicStatusBoard();
  const [searchParams] = useSearchParams();
  // Keep metric filtering local to the dashboard status board.
  const [activeMetric, setActiveMetric] = useState<MetricId>(() =>
    metricFromSearchParam(searchParams.get('metric')),
  );

  // Stay in sync if the ?metric= param changes while the board is mounted.
  useEffect(() => {
    setActiveMetric(metricFromSearchParam(searchParams.get('metric')));
  }, [searchParams]);

  const summary = board?.summary || {
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    urgent: 0,
    cleaners: 0,
    availableCleaners: 0,
    busyCleaners: 0,
  };

  const reports = Array.isArray(board?.reports) ? board!.reports! : [];
  const cleaners = Array.isArray(board?.cleaners) ? board!.cleaners! : [];

  const metrics: Metric[] = [
    { id: 'pending', label: 'Pending', value: summary.pending || 0, icon: Clock, tone: 'warning' },
    { id: 'urgent', label: 'Urgent', value: summary.urgent || 0, icon: AlertTriangle, tone: 'urgent' },
    { id: 'cleaners', label: 'Cleaners', value: (summary.availableCleaners || 0) + (summary.busyCleaners || 0), icon: Users, tone: 'teal' },
    { id: 'open', label: 'Open', value: summary.open || 0, icon: Activity, tone: 'info' },
    { id: 'resolved', label: 'Resolved', value: summary.resolved || 0, icon: CheckCircle2, tone: 'success' },
    { id: 'total', label: 'Total', value: summary.total || 0, icon: MapPin, tone: 'default' },
  ];

  const activeEntry = metrics.find((m) => m.id === activeMetric) || metrics[0];

  const filteredReports = filterReportsByMetric(reports, activeEntry.id);

  const busyCleaners = cleaners.filter((c: any) => c.status === 'Busy');
  const availableCleaners = cleaners.filter((c: any) => c.status !== 'Busy');

  const updatedAt = board?.generatedAt
    ? new Date(board.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Public status board</h2>
            <p className="text-sm text-muted-foreground">View current report buckets and cleaner availability without signing in.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="rounded-2xl border bg-card shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Public status board</h2>
          <p className="mt-1 text-sm text-muted-foreground">View current report buckets and cleaner availability without signing in.</p>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Header with Title and Refresh button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Public status board
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View current report buckets and cleaner availability without signing in.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-4 shrink-0 rounded-lg gap-2 text-sm font-medium transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* 6-Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              active={activeEntry.id === metric.id}
              onClick={() => setActiveMetric(metric.id)}
            />
          ))}
        </div>

        {/* Selected Metric Detail Section */}
        {activeEntry.id === 'cleaners' ? (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <div>
                <h3 className="font-semibold text-foreground">Cleaner availability</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Current roster split into busy and available cleaners.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Updated {updatedAt}</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Busy cleaners</h4>
                    <p className="text-xs text-muted-foreground">Currently handling an active report.</p>
                  </div>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                    {busyCleaners.length}
                  </Badge>
                </div>
                {busyCleaners.length === 0 ? (
                  <EmptyState
                    title="Nothing to show yet"
                    description="All cleaners are currently available."
                    className="p-6 bg-muted/20"
                  />
                ) : (
                  <div className="space-y-3">
                    {busyCleaners.map((cleaner: any) => (
                      <CleanerCard key={cleaner._id || cleaner.id} cleaner={cleaner} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Available cleaners</h4>
                    <p className="text-xs text-muted-foreground">Ready for the next assignment.</p>
                  </div>
                  <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-400">
                    {availableCleaners.length}
                  </Badge>
                </div>
                {availableCleaners.length === 0 ? (
                  <EmptyState
                    title="Nothing to show yet"
                    description="All cleaners are currently busy."
                    className="p-6 bg-muted/20"
                  />
                ) : (
                  <div className="space-y-3">
                    {availableCleaners.map((cleaner: any) => (
                      <CleanerCard key={cleaner._id || cleaner.id} cleaner={cleaner} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <div>
                <h3 className="font-semibold text-foreground">
                  {activeEntry.label} reports
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Organized report list for the selected metric.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Updated {updatedAt}</span>
            </div>

            {filteredReports.length === 0 ? (
              <EmptyState
                title="Nothing to show yet"
                description="Try another metric or refresh for the latest tenant activity."
                className="p-8 bg-muted/15"
              />
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report: any) => (
                  <ReportRow
                    key={report._id || report.id}
                    report={report}
                    showAssignee
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
