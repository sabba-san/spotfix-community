import { RoleHeader } from '@/design-revamp/components/layout/RoleHeader';
import { AccountCard } from '@/design-revamp/components/composites/AccountCard';

export default function SupervisorAccountPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <RoleHeader role="supervisor" />
      <main className="flex-1">
        <AccountCard />
      </main>
    </div>
  );
}
