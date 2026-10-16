import { useState } from 'react';
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
  RefreshCw,
  CheckCircle2,
  MapPin,
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

  return (
    <div className="space-y-4">
      {/* Compact Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Incident Dispatch & Triage</h1>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs">
              {pendingCount} pending
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
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
          className="h-8 gap-1.5 text-xs active:scale-[0.98] self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reportsQuery.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Condensed Single-Row Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Pending Triage</span>
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{dashboard.isLoading ? '…' : pendingCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">In Progress</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{dashboard.isLoading ? '…' : inProgressCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Awaiting Review</span>
          <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{dashboard.isLoading ? '…' : awaitingReview}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Resolved Total</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{dashboard.isLoading ? '…' : resolvedCount}</span>
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

      {selectedReportId && (
        <ReportDetailDialog
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
}