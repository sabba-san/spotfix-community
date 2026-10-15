import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
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
  ShieldAlert,
  ClipboardList,
  Users,
  UserPlus,
  Home,
  Inbox,
  RefreshCw,
  LogOut,
  MapPin,
  CheckCircle2,
  CircleUserRound,
  Send,
} from 'lucide-react';

/** Supervisor review queue — resolutions awaiting endorsement + volunteer requests. */
export default function SupervisorReviewsPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const reviewsQuery = useSupervisorReportsV2('resolved_by_cleaner');

  const reports = reviewsQuery.data?.reports ?? [];

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/supervisor/tasks', label: 'Triage Board', icon: ClipboardList },
    { to: '/supervisor/dispatch', label: 'Dispatch', icon: Send },
    { to: '/supervisor/reviews', label: 'Reviews', icon: Inbox, badge: reports.length },
    { to: '/supervisor/workforce', label: 'Workforce Roster', icon: Users },
    { to: '/supervisor/onboard', label: 'Onboard Staff', icon: UserPlus },
    { to: '/supervisor/account', label: 'Account', icon: CircleUserRound },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 font-bold">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Operations</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Reviews</span>
            </div>
          </div>
          <nav className="flex max-w-[55vw] items-center gap-1 overflow-x-auto" aria-label="Supervisor navigation">
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
                  {!!item.badge && item.badge > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">{user?.name}</span>
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

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Resolution Reviews</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Cleaner-submitted resolutions awaiting your endorsement. Open a report to endorse or request rework.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => reviewsQuery.refetch()} disabled={reviewsQuery.isLoading} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${reviewsQuery.isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
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
      </main>

      {selectedReportId && (
        <ReportDetailDialog reportId={selectedReportId} assignTools={false} onClose={() => setSelectedReportId(null)} />
      )}
    </div>
  );
}
