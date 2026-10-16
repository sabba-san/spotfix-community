import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { RoleHeader } from '@/design-revamp/components/layout/RoleHeader';

export function CleanerLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <RoleHeader role="cleaner" />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 pb-20 md:pb-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}