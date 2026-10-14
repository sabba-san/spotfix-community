import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useReports, useCleaners, useAssignCleaner, useUpdateReport } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldAlert,
  ClipboardList,
  Users,
  UserPlus,
  RefreshCw,
  LogOut,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SupervisorTaskBoardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data: reports, isLoading: isLoadingReports, isError, refetch } = useReports();
  const { data: cleaners, refetch: refetchCleaners } = useCleaners();
  const assignCleanerMutation = useAssignCleaner();
  const updateReportMutation = useUpdateReport();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const allReports = reports || [];
  const allCleaners = cleaners || [];

  const pendingCount = allReports.filter((r) => r.status === 'Reported').length;
  const inProgressCount = allReports.filter((r) => r.status === 'In Progress' || r.status === 'Assigned').length;
  const resolvedCount = allReports.filter((r) => r.status === 'Resolved').length;
  const availableCleanersCount = allCleaners.filter((c) => c.status !== 'Busy').length;

  const filteredReports = allReports.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && r.priority !== priorityFilter) return false;
    return true;
  });

  const handleAssign = async (cleanerId: string, reportId: string) => {
    if (!cleanerId || !reportId) return;
    setAssigningId(reportId);
    try {
      await assignCleanerMutation.mutateAsync({ cleanerId, reportId });
      refetch();
      refetchCleaners();
    } finally {
      setAssigningId(null);
    }
  };

  const handleReview = async (reportId: string, status: 'Resolved' | 'Rejected') => {
    setReviewingId(reportId);
    try {
      await updateReportMutation.mutateAsync({ reportId, body: { status } });
    } finally {
      setReviewingId(null);
    }
  };

  const navLinks = [
    { to: '/supervisor/tasks', label: 'Triage Board', icon: ClipboardList },
    { to: '/supervisor/workforce', label: 'Workforce Roster', icon: Users },
    { to: '/supervisor/onboard', label: 'Onboard Staff', icon: UserPlus },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 font-bold">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Operations</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                Supervisor Desk
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive active:scale-[0.98]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Metric Overview Strip */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Incident Dispatch & Triage
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Review verified community complaints and assign active field cleaners to open zones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetch();
                  refetchCleaners();
                }}
                disabled={isLoadingReports}
                className="gap-1.5 text-xs active:scale-[0.98]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReports ? 'animate-spin' : ''}`} />
                Refresh Board
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-5">
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Pending Triage</span>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">In Progress</span>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Resolved Total</span>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{resolvedCount}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <span className="text-xs text-muted-foreground font-medium">Available Cleaners</span>
              <p className="text-2xl font-bold text-teal-600 mt-0.5">{availableCleanersCount} / {allCleaners.length}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
            {['All', 'Reported', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
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
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority:</span>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => setPriorityFilter(pr)}
                className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-all active:scale-[0.98] ${
                  priorityFilter === pr
                    ? 'bg-foreground text-background font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Table / List */}
        {isLoadingReports && <PageLoader />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoadingReports && !isError && filteredReports.length === 0 && (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            title="No reports matching filter"
            description="Adjust the filter criteria above or wait for new reports from the community."
          />
        )}

        {!isLoadingReports && !isError && filteredReports.length > 0 && (
          <div className="space-y-3">
            {filteredReports.map((report) => {
              const id = report.id || report._id;
              const isAssigned = !!report.assignedTo;
              const isResolved = report.status === 'Resolved';
              const isBusy = assigningId === id;

              return (
                <article
                  key={id}
                  className="rounded-xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">{id}</span>
                        <h3 className="font-semibold text-sm text-foreground">{report.category}</h3>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${
                            report.priority === 'Critical'
                              ? 'border-rose-300 bg-rose-50 text-rose-700 font-bold'
                              : report.priority === 'High'
                              ? 'border-amber-300 bg-amber-50 text-amber-700 font-semibold'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {report.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${
                            isResolved
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-blue-200 bg-blue-50 text-blue-700'
                          }`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{report.location || 'Location not specified'}</span>
                      </p>
                      <p className="text-xs text-foreground/90 pt-1">{report.details}</p>

                      {report.evidencePhoto && report.resolutionPhoto && (
                        <div className="mt-3 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Before and after">
                          <figure className="overflow-hidden rounded-lg border">
                            <img src={report.evidencePhoto} alt="Before cleaning" className="h-28 w-full object-cover" />
                            <figcaption className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">Before</figcaption>
                          </figure>
                          <figure className="overflow-hidden rounded-lg border">
                            <img src={report.resolutionPhoto} alt="After cleaning" className="h-28 w-full object-cover" />
                            <figcaption className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">After</figcaption>
                          </figure>
                        </div>
                      )}
                    </div>

                    {/* Cleaner Assignment Block */}
                    {!isResolved && (
                      <div className="flex flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <span className="text-[11px] text-muted-foreground">
                          {isAssigned ? `Assigned: ${report.assignedTo}` : 'Dispatch Cleaner:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue=""
                            disabled={isBusy}
                            onChange={(e) => {
                              if (e.target.value) handleAssign(e.target.value, id);
                              e.target.value = '';
                            }}
                            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Select cleaner to assign...</option>
                            {allCleaners.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name} ({c.workLocation || 'General'}) - {c.status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {report.status === 'Awaiting Endorsement' && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-12 bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={reviewingId === id}
                          onClick={() => handleReview(id, 'Resolved')}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Endorse resolution
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="min-h-12 border-destructive/40 text-destructive hover:bg-destructive/10"
                          disabled={reviewingId === id}
                          onClick={() => handleReview(id, 'Rejected')}
                        >
                          Reject resolution
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
