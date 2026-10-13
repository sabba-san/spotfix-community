import { Loader2 } from 'lucide-react';
import { cn } from '@/design-revamp/lib/utils';

export function PageLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
