import { useMemo, useState } from 'react';
import {
  useAssignReportV2,
  useRejectVolunteerV2,
  useSupervisorCleanersV2,
  useSupervisorDashboardV2,
  useSupervisorReportsV2,
  useVolunteerRequestsV2,
} from '@/design-revamp/hooks/useV2';
import { ReportDetailDialog } from '@/design-revamp/components/composites/ReportDetailDialog';
import { VolunteerQueue } from '@/design-revamp/components/composites/VolunteerQueue';
import {
  canAssignV2Status,
  formatV2Status,
  v2StatusTone,
} from '@/design-revamp/components/composites/V2Status';
import type { V2VolunteerRequest } from '@/design-revamp/lib/api';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { RoleErrorBanner } from '@/design-revamp/components/feedback/RoleErrorBanner';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import { Textarea } from '@/design-revamp/components/ui/textarea';
import { toast } from 'sonner';
import {
  ClipboardList,
  Users,
  Send,
  RefreshCw,
  MapPin,
  HandHelping,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

/**
 * Supervisor dispatch desk — unassigned reports, pending volunteer
 * requests, and available cleaners in one place. Approval assigns the
 * requesting cleaner; manual dispatch pairs a selected report with a
 * selected cleaner. Resolution review stays in ReportDetailDialog.
 */
export default function SupervisorDispatchPage() {

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [assignNote, setAssignNote] = useState('');
  const [cleanerSearch, setCleanerSearch] = useState('');
  const [appliedCleanerSearch, setAppliedCleanerSearch] = useState<string | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  const dashboard = useSupervisorDashboardV2();
  const submittedQuery = useSupervisorReportsV2('submitted');
  const rejectedQuery = useSupervisorReportsV2('rejected_by_cleaner');
  const supervisorRejectedQuery = useSupervisorReportsV2('rejected_by_supervisor');
  const volunteersQuery = useVolunteerRequestsV2('pending');
  const cleanersQuery = useSupervisorCleanersV2(appliedCleanerSearch);

  const assignMutation = useAssignReportV2();
  const rejectVolunteerMutation = useRejectVolunteerV2();

  const unassigned = useMemo(
    () => [
      ...(submittedQuery.data?.reports ?? []),
      ...(rejectedQuery.data?.reports ?? []),
      ...(supervisorRejectedQuery.data?.reports ?? []),
    ],
    [submittedQuery.data, rejectedQuery.data, supervisorRejectedQuery.data],
  );
  const volunteers = useMemo(
    () => volunteersQuery.data ?? [],
    [volunteersQuery.data],
  );
  const availableCleaners = useMemo(
    () => (cleanersQuery.data ?? []).filter((c) => !c.is_busy),
    [cleanersQuery.data],
  );

  const summary = dashboard.data?.summary;
  const pendingCount =
    (summary?.submitted ?? 0) +
    (summary?.rejected_by_cleaner ?? 0) +
    (summary?.rejected_by_supervisor ?? 0);
  const inProgressCount =
    (summary?.assigned ?? 0) + (summary?.accepted_by_cleaner ?? 0) + (summary?.in_progress ?? 0);

  const selectedReport = unassigned.find((r) => r.id === selectedReportId) ?? null;
  const selectedCleaner = availableCleaners.find((c) => c.user_id === selectedCleanerId) ?? null;
  const canAssign =
    selectedReport != null &&
    selectedCleaner != null &&
    canAssignV2Status(selectedReport.status);

  const queueLoading =
    submittedQuery.isLoading || rejectedQuery.isLoading || supervisorRejectedQuery.isLoading;
  const queueError =
    submittedQuery.isError || rejectedQuery.isError || supervisorRejectedQuery.isError;

  function refetchAll() {
    dashboard.refetch();
    submittedQuery.refetch();
    rejectedQuery.refetch();
    supervisorRejectedQuery.refetch();
    volunteersQuery.refetch();
    cleanersQuery.refetch();
  }

  async function runAssign(reportId: string, cleanerUserId: string, note: string) {
    setActionError(null);
    try {
      await assignMutation.mutateAsync({
        reportId,
        body: {
          cleaner_user_id: cleanerUserId,
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      toast.success('Report assigned successfully');
      setSelectedReportId(null);
      setSelectedCleanerId(null);
      setAssignNote('');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Assign failed');
    }
  }

  async function handleApproveVolunteer(v: V2VolunteerRequest) {
    setActionError(null);
    try {
      await assignMutation.mutateAsync({
        reportId: v.report_id,
        body: { cleaner_user_id: v.cleaner_user_id },
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Approval failed');
    }
  }

  async function handleDeclineVolunteer(v: V2VolunteerRequest, reason: string) {
    setActionError(null);
    try {
      await rejectVolunteerMutation.mutateAsync({ requestId: v.id, reason });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Decline failed');
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Compact Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Dispatch & Assignment</h1>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs">
                {unassigned.length} unassigned
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Approve volunteer requests or pair unassigned reports with available cleaners.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={queueLoading}
            className="h-8 gap-1.5 text-xs active:scale-[0.98] self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${queueLoading ? 'animate-spin' : ''}`} />
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
            <span className="text-xs text-muted-foreground font-medium">Volunteers</span>
            <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{volunteersQuery.isLoading ? '…' : volunteers.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
            <span className="text-xs text-muted-foreground font-medium">Cleaners Ready</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{cleanersQuery.isLoading ? '…' : availableCleaners.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
            <span className="text-xs text-muted-foreground font-medium">In Progress</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{dashboard.isLoading ? '…' : inProgressCount}</span>
          </div>
        </div>

      {actionError && (
        <p role="alert" className="text-xs font-medium text-destructive">{actionError}</p>
      )}

      <RoleErrorBanner
        errors={[
          dashboard.error,
          submittedQuery.error,
          rejectedQuery.error,
          supervisorRejectedQuery.error,
          volunteersQuery.error,
          cleanersQuery.error,
        ]}
        expectedRole="supervisor"
        onReconnect={refetchAll}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Column 1: unassigned reports */}
        <section className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            Unassigned Reports ({unassigned.length})
          </h2>
          {queueLoading && <PageLoader />}
          {queueError && (
            <ErrorState onRetry={refetchAll} />
          )}
          {!queueLoading && !queueError && unassigned.length === 0 && (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
              title="Queue is clear"
              description="No unassigned reports right now."
            />
          )}
          {!queueLoading && !queueError && unassigned.length > 0 && (
            <div className="space-y-2.5">
              {unassigned.map((report) => {
                const isSelected = report.id === selectedReportId;
                return (
                  <article
                    key={report.id}
                    className={`rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border/80 hover:border-primary/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(isSelected ? null : report.id)}
                      className="flex w-full flex-col gap-1.5 text-left"
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground">{report.title}</h3>
                        <Badge variant="outline" className={`text-[11px] ${v2StatusTone(report.status)}`}>
                          {formatV2Status(report.status)}
                        </Badge>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{report.location_address || 'Location not specified'}</span>
                      </p>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 text-[11px]"
                        onClick={() => setDetailReportId(report.id)}
                      >
                        View details
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Column 2: volunteer requests */}
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
          <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
            <HandHelping className="h-4 w-4" />
            Volunteer Requests ({volunteers.length})
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Approving assigns the job to the requesting cleaner.
          </p>
          {volunteersQuery.isLoading && <PageLoader />}
          {volunteersQuery.isError && <ErrorState onRetry={() => volunteersQuery.refetch()} />}
          {!volunteersQuery.isLoading && !volunteersQuery.isError && (
            <VolunteerQueue
              requests={volunteers}
              approvePending={assignMutation.isPending}
              declinePending={rejectVolunteerMutation.isPending}
              onApprove={handleApproveVolunteer}
              onDecline={handleDeclineVolunteer}
              showReportTitle
            />
          )}
        </section>

        {/* Column 3: available cleaners */}
        <section className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Users className="h-4 w-4 text-emerald-600" />
            Available Cleaners ({availableCleaners.length})
          </h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedCleanerSearch(cleanerSearch.trim() || undefined);
            }}
          >
            <input
              value={cleanerSearch}
              onChange={(e) => setCleanerSearch(e.target.value)}
              placeholder="Search name, ID, zone…"
              aria-label="Search available cleaners"
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" size="sm" variant="outline" className="h-9 text-xs">Search</Button>
          </form>
          {cleanersQuery.isLoading && <PageLoader />}
          {cleanersQuery.isError && <ErrorState onRetry={() => cleanersQuery.refetch()} />}
          {!cleanersQuery.isLoading && !cleanersQuery.isError && availableCleaners.length === 0 && (
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="No cleaners free"
              description="All cleaners are currently engaged on duty."
            />
          )}
          {!cleanersQuery.isLoading && !cleanersQuery.isError && availableCleaners.length > 0 && (
            <div className="space-y-2.5">
              {availableCleaners.map((cleaner) => {
                const isSelected = cleaner.user_id === selectedCleanerId;
                return (
                  <button
                    key={cleaner.user_id}
                    type="button"
                    onClick={() => setSelectedCleanerId(isSelected ? null : cleaner.user_id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                        : 'border-border/80 hover:border-primary/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-sm text-foreground">{cleaner.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {cleaner.work_location || 'General Facilities'} · {cleaner.phone || 'No phone'}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-emerald-300 bg-emerald-50 text-[11px] text-emerald-700">
                      Available
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Dispatch action bar */}
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <UserCheck className="h-4 w-4 text-primary" />
          Manual Dispatch
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select an unassigned report from the left column... Select an available cleaner from the right column.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
            placeholder="Note for cleaner (optional, max 500 chars)"
            maxLength={500}
            aria-label="Note for cleaner"
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            className="min-h-11 sm:w-auto"
            disabled={!canAssign || assignMutation.isPending}
            onClick={() =>
              selectedReport &&
              selectedCleaner &&
              runAssign(selectedReport.id, selectedCleaner.user_id, assignNote)
            }
          >
            <Send className="mr-1.5 h-4 w-4" />
            {assignMutation.isPending ? 'Assigning…' : 'Assign job'}
          </Button>
        </div>
      </section>
    </div>
    {detailReportId && (
      <ReportDetailDialog
        reportId={detailReportId}
        onClose={() => setDetailReportId(null)}
      />
    )}
  </>
  );
}