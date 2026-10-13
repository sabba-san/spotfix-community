import { StatusBoard } from '@/design-revamp/components/composites/StatusBoard';
import { Button } from '@/design-revamp/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatusBoardPage() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg shadow-sm">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground">SpotFix</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
                Public Transparency
              </span>
            </div>
          </Link>

          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs active:scale-[0.98]">
            <Link to="/login">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sign in portal</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full p-4 md:p-6 lg:p-8">
        <StatusBoard />
      </main>
    </div>
  );
}
