import { useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { useUsers } from '@/design-revamp/hooks/useReports';
import { PageLoader } from '@/design-revamp/components/feedback/PageLoader';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { EmptyState } from '@/design-revamp/components/feedback/EmptyState';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  ShieldCheck,
  LayoutDashboard,
  Users2,
  UserPlus,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Search,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data: users, isLoading, isError, refetch } = useUsers();

  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allUsers = (users || []) as any[];

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'All' && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchId = u.idNumber?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      return matchName || matchId || matchEmail;
    }
    return true;
  });

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
              User Identity Directory
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Enrolled residents, field cleaners, supervisors, and control room accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="gradient-bg text-white gap-1.5 active:scale-[0.98]">
              <Link to="/admin/onboard">
                <UserPlus className="h-4 w-4" />
                Provision Staff
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

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role:</span>
            {['All', 'Public', 'Cleaner', 'Supervisor', 'Master'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.98] ${
                  roleFilter === r
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, ID, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* User List */}
        {isLoading && <PageLoader />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && filteredUsers.length === 0 && (
          <EmptyState
            icon={<Users2 className="h-8 w-8 text-muted-foreground" />}
            title="No users match search"
            description="Clear the search query or role filter to view all enrolled accounts."
          />
        )}

        {!isLoading && !isError && filteredUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const roleColor =
                u.role === 'master'
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : u.role === 'supervisor'
                  ? 'border-teal-300 bg-teal-50 text-teal-700'
                  : u.role === 'cleaner'
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-slate-300 bg-slate-50 text-slate-700';

              return (
                <div
                  key={u._id || u.id}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{u.name}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        ID: {u.idNumber || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[11px] capitalize ${roleColor}`}>
                      {u.role || 'Public'}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1 border-t pt-2 text-muted-foreground">
                    {u.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </p>
                    )}
                    {u.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{u.phone}</span>
                      </p>
                    )}
                    {u.workLocation && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span>{u.workLocation}</span>
                      </p>
                    )}
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
