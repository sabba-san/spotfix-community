/** v2 status → Android-parity display labels + badge tones. */

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Reported',
  assigned: 'Assigned',
  accepted_by_cleaner: 'Accepted',
  in_progress: 'In Progress',
  resolved_by_cleaner: 'Awaiting Endorsement',
  endorsed_by_supervisor: 'Resolved',
  rejected_by_cleaner: 'Rejected',
  rejected_by_supervisor: 'Rejected',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export function formatV2Status(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const STATUS_TONES: Record<string, string> = {
  submitted: 'border-red-200 bg-red-50 text-red-700',
  assigned: 'border-blue-200 bg-blue-50 text-blue-700',
  accepted_by_cleaner: 'border-sky-200 bg-sky-50 text-sky-700',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved_by_cleaner: 'border-violet-200 bg-violet-50 text-violet-700',
  endorsed_by_supervisor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected_by_cleaner: 'border-rose-200 bg-rose-50 text-rose-700',
  rejected_by_supervisor: 'border-rose-200 bg-rose-50 text-rose-700',
  closed: 'border-border bg-muted text-muted-foreground',
  cancelled: 'border-border bg-muted text-muted-foreground',
};

export function v2StatusTone(status: string): string {
  return STATUS_TONES[status] ?? 'border-border bg-muted text-muted-foreground';
}

/** Statuses in which a supervisor may (re)assign a cleaner. */
export function canAssignV2Status(status: string): boolean {
  return ['submitted', 'assigned', 'rejected_by_cleaner', 'rejected_by_supervisor'].includes(status);
}

export function canReviewV2Status(status: string): boolean {
  return status === 'resolved_by_cleaner';
}

const EVENT_LABELS: Record<string, string> = {
  report_created: 'Report submitted',
  report_assigned: 'Cleaner assigned',
  cleaner_accepted_task: 'Cleaner accepted',
  cleaner_rejected_task: 'Cleaner declined',
  cleaner_started_work: 'Work started',
  cleaner_submitted_resolution: 'Resolution submitted',
  supervisor_endorsed: 'Supervisor endorsed',
  supervisor_rejected: 'Supervisor requested rework',
  report_closed: 'Report closed',
  report_cancelled: 'Report cancelled',
  volunteer_requested: 'Volunteer requested',
  volunteer_approved: 'Volunteer approved',
  volunteer_rejected: 'Volunteer declined',
};

export function formatV2Event(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}
