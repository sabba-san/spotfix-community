import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { ThemeToggle } from '@/design-revamp/hooks/useTheme';
import { Button } from '@/design-revamp/components/ui/button';
import {
  ClipboardCheck,
  ClipboardList,
  CircleUserRound,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Send,
  ShieldAlert,
  ShieldCheck,
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
    subtitle: string;
    icon: typeof Home;
    iconClass: string;
    links: { to: string; label: string; icon: typeof Home }[];
  }
> = {
  cleaner: {
    title: 'SpotFix Field',
    subtitle: 'Cleaner Operations',
    icon: ClipboardCheck,
    iconClass: 'bg-amber-500/10 text-amber-600',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/cleaner/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/cleaner/account', label: 'My Profile', icon: CircleUserRound },
    ],
  },
  supervisor: {
    title: 'SpotFix Operations',
    subtitle: 'Supervisor Desk',
    icon: ShieldAlert,
    iconClass: 'bg-teal-500/10 text-teal-600',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: Home },
      { to: '/supervisor/tasks', label: 'Triage Board', icon: ClipboardList },
      { to: '/supervisor/dispatch', label: 'Dispatch', icon: Send },
      { to: '/supervisor/reviews', label: 'Reviews', icon: Inbox },
      { to: '/supervisor/workforce', label: 'Workforce Roster', icon: Users },
      { to: '/supervisor/onboard', label: 'Onboard Staff', icon: UserPlus },
      { to: '/supervisor/account', label: 'Account', icon: CircleUserRound },
    ],
  },
  master: {
    title: 'SpotFix Control Room',
    subtitle: 'Admin Administration',
    icon: ShieldCheck,
    iconClass: 'bg-indigo-500/10 text-indigo-600',
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
 * Shared top header for role workspace pages (same links, active-state, and
 * sign-out as the per-page headers). Guarantees every role page — including
 * the account pages — has a tab back to Dashboard.
 */
export function RoleHeader({ role }: { role: RoleHeaderRole }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const config = ROLE_CONFIG[role];
  const BrandIcon = config.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg font-bold', config.iconClass)}>
            <BrandIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight">{config.title}</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">{config.subtitle}</span>
          </div>
        </div>
        <nav
          className="order-3 flex w-full items-center gap-1 overflow-x-auto lg:order-none lg:w-auto"
          aria-label={`${config.title} navigation`}
        >
          {config.links.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.98]',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {user?.name}
            {role === 'master' ? ' (Admin)' : ''}
          </span>
          <ThemeToggle />
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
  );
}
