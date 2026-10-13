import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useReports, useUpdateReport } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  Camera,
  Play,
  Check,
  Upload,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CleanerTasksPage() {
  const { user, logout } = useAuth();
  const { data: reports, isLoading, isError, refetch } = useReports();
  const updateReport = useUpdateReport();

  const [resolutionPhoto, setResolutionPhoto] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'account'>('my-tasks');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter tasks assigned to cleaner or in their location
  const cleanerReports = (reports || []).filter((r) => {
    if (!user) return false;
    const isAssigned =
      r.assignedTo === user.idNumber ||
      r.assignedTo === user.name ||
      (user.workLocation && r.location?.toLowerCase().includes(user.workLocation.toLowerCase()));
    return isAssigned || r.status !== 'Resolved';
  });

  const assignedCount = cleanerReports.length;
  const resolvedCount = cleanerReports.filter((r) => r.status === 'Resolved').length;
  const activeCount = cleanerReports.filter((r) => r.status !== 'Resolved').length;

  const handleStartTask = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      await updateReport.mutateAsync({
        reportId,
        body: { status: 'In Progress' },
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoSelect = (reportId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setResolutionPhoto((prev) => ({
        ...prev,
        [reportId]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResolveTask = async (reportId: string) => {
    setActionLoading(reportId);
    try {
      await updateReport.mutateAsync({
        reportId,
        body: {
          status: 'Resolved',
          resolutionPhoto: resolutionPhoto[reportId] || undefined,
        },
      });
      setResolutionPhoto((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Cleaner Field Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
              <ClipboardCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Field</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                Cleaner Operations
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {user?.name} ({user?.workLocation || 'Assigned Zone'})
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

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-6">
        {/* Cleaner Summary Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Task Command Center
                </h1>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-xs">
                  Field Staff
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Staff ID: {user?.idNumber || 'N/A'} | Zone: {user?.workLocation || 'General Facilities'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-1.5 text-xs active:scale-[0.98]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Tasks
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 mt-5">
            <div className="rounded-xl border bg-muted/30 p-3 text-center">
              <span className="text-[11px] font-medium text-muted-foreground">Assigned</span>
              <p className="text-xl font-bold tabular-nums text-foreground mt-0.5">{assignedCount}</p>
            </div>
            <div className="rounded-xl border bg-amber-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Active</span>
              <p className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300 mt-0.5">{activeCount}</p>
            </div>
            <div className="rounded-xl border bg-emerald-500/5 p-3 text-center">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Resolved</span>
              <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300 mt-0.5">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-1.5 rounded-xl bg-muted/60 p-1 max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab('my-tasks')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${
              activeTab === 'my-tasks'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Duty Tasks ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all active:scale-[0.98] ${
              activeTab === 'account'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Profile
          </button>
        </div>

        {activeTab === 'account' ? (
          <Card className="border border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Staff Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Staff ID / Login</span>
                <span className="font-mono">{user?.idNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Assigned Location</span>
                <span>{user?.workLocation || 'General Facilities'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Role Type</span>
                <span className="capitalize">{user?.role}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {isLoading && <PageLoader />}
            {isError && <ErrorState onRetry={() => refetch()} />}

            {!isLoading && !isError && cleanerReports.length === 0 && (
              <EmptyState
                icon={<CheckCircle2 className="h-8 w-8 text-emerald-600" />}
                title="No active tasks assigned"
                description="All reported incidents in your zone are currently resolved. Check back soon for new assignments."
              />
            )}

            {!isLoading && !isError && cleanerReports.length > 0 && (
              <div className="space-y-4">
                {cleanerReports.map((report) => {
                  const id = report.id || report._id;
                  const isResolved = report.status === 'Resolved';
                  const isInProgress = report.status === 'In Progress';
                  const isStarting = actionLoading === id;

                  return (
                    <article
                      key={id}
                      className={`rounded-2xl border bg-card p-5 transition-all shadow-sm ${
                        isResolved ? 'opacity-70 border-border/60' : 'border-border/90 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-base">{report.category}</h3>
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-semibold ${
                                isResolved
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isInProgress
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-blue-200 bg-blue-50 text-blue-700'
                              }`}
                            >
                              {report.status}
                            </Badge>
                          </div>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{report.location || 'Location not specified'}</span>
                          </p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{id}</span>
                      </div>

                      <p className="mt-3 text-sm text-foreground/90">{report.details}</p>

                      {/* Photo evidence from reporter */}
                      {report.evidencePhoto && (
                        <div className="mt-3">
                          <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Reporter Evidence:
                          </span>
                          <img
                            src={report.evidencePhoto}
                            alt="Reporter evidence"
                            className="h-24 w-24 object-cover rounded-lg border border-border"
                          />
                        </div>
                      )}

                      {/* Actions for cleaner */}
                      {!isResolved && (
                        <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          {!isInProgress ? (
                            <Button
                              size="sm"
                              onClick={() => handleStartTask(id)}
                              disabled={isStarting}
                              className="gradient-bg text-white gap-1.5 active:scale-[0.98]"
                            >
                              <Play className="h-3.5 w-3.5" />
                              {isStarting ? 'Starting...' : 'Start Cleaning Work'}
                            </Button>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
                              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 text-primary text-xs font-medium cursor-pointer hover:bg-primary/10 transition-colors">
                                <Camera className="h-4 w-4" />
                                <span>{resolutionPhoto[id] ? 'Replace Proof Photo' : 'Upload Completion Proof'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoSelect(id, e)}
                                />
                              </label>

                              {resolutionPhoto[id] && (
                                <img
                                  src={resolutionPhoto[id]}
                                  alt="Proof preview"
                                  className="h-10 w-10 object-cover rounded-md border"
                                />
                              )}

                              <Button
                                size="sm"
                                onClick={() => handleResolveTask(id)}
                                disabled={isStarting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 active:scale-[0.98]"
                              >
                                <Check className="h-4 w-4" />
                                {isStarting ? 'Updating...' : 'Mark Resolved'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
