import { useMemo, useState } from 'react';
import { X, MapPin, UserCheck, CheckCircle2, XCircle, HandHelping } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  useAssignReportV2,
  useEndorseReportV2,
  useRejectReportV2,
  useRejectVolunteerV2,
  useReportDetailV2,
  useSupervisorCleanersV2,
  useVolunteerRequestsV2,
} from '@/design-revamp/hooks/useV2';
import { VolunteerQueue } from '@/design-revamp/components/composites/VolunteerQueue';
import {
  canAssignV2Status,
  canReviewV2Status,
  formatDateTime,
  formatV2Event,
  formatV2Status,
  v2StatusTone,
} from '@/design-revamp/components/composites/V2Status';

interface ReportDetailDialogProps {
  reportId: string;
  reportTitle?: string;
  onClose: () => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="text-right font-medium text-foreground break-words">{value}</span>
    </div>
  );
}

/**
 * Supervisor report dialog — web parity of the Android ReportDetailDialog
 * (Image 1): status/priority/category/location/GPS/reporter/submitted,
 * details, "Assign to cleaner" dropdown, photos, review actions, Close.
 */
export function ReportDetailDialog({ reportId, reportTitle, onClose }: ReportDetailDialogProps) {
  const { data: detail, isLoading, isError, refetch } = useReportDetailV2(reportId);
  const { data: cleaners } = useSupervisorCleanersV2();
  const { data: volunteerRequests } = useVolunteerRequestsV2('pending');

  const assignMutation = useAssignReportV2();
  const endorseMutation = useEndorseReportV2();
  const rejectMutation = useRejectReportV2();
  const rejectVolunteerMutation = useRejectVolunteerV2();

  const [cleanerId, setCleanerId] = useState('');
  const [assignNote, setAssignNote] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const report = detail?.report;
  const attachments = useMemo(() => detail?.attachments ?? [], [detail]);
  const events = useMemo(() => detail?.events ?? [], [detail]);
  const pendingVolunteers = useMemo(
    () => (volunteerRequests ?? []).filter((r) => r.report_id === reportId),
    [volunteerRequests, reportId],
  );

  const evidencePhotos = attachments.filter((a) => a.attachment_type === 'report_evidence');
  const resolutionPhotos = attachments.filter((a) => a.attachment_type !== 'report_evidence');

  const busy = assignMutation.isPending || endorseMutation.isPending || rejectMutation.isPending;

  async function runAction(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
      setCleanerId('');
      setAssignNote('');
      setReviewNote('');
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    }
  }

  const selectedCleaner = (cleaners ?? []).find((c) => c.user_id === cleanerId);
  const gps =
    report?.location_lat != null && report?.location_lng != null
      ? `${report.location_lat}, ${report.location_lng}`
      : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Report ${report?.title ?? reportTitle ?? reportId}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading report…</p>}
        {isError && (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-destructive">Could not load this report.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}
        {report && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Report {report.title}</h2>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{report.id}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-border/70 px-4 py-2">
              <MetaRow label="Status" value={formatV2Status(report.status)} />
              <MetaRow label="Priority" value={report.priority} />
              <MetaRow label="Location" value={report.location_address || '—'} />
              <MetaRow label="Issue GPS" value={gps} />
              <MetaRow label="Submitted" value={formatDateTime(report.created_at)} />
              {report.assigned_cleaner_id && (
                <MetaRow label="Assigned to" value={report.assigned_cleaner_id} />
              )}
            </div>

            {report.description && (
              <p className="text-sm text-foreground/90">{report.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`text-[11px] ${v2StatusTone(report.status)}`}>
                {formatV2Status(report.status)}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                v{report.version}
              </Badge>
            </div>

            {pendingVolunteers.length > 0 && (
              <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-200">
                  <HandHelping className="h-4 w-4" />
                  Volunteer requests ({pendingVolunteers.length})
                </h3>
                <VolunteerQueue
                  requests={pendingVolunteers}
                  approvePending={busy}
                  declinePending={rejectVolunteerMutation.isPending}
                  onApprove={(v) =>
                    runAction(() =>
                      assignSupervisorReportV2Wrapper(v.cleaner_user_id),
                    )
                  }
                  onDecline={(v, reason) =>
                    runAction(() =>
                      rejectVolunteerMutation.mutateAsync({
                        requestId: v.id,
                        reason,
                      }),
                    )
                  }
                />
              </section>
            )}

            {canAssignV2Status(report.status) && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Assign to cleaner</h3>
                {(cleaners ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No cleaners available to assign.</p>
                ) : (
                  <>
                    <select
                      value={cleanerId}
                      onChange={(e) => setCleanerId(e.target.value)}
                      aria-label="Select cleaner"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select cleaner…</option>
                      {(cleaners ?? []).map((c) => (
                        <option key={c.user_id} value={c.user_id}>
                          {c.name} ({c.is_busy ? 'Busy' : 'Available'})
                        </option>
                      ))}
                    </select>
                    <input
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      placeholder="Note for cleaner (optional)"
                      maxLength={500}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      className="w-full min-h-11"
                      disabled={!cleanerId || busy}
                      onClick={() =>
                        runAction(() => assignSupervisorReportV2Wrapper(cleanerId))
                      }
                    >
                      <UserCheck className="mr-1.5 h-4 w-4" />
                      {selectedCleaner ? `Assign to ${selectedCleaner.name}` : 'Assign cleaner'}
                    </Button>
                  </>
                )}
              </section>
            )}

            {canReviewV2Status(report.status) && (
              <section className="space-y-2 border-t border-border/60 pt-3">
                <h3 className="text-sm font-semibold">Supervisor review</h3>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Review notes (optional for endorse, shown to reporter)"
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="min-h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={busy}
                    onClick={() =>
                      runAction(() =>
                        endorseMutation.mutateAsync({ reportId: report.id, note: reviewNote || undefined }),
                      )
                    }
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Endorse
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={busy}
                    onClick={() =>
                      runAction(() =>
                        rejectMutation.mutateAsync({
                          reportId: report.id,
                          reason: reviewNote.trim() || 'Needs more work',
                        }),
                      )
                    }
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </section>
            )}

            {(evidencePhotos.length > 0 || resolutionPhotos.length > 0) && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[...evidencePhotos, ...resolutionPhotos].map((a) => (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer" aria-label="Open photo">
                      <img
                        src={a.file_url}
                        alt={`${a.attachment_type} evidence`}
                        loading="lazy"
                        className="h-20 w-full rounded-lg border object-cover"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {events.length > 0 && (
              <section className="space-y-1.5 border-t border-border/60 pt-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
                <ol className="space-y-1">
                  {events.slice(-6).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-foreground">{formatV2Event(e.event_type)}</span>
                      <span className="shrink-0 text-muted-foreground">{formatDateTime(e.created_at)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {actionError && (
              <p role="alert" className="text-xs font-medium text-destructive">{actionError}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {gps}
              </p>
              <Button variant="ghost" onClick={onClose} className="text-indigo-600 hover:text-indigo-700">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function assignSupervisorReportV2Wrapper(targetCleanerId: string) {
    return assignMutation.mutateAsync({
      reportId,
      body: {
        cleaner_user_id: targetCleanerId,
        ...(assignNote.trim() ? { note: assignNote.trim() } : {}),
      },
    });
  }
}
