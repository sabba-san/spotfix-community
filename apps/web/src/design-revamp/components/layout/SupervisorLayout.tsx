import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { RoleHeader } from '@/design-revamp/components/layout/RoleHeader';

export function SupervisorLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <RoleHeader role="supervisor" />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}