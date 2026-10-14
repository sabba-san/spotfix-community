import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import {
  useAvailableReportsV2,
  useCleanerHistoryV2,
  useCleanerTaskActionV2,
  useCleanerTasksV2,
  useReportDetailV2,
  useRequestVolunteerV2,
} from '@/design-revamp/hooks/useV2';
import { uploadReportPhotoV2, type V2ReportSummary } from '@/design-revamp/lib/api';
import {
  formatDateTime,
  formatV2Event,
  formatV2Status,
  v2StatusTone,
} from '@/design-revamp/components/composites/V2Status';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ClipboardCheck,
  CheckCircle2,
  MapPin,
  RefreshCw,
  LogOut,
  Camera,
  Play,
  Check,
  HandHelping,
  History,
  ListTodo,
  Search,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type CleanerTab = 'tasks' | 'available' | 'history';

function TaskCard({
  report,
  detail,
  onOpen,
  action,
}: {
  report: V2ReportSummary;
  detail?: { attachments: { id: string; attachment_type: string; file_url: string }[] };
  onOpen: () => void;
  action?: React.ReactNode;
}) {
  const evidence = detail?.attachments.filter((a) => a.attachment_type === 'report_evidence') ?? [];
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm border-border/90">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground text-base">{report.title}</h3>
            <Badge variant="outline" className={`text-[11px] font-semibold ${v2StatusTone(report.status)}`}>
              {formatV2Status(report.status)}
            </Badge>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{report.location_address || 'Location not specified'}</span>
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{report.id.slice(0, 8)}</span>
      </div>
      {evidence.length > 0 && (
        <div className="mt-3 flex gap-2">
          {evidence.slice(0, 3).map((a) => (
            <img key={a.id} src={a.file_url} alt="Reporter evidence" className="h-16 w-16 object-cover rounded-lg border" />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onOpen} className="text-xs">View details</Button>
      </div>
      {action && <div className="mt-3 border-t border-border/60 pt-3">{action}</div>}
    </article>
  );
}

function DetailModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useReportDetailV2(reportId);
  const report = data?.report;
  const attachments = data?.attachments ?? [];
  const events = data?.events ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{report?.title ?? 'Report'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
        {isError && <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>}
        {report && (
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={v2StatusTone(report.status)}>{formatV2Status(report.status)}</Badge>
              <Badge variant="outline">{report.priority}</Badge>
            </div>
            {report.description && <p>{report.description}</p>}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />{report.location_address || '—'}
            </p>
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((a) => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer">
                    <img src={a.file_url} alt={a.attachment_type} className="h-20 w-full rounded-lg border object-cover" />
                  </a>
                ))}
              </div>
            )}
            {events.length > 0 && (
              <ol className="space-y-1 border-t border-border/60 pt-2">
                {events.slice(-8).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 text-xs">
                    <span>{formatV2Event(e.event_type)}</span>
                    <span className="text-muted-foreground">{formatDateTime(e.created_at)}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose} className="text-indigo-600">Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CleanerTasksPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState<CleanerTab>('tasks');
  const [openId, setOpenId] = useState<string | null>(null);

  const tasksQuery = useCleanerTasksV2(tab === 'tasks');
  const availableQuery = useAvailableReportsV2(tab === 'available');
  const historyQuery = useCleanerHistoryV2(tab === 'history');

  const taskAction = useCleanerTaskActionV2();
  const volunteer = useRequestVolunteerV2();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [resolveNote, setResolveNote] = useState<Record<string, string>>({});
  const [resolveFiles, setResolveFiles] = useState<Record<string, File[]>>({});
  const [attachLocation, setAttachLocation] = useState<Record<string, boolean>>({});

  const tasks = tasksQuery.data?.tasks ?? [];
  const available = availableQuery.data?.reports ?? [];
  const history = historyQuery.data?.tasks ?? [];

  async function runTask(taskId: string, action: 'accept' | 'reject' | 'start' | 'resolve', body: Record<string, unknown> = {}) {
    setBusyId(taskId);
    setError(null);
    try {
      await taskAction.mutateAsync({ taskId, action, body });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(taskId: string) {
    const files = resolveFiles[taskId] ?? [];
    if (files.length === 0) {
      setError('Attach at least one completion photo before resolving.');
      return;
    }
    setBusyId(taskId);
    setError(null);
    try {
      const uploaded: { file_url: string; attachment_type: string }[] = [];
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        const url = await uploadReportPhotoV2(taskId, i === 0 ? 'resolution' : 'extra', files[i]);
        uploaded.push({
          file_url: url,
          attachment_type: i === 0 ? 'cleaner_resolution_evidence' : 'cleaner_resolution_evidence',
        });
      }
      let note = (resolveNote[taskId] ?? '').trim();
      if (attachLocation[taskId]) {
        const coords = await getCoords().catch(() => null);
        if (coords) note = `${note} [location: ${coords.lat}, ${coords.lng}]`.trim();
      }
      await taskAction.mutateAsync({
        taskId,
        action: 'resolve',
        body: { ...(note ? { note } : {}), attachments: uploaded },
      });
      setResolveFiles((p) => { const n = { ...p }; delete n[taskId]; return n; });
      setResolveNote((p) => { const n = { ...p }; delete n[taskId]; return n; });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resolve failed');
    } finally {
      setBusyId(null);
    }
  }

  function getCoords(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('no geolocation'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject,
        { timeout: 10_000 },
      );
    });
  }

  async function handleVolunteer(reportId: string) {
    setBusyId(reportId);
    setError(null);
    try {
      await volunteer.mutateAsync({ reportId });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Volunteer request failed');
    } finally {
      setBusyId(null);
    }
  }

  const activeQuery = tab === 'tasks' ? tasksQuery : tab === 'available' ? availableQuery : historyQuery;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
              <ClipboardCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Field</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Cleaner Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-6">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Task Command Center</h1>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-xs">Field Staff</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Staff ID: {user?.idNumber || 'N/A'} | Zone: {user?.workLocation || 'General Facilities'}
          </p>
          <div className="grid grid-cols-3 gap-2.5 mt-5">
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <span className="text-[11px] font-medium text-muted-foreground">My Tasks</span>
              <p className="text-xl font-bold tabular-nums mt-0.5">{tasksQuery.data?.total ?? tasks.length}</p>
            </div>
            <div className="rounded-xl border bg-blue-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-blue-700">Available</span>
              <p className="text-xl font-bold tabular-nums text-blue-700 mt-0.5">{availableQuery.data?.total ?? available.length}</p>
            </div>
            <div className="rounded-xl border bg-emerald-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-emerald-700">History</span>
              <p className="text-xl font-bold tabular-nums text-emerald-700 mt-0.5">{historyQuery.data?.total ?? history.length}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1" role="tablist" aria-label="Cleaner views">
          {([
            { id: 'tasks', label: `Duty Tasks (${tasks.length})`, icon: ListTodo },
            { id: 'available', label: `Available (${available.length})`, icon: Search },
            { id: 'history', label: `History (${history.length})`, icon: History },
          ] as { id: CleanerTab; label: string; icon: typeof ListTodo }[]).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => { setTab(t.id); setError(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => activeQuery.refetch()} disabled={activeQuery.isLoading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${activeQuery.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}

        {activeQuery.isLoading && <PageLoader />}
        {activeQuery.isError && <ErrorState onRetry={() => activeQuery.refetch()} />}

        {!activeQuery.isLoading && !activeQuery.isError && tab === 'tasks' && (
          tasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />} title="No active tasks assigned" description="Accepted assignments from your supervisor will appear here." />
          ) : (
            <div className="space-y-4">
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  report={t}
                  onOpen={() => setOpenId(t.id)}
                  action={
                    <TaskActions
                      task={t}
                      busy={busyId === t.id}
                      rejectReason={rejectReason[t.id] ?? ''}
                      onRejectReason={(v) => setRejectReason((p) => ({ ...p, [t.id]: v }))}
                      resolveNote={resolveNote[t.id] ?? ''}
                      onResolveNote={(v) => setResolveNote((p) => ({ ...p, [t.id]: v }))}
                      files={resolveFiles[t.id] ?? []}
                      onFiles={(f) => setResolveFiles((p) => ({ ...p, [t.id]: f }))}
                      attachLocation={!!attachLocation[t.id]}
                      onAttachLocation={(v) => setAttachLocation((p) => ({ ...p, [t.id]: v }))}
                      onRun={(action, body) => runTask(t.id, action, body)}
                      onResolve={() => handleResolve(t.id)}
                    />
                  }
                />
              ))}
            </div>
          )
        )}

        {!activeQuery.isLoading && !activeQuery.isError && tab === 'available' && (
          available.length === 0 ? (
            <EmptyState icon={<Search className="h-8 w-8 text-muted-foreground" />} title="No open reports right now" description="Unassigned reports you can volunteer for will appear here." />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Volunteering sends a request to your supervisor, who approves it by assigning the job to you.</p>
              {available.map((t) => (
                <TaskCard
                  key={t.id}
                  report={t}
                  onOpen={() => setOpenId(t.id)}
                  action={
                    t.has_pending_request ? (
                      <p className="text-xs font-medium text-amber-700">Request sent — waiting for supervisor approval.</p>
                    ) : (
                      <Button size="sm" onClick={() => handleVolunteer(t.id)} disabled={busyId === t.id} className="gap-1.5 min-h-11">
                        <HandHelping className="h-4 w-4" />
                        {busyId === t.id ? 'Sending…' : 'Volunteer for this job'}
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          )
        )}

        {!activeQuery.isLoading && !activeQuery.isError && tab === 'history' && (
          history.length === 0 ? (
            <EmptyState icon={<History className="h-8 w-8 text-muted-foreground" />} title="No completed work yet" description="Resolved jobs and their outcomes will appear here." />
          ) : (
            <div className="space-y-4">
              {history.map((t) => (
                <TaskCard key={t.id} report={t} onOpen={() => setOpenId(t.id)} />
              ))}
            </div>
          )
        )}

        <nav className="flex justify-center gap-4 border-t pt-4 text-xs">
          <Link to="/cleaner/tasks" className={`font-medium ${location.pathname === '/cleaner/tasks' ? 'text-primary' : 'text-muted-foreground'}`}>Tasks</Link>
          <Link to="/cleaner/account" className="text-muted-foreground hover:text-foreground">My Profile</Link>
        </nav>
      </main>

      {openId && <DetailModal reportId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function TaskActions({
  task, busy, rejectReason, onRejectReason, resolveNote, onResolveNote,
  files, onFiles, attachLocation, onAttachLocation, onRun, onResolve,
}: {
  task: V2ReportSummary;
  busy: boolean;
  rejectReason: string;
  onRejectReason: (v: string) => void;
  resolveNote: string;
  onResolveNote: (v: string) => void;
  files: File[];
  onFiles: (f: File[]) => void;
  attachLocation: boolean;
  onAttachLocation: (v: boolean) => void;
  onRun: (action: 'accept' | 'reject' | 'start' | 'resolve', body?: Record<string, unknown>) => void;
  onResolve: () => void;
}) {
  if (task.status === 'assigned') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onRun('accept')} disabled={busy} className="gap-1.5 min-h-11 flex-1">
            <Check className="mr-1 h-4 w-4" />{busy ? 'Working…' : 'Accept task'}
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            value={rejectReason}
            onChange={(e) => onRejectReason(e.target.value)}
            placeholder="Decline reason (min 3 chars)"
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-xs"
          />
          <Button size="sm" variant="outline" onClick={() => onRun('reject', { reason: rejectReason.trim() })} disabled={busy || rejectReason.trim().length < 3}>
            Decline
          </Button>
        </div>
      </div>
    );
  }
  if (task.status === 'accepted_by_cleaner' || task.status === 'rejected_by_supervisor') {
    return (
      <Button size="sm" onClick={() => onRun('start')} disabled={busy} className="gap-1.5 min-h-11 w-full gradient-bg text-white">
        <Play className="h-3.5 w-3.5" />{busy ? 'Starting…' : 'Start Cleaning Work'}
      </Button>
    );
  }
  if (task.status === 'in_progress') {
    return (
      <div className="space-y-2">
        <textarea
          value={resolveNote}
          onChange={(e) => onResolveNote(e.target.value)}
          placeholder="Resolution note (optional)"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
        />
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10">
          <Camera className="h-4 w-4" />
          <span>{files.length > 0 ? `${files.length}/6 photo(s) selected — change` : 'Upload Completion Proof (up to 6)'}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(Array.from(e.target.files ?? []).slice(0, 6))}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={attachLocation} onChange={(e) => onAttachLocation(e.target.checked)} />
          Attach my location to the resolution note
        </label>
        <Button size="sm" onClick={onResolve} disabled={busy || files.length === 0} className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 min-h-11">
          <Check className="h-4 w-4" />{busy ? 'Submitting…' : 'Submit for review'}
        </Button>
      </div>
    );
  }
  return null;
}
