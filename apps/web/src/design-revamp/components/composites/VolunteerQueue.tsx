import { useState } from 'react';
import { HandHelping } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import type { V2VolunteerRequest } from '@/design-revamp/lib/api';

interface VolunteerQueueProps {
  requests: V2VolunteerRequest[];
  approvePending: boolean;
  declinePending: boolean;
  onApprove: (request: V2VolunteerRequest) => void;
  onDecline: (request: V2VolunteerRequest, reason: string) => void;
  showReportTitle?: boolean;
}

/**
 * Shared pending-volunteer-request list for supervisors. Approval assigns
 * the requesting cleaner (via the parent's onApprove); declining requires
 * a free-text reason (min 3 chars, per the v2 RejectSchema).
 */
export function VolunteerQueue({
  requests,
  approvePending,
  declinePending,
  onApprove,
  onDecline,
  showReportTitle = false,
}: VolunteerQueueProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({});

  if (requests.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        No pending volunteer requests.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((v) => {
        const reason = reasons[v.id] ?? '';
        const reasonOk = reason.trim().length >= 3;
        return (
          <div
            key={v.id}
            className="space-y-2 rounded-lg bg-card px-2.5 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  <HandHelping className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span className="truncate">{v.cleaner_name ?? v.cleaner_user_id}</span>
                </p>
                {showReportTitle && v.report && (
                  <p className="mt-0.5 truncate text-muted-foreground">
                    For: {v.report.title}
                  </p>
                )}
                {v.note && <p className="mt-0.5 text-muted-foreground">{v.note}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={approvePending || declinePending}
                  onClick={() => onApprove(v)}
                >
                  Approve
                </Button>
              </div>
            </div>
            <div className="flex gap-1.5">
              <input
                value={reason}
                onChange={(e) => setReasons((p) => ({ ...p, [v.id]: e.target.value }))}
                placeholder="Decline reason (min 3 chars)"
                aria-label={`Decline reason for ${v.cleaner_name ?? 'volunteer'}`}
                className="h-8 flex-1 rounded-lg border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-[11px]"
                disabled={declinePending || !reasonOk}
                onClick={() => onDecline(v, reason.trim())}
              >
                Decline
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
