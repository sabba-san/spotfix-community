import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useReports, useCleaners, useUsers } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Users2,
  UserPlus,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Server,
  Activity,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AdminOverviewPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data: reports, isLoading: isLoadingReports, isError, refetch: refetchReports } = useReports();
  const { data: cleaners, refetch: refetchCleaners } = useCleaners();
  const { data: users, refetch: refetchUsers } = useUsers();

  const allReports = reports || [];
  const allCleaners = cleaners || [];
  const allUsers = users || [];

  const totalReports = allReports.length;
  const resolvedReports = allReports.filter((r) => r.status === 'Resolved').length;
  const pendingReports = allReports.filter((r) => r.status === 'Reported').length;
  const inProgressReports = allReports.filter((r) => r.status === 'In Progress' || r.status === 'Assigned').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 100;

  const navLinks = [
    { to: '/admin/overview', label: 'Control Center', icon: LayoutDashboard },
    { to: '/admin/users', label: 'User Directory', icon: Users2 },
    { to: '/admin/onboard', label: 'Staff Provisioning', icon: UserPlus },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 font-bold">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">SpotFix Control Room</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
                Master Administration
              </span>
            </div>
          </div>

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
              {user?.name} (Master)
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
              Community Health & Infrastructure Overview
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Campus-wide municipal reporting metrics, workforce capacity, and system analytics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchReports();
                refetchCleaners();
                refetchUsers();
              }}
              disabled={isLoadingReports}
              className="active:scale-[0.98] text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReports ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Incidents</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{totalReports}</p>
            <span className="text-[11px] text-muted-foreground">Recorded across campus</span>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Resolution Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{resolutionRate}%</p>
            <span className="text-[11px] text-muted-foreground">{resolvedReports} resolved cases</span>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Field Workforce</span>
              <Users2 className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{allCleaners.length}</p>
            <span className="text-[11px] text-muted-foreground">Registered cleaners</span>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">User Directory</span>
              <Server className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{allUsers.length}</p>
            <span className="text-[11px] text-muted-foreground">Accounts enrolled</span>
          </div>
        </div>

        {/* Work Breakdown & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Recent Incidents Log</h2>
            {isLoadingReports && <PageLoader />}
            {isError && <ErrorState onRetry={() => refetchReports()} />}
            {!isLoadingReports && allReports.length === 0 && (
              <p className="text-xs text-muted-foreground">No reports recorded yet.</p>
            )}
            {!isLoadingReports && allReports.length > 0 && (
              <div className="space-y-2.5">
                {allReports.slice(0, 5).map((r) => (
                  <div
                    key={r._id || r.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{r.category}</span>
                      <span className="text-muted-foreground ml-2">({r.location || 'Campus'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {r.priority}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          r.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Infrastructure Health Status */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Operations Health</h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Core API Server</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Online</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Database Sync</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Pending Triages</span>
                <span className="font-semibold text-amber-600">{pendingReports}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Dispatched Tasks</span>
                <span className="font-semibold text-blue-600">{inProgressReports}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
