import { ReactNode } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { Button } from '@/design-revamp/components/ui/button';
import { MapPin, LogOut, User, ClipboardList, Home } from 'lucide-react';
import { cn } from '@/design-revamp/lib/utils';

export function PublicLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const homeRoute = user ? '/dashboard' : '/';
  const navItems = [
    { to: homeRoute, icon: Home, label: user ? 'Dashboard' : 'Home' },
    { to: '/submit', icon: MapPin, label: 'Submit Issue' },
    { to: '/status', icon: ClipboardList, label: 'Live Status' },
    { to: '/my-reports', icon: User, label: 'My Reports' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {/* Top Header - Max height 60px */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to={homeRoute} className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-sm">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground">SpotFix</span>
              <span className="hidden text-[11px] font-mono uppercase tracking-wider text-muted-foreground sm:inline">
                Community
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.98]',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile / Logout */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline font-medium">
                  {user.name.split(' ')[0]} ({user.role})
                </span>
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
            ) : (
              <Button asChild size="sm" className="h-8 text-xs gradient-bg shadow-accent hover:brightness-110 active:scale-[0.98]">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 mb-16 md:mb-6">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-lg',
          'flex items-center justify-around px-2 py-1.5',
        )}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors active:scale-[0.98]',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
