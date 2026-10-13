import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useCleaners } from '@/design-revamp/hooks/useReports';
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
  Phone,
  Briefcase,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SupervisorWorkforcePage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data: cleaners, isLoading, isError, refetch } = useCleaners();

  const allCleaners = cleaners || [];
  const busyCount = allCleaners.filter((c) => c.status === 'Busy').length;
  const availableCount = allCleaners.filter((c) => c.status !== 'Busy').length;

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Workforce Roster & Duty Status
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Active cleaning crew deployment across campus blocks and facility zones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="gradient-bg text-white gap-1.5 active:scale-[0.98]">
              <Link to="/supervisor/onboard">
                <UserPlus className="h-4 w-4" />
                Add Cleaner
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="active:scale-[0.98]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Status Count Cards */}
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

        {!isLoading && !isError && allCleaners.length === 0 && (
          <EmptyState
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            title="No cleaners enrolled yet"
            description="Onboard your first cleaning staff member using the button above."
          />
        )}

        {!isLoading && !isError && allCleaners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCleaners.map((cleaner) => {
              const isBusy = cleaner.status === 'Busy';

              return (
                <div
                  key={cleaner._id}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{cleaner.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        Staff ID: {cleaner.workId || 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isBusy
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {cleaner.status}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1.5 border-t pt-2.5 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{cleaner.workLocation || 'General Facilities'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{cleaner.phone || 'Phone not registered'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Task: {cleaner.assignedTaskId || 'None active'}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
