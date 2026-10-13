import { useState } from 'react';
import { RefreshCw, FileText, Plus, Filter } from 'lucide-react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useMyReports } from '@/design-revamp/hooks/useReports';
import { Button } from '@/design-revamp/components/ui/button';
import { ReportRow } from '@/design-revamp/components/composites/ReportRow';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Link } from 'react-router-dom';

const FILTER_TABS = ['All', 'Reported', 'Assigned', 'In Progress', 'Resolved'] as const;

export default function MyReportsPage() {
  const { user } = useAuth();
  const { data: reports, isLoading, isError, refetch } = useMyReports(user?.id);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>('All');

  const filteredReports = (reports || []).filter((r) => {
    if (activeFilter === 'All') return true;
    return r.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Reported Issues</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track resolution lifecycle, cleaner dispatch updates, and completion photos.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild className="gradient-bg shadow-accent hover:brightness-110 active:scale-[0.98]">
            <Link to="/submit" className="gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              New Report
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            className="active:scale-[0.98]"
            title="Refresh reports"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Chips */}
      {reports && reports.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-1" />
          {FILTER_TABS.map((tab) => {
            const count =
              tab === 'All'
                ? reports.length
                : reports.filter((r) => r.status === tab).length;
            const isSelected = activeFilter === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.98] shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected ? 'bg-primary-foreground/20 text-white' : 'bg-background text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Report Rows */}
      {isLoading && <PageLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && reports?.length === 0 && (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title="No incident reports found"
          description="You have not submitted any community reports yet. When you notice an issue, submit it to dispatch cleaners."
          action={
            <Button asChild className="gradient-bg shadow-accent mt-3 active:scale-[0.98]">
              <Link to="/submit">Submit First Report</Link>
            </Button>
          }
        />
      )}
      {!isLoading && !isError && reports && reports.length > 0 && filteredReports.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
          <p className="text-sm">No reports match the &ldquo;{activeFilter}&rdquo; status filter.</p>
          <Button variant="ghost" size="sm" onClick={() => setActiveFilter('All')} className="mt-2 text-primary">
            Clear filter
          </Button>
        </div>
      )}
      {!isLoading && !isError && filteredReports.length > 0 && (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportRow key={report._id || report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
