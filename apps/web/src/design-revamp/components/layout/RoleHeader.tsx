import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { ThemeToggle } from '@/design-revamp/hooks/useTheme';
import { Button } from '@/design-revamp/components/ui/button';
import {
  ClipboardList,
  CircleUserRound,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MapPin,
  Send,
  UserPlus,
  Users,
  Users2,
} from 'lucide-react';
import { cn } from '@/design-revamp/lib/utils';

export type RoleHeaderRole = 'cleaner' | 'supervisor' | 'master';

const ROLE_CONFIG: Record<
  RoleHeaderRole,
  {
    title: string;
    badge: string;
    links: { to: string; label: string; icon: typeof Home }[];
  }
> = {
  cleaner: {
    title: 'SpotFix Field',
    badge: 'Field Staff',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/cleaner/tasks', label: 'My Tasks', icon: ListTodo },
      { to: '/cleaner/account', label: 'Profile', icon: CircleUserRound },
    ],
  },
  supervisor: {
    title: 'SpotFix Operations',
    badge: 'Supervisor',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/supervisor/tasks', label: 'Triage', icon: ClipboardList },
      { to: '/supervisor/dispatch', label: 'Dispatch', icon: Send },
      { to: '/supervisor/reviews', label: 'Reviews', icon: Inbox },
      { to: '/supervisor/workforce', label: 'Workforce', icon: Users },
      { to: '/supervisor/onboard', label: 'Onboard', icon: UserPlus },
      { to: '/supervisor/account', label: 'Account', icon: CircleUserRound },
    ],
  },
  master: {
    title: 'SpotFix Control Room',
    badge: 'Control Room',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users', icon: Users2 },
      { to: '/admin/onboard', label: 'Onboarding', icon: UserPlus },
      { to: '/admin/control', label: 'Control', icon: KeyRound },
      { to: '/admin/account', label: 'Account', icon: CircleUserRound },
    ],
  },
};

/**
 * Unified top header for staff workspace roles.
 * - Desktop: Clean h-14 top brand bar + slim h-10 secondary tab strip
 * - Mobile: Unified h-14 top bar + persistent bottom navigation bar
 */
export function RoleHeader({ role }: { role: RoleHeaderRole }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const config = ROLE_CONFIG[role];

  return (
    <>
      {/* Top Header - Exact 56px (h-14) height matching PublicLayout */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-sm">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground">SpotFix</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
                {config.badge}
              </span>
            </div>
          </Link>

          {/* User profile & actions */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden text-xs text-muted-foreground sm:inline font-medium">
                {user.name.split(' ')[0]} ({role === 'master' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)})
              </span>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive active:scale-[0.98]"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Desktop Secondary Navigation Strip (h-10) */}
        <nav
          className="hidden md:flex border-t border-border/40 bg-muted/20 backdrop-blur-xs"
          aria-label={`${config.title} workspace navigation`}
        >
          <div className="mx-auto flex h-10 w-full max-w-6xl items-center gap-1.5 px-4 sm:px-6 overflow-x-auto">
            {config.links.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.98]',
                    isActive
                      ? 'bg-background text-primary font-semibold shadow-2xs border border-border/80'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-lg flex items-center justify-around px-1 py-1 min-h-[56px] overflow-x-auto no-scrollbar"
        aria-label={`${config.title} mobile navigation`}
      >
        {config.links.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-h-[46px] min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] font-medium transition-colors active:scale-[0.98]',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-[62px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
