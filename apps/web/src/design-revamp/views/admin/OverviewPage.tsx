import { useReports, useUsers, useCleaners } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import { RefreshCw } from 'lucide-react';

function v1StatusTone(status: string): string {
  if (status === 'Resolved') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
  if (status === 'In Progress' || status === 'Awaiting Endorsement') return 'border-blue-300 bg-blue-50 text-blue-700';
  if (status === 'Assigned') return 'border-indigo-300 bg-indigo-50 text-indigo-700';
  if (status === 'Rejected') return 'border-rose-300 bg-rose-50 text-rose-700';
  return 'border-amber-300 bg-amber-50 text-amber-700';
}

// v1 report statuses: Reported, Pending (legacy), Submitted (legacy),
// Assigned, In Progress, Awaiting Endorsement, Resolved, Rejected.
const ACTIVE_STATUSES = new Set(['Reported', 'Pending', 'Submitted', 'Assigned']);

export default function AdminOverviewPage() {
  // Master sessions stay on the v1 API by design (no v2 device session),
  // so the control room reads live data from the v1 endpoints.
  const reportsQuery = useReports();
  const usersQuery = useUsers();
  const cleanersQuery = useCleaners();

  const reports = Array.isArray(reportsQuery.data) ? reportsQuery.data : [];
  const users = Array.isArray(usersQuery.data) ? usersQuery.data : [];
  const cleaners = Array.isArray(cleanersQuery.data) ? cleanersQuery.data : [];

  const isLoading = reportsQuery.isLoading || usersQuery.isLoading || cleanersQuery.isLoading;
  const isError = reportsQuery.isError || usersQuery.isError || cleanersQuery.isError;

  function refetchAll() {
    reportsQuery.refetch();
    usersQuery.refetch();
    cleanersQuery.refetch();
  }

  const activeCount = reports.filter((r: any) => ACTIVE_STATUSES.has(r.status)).length;
  const awaitingReview = reports.filter((r: any) => r.status === 'Awaiting Endorsement').length;
  const resolvedCount = reports.filter((r: any) => r.status === 'Resolved').length;
  const rejectedCount = reports.filter((r: any) => r.status === 'Rejected').length;
  const staffCount = users.filter((u: any) => u.role === 'supervisor' || u.role === 'cleaner').length;

  const recent = [...reports]
    .sort((a: any, b: any) => {
      const ta = new Date(a.timestamp || a.createdAt || a.updatedAt || 0).getTime();
      const tb = new Date(b.timestamp || b.createdAt || b.updatedAt || 0).getTime();
      return tb - ta;
    })
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Infrastructure Overview</h1>
            <Badge variant="outline" className="text-xs">
              {reports.length} total reports
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">Operational metrics across all roles, pulled live from v1 endpoints.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchAll()} disabled={isLoading} className="h-8 gap-1.5 text-xs self-start sm:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Active</span>
          <span className="text-lg font-bold text-foreground">{isLoading ? '…' : activeCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Review</span>
          <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{isLoading ? '…' : awaitingReview}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Resolved</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{isLoading ? '…' : resolvedCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-3 py-2 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">Rejected</span>
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{isLoading ? '…' : rejectedCount}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Recent Incidents Log</h2>
        {isLoading && <PageLoader />}
        {isError && <ErrorState onRetry={() => refetchAll()} />}
        {!isLoading && !isError && recent.length === 0 && (
          <p className="text-xs text-muted-foreground">No reports recorded yet.</p>
        )}
        {!isLoading && !isError && recent.length > 0 && (
          <div className="space-y-2.5">
            {recent.map((r: any) => (
              <div key={r._id || r.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{r.category || 'General Report'} · {r.id || r._id}</span>
                  <span className="text-muted-foreground ml-2">({r.location || 'Campus'})</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${v1StatusTone(r.status)}`}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Workforce Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-muted-foreground font-medium">Registered Users</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{users.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-muted-foreground font-medium">Staff (Sup + Cln)</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{staffCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <span className="text-muted-foreground font-medium">Cleaner Profiles</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{cleaners.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}