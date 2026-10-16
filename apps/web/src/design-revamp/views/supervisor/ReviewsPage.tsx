import { useState } from 'react';
import { useSupervisorReportsV2 } from '@/design-revamp/hooks/useV2';
import { ReportDetailDialog } from '@/design-revamp/components/composites/ReportDetailDialog';
import {
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
  MapPin,
  CheckCircle2,
} from 'lucide-react';

/** Supervisor review queue — resolutions awaiting endorsement + volunteer requests. */
export default function SupervisorReviewsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const reviewsQuery = useSupervisorReportsV2('resolved_by_cleaner');

  const reports = reviewsQuery.data?.reports ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Resolution Reviews</h1>
            <Badge variant="outline" className="border-violet-300 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 text-xs">
              {reports.length} awaiting
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cleaner-submitted resolutions awaiting your endorsement. Open a report to endorse or request rework.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reviewsQuery.refetch()}
          disabled={reviewsQuery.isLoading}
          className="h-8 gap-1.5 text-xs active:scale-[0.98] self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reviewsQuery.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {reviewsQuery.isLoading && <PageLoader />}
      {reviewsQuery.isError && <ErrorState onRetry={() => reviewsQuery.refetch()} />}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && (
        <RoleErrorBanner
          errors={[reviewsQuery.error]}
          expectedRole="supervisor"
          onReconnect={() => reviewsQuery.refetch()}
        />
      )}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reports.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
          title="Review queue is clear"
          description="No cleaner resolutions are waiting for endorsement right now."
        />
      )}
      {!reviewsQuery.isLoading && !reviewsQuery.isError && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="rounded-xl border border-violet-200 bg-card p-4 shadow-sm">
              <button type="button" onClick={() => setSelectedReportId(report.id)} className="flex w-full flex-col gap-2 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{report.title}</h3>
                  <Badge variant="outline" className={`text-[11px] ${v2StatusTone(report.status)}`}>
                    {formatV2Status(report.status)}
                  </Badge>
                  <span className="text-[11px] font-medium text-primary">Review →</span>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{report.location_address || 'Location not specified'}</span>
                </p>
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedReportId && (
        <ReportDetailDialog reportId={selectedReportId} assignTools={false} onClose={() => setSelectedReportId(null)} />
      )}
    </div>
  );
}