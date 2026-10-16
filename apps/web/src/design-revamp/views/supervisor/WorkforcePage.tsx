import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useSupervisorCleanersV2 } from '@/design-revamp/hooks/useV2';
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
  MapPin,
  Phone,
  Briefcase,
  CircleUserRound,
  Send,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SupervisorWorkforcePage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const { data: cleaners, isLoading, isError, error, refetch } = useSupervisorCleanersV2(appliedSearch);

  const allCleaners = cleaners ?? [];
  const busyCount = allCleaners.filter((c) => c.is_busy).length;
  const availableCount = allCleaners.filter((c) => !c.is_busy).length;

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Workforce Roster & Duty Status</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Cleaner accounts with live availability from active assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gradient-bg text-white gap-1.5 active:scale-[0.98]">
            <Link to="/supervisor/onboard">
              <UserPlus className="h-4 w-4" />
              Add Cleaner
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="active:scale-[0.98]">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedSearch(search.trim() || undefined);
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or zone…"
          aria-label="Search cleaners"
          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button type="submit" size="sm" variant="outline" className="h-10">Search</Button>
      </form>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground font-medium">Total Cleaners</span>
          <p className="text-2xl font-bold text-foreground mt-0.5">{allCleaners.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground font-medium">Available for Dispatch</span>
          <p className="text-2xl font-bold text-emerald-600 mt-0.5">{availableCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground font-medium">Engaged on Duty</span>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{busyCount}</p>
        </div>
      </div>

      {isLoading && <PageLoader />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && (
        <RoleErrorBanner errors={[error]} expectedRole="supervisor" onReconnect={() => refetch()} />
      )}

      {!isLoading && !isError && allCleaners.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          title="No cleaners enrolled yet"
          description="Onboard your first cleaning staff member using the button above."
        />
      )}

      {!isLoading && !isError && allCleaners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCleaners.map((cleaner) => (
            <div key={cleaner.user_id} className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{cleaner.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">ID: {cleaner.id_number}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    cleaner.is_busy
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {cleaner.is_busy ? 'Busy' : 'Available'}
                </Badge>
              </div>
              <div className="text-xs space-y-1.5 border-t pt-2.5 text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{cleaner.work_location || 'General Facilities'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{cleaner.phone || 'Phone not registered'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {cleaner.active_task_count > 0
                      ? `${cleaner.active_task_count} active task${cleaner.active_task_count === 1 ? '' : 's'}`
                      : 'No active tasks'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}