import { Link } from 'react-router-dom';
import {
  MapPin,
  Camera,
  ClipboardCheck,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import { usePublicStatusBoard } from '@/design-revamp/hooks/useReports';
import { StatusBoard } from '@/design-revamp/components/composites/StatusBoard';

function PublicStatusSection() {
  return (
    <section className="w-full py-8 md:py-14 bg-muted/20 border-y border-border/40">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <StatusBoard />
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { data: board } = usePublicStatusBoard();
  const resolvedCount = board?.summary?.resolved ?? 2400;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-bg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              SpotFix
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="gradient-bg">
              <Link to="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />

          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                  Civic Infrastructure
                </span>
              </div>

              <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.75rem]">
                Report issues.{' '}
                <span className="gradient-text">Keep your community</span>{' '}
                clean.
              </h1>

              <p className="max-w-lg text-lg leading-relaxed text-muted-foreground lg:text-xl">
                SpotFix connects reporters, staff, and administrators in one
                streamlined workflow. Snap a photo, pin a location, and track
                resolution in real time.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-14 gradient-bg px-8 text-base shadow-accent hover:shadow-accent-lg hover:brightness-110"
                >
                  <Link to="/login" className="group flex items-center gap-2">
                    Start Reporting
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base">
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-2">
                  {['AK', 'SM', 'RJ', 'TL'].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-semibold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{resolvedCount.toLocaleString()}+ reports</p>
                  <p className="text-muted-foreground">resolved this month</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-80 w-80 animate-[spin_60s_linear_infinite] rounded-full border-2 border-dashed border-accent/20" />
              </div>
              <div className="relative space-y-4">
                <div className="animate-[float_5s_ease-in-out_infinite] rounded-2xl border bg-card p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-bg">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">New Report</p>
                      <p className="text-sm text-muted-foreground">Litter · Block A, Level 2</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-20 flex-1 rounded-lg bg-muted" />
                    <div className="h-20 flex-1 rounded-lg bg-muted" />
                    <div className="h-20 flex-1 rounded-lg bg-muted" />
                  </div>
                </div>
                <div className="ml-8 animate-[float_4s_ease-in-out_infinite] rounded-2xl border bg-card p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                      <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Resolved</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legacy-parity Public Status Section with 5-Tab Strip & 6-Metric Board */}
        <PublicStatusSection />

        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-5xl">
                From report to resolution
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Camera,
                  title: 'Capture',
                  desc: 'Snap a photo, add details, and pin the exact location on the map.',
                },
                {
                  icon: Users,
                  title: 'Route',
                  desc: 'Supervisors review incoming reports and assign the right cleaner instantly.',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Resolve',
                  desc: 'Cleaners complete tasks with photo evidence. Everyone tracks progress live.',
                },
              ].map((step, i) => (
                <div
                  key={step.title}
                  className="group relative rounded-2xl border bg-card p-8 transition-all hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-accent transition-transform group-hover:scale-110">
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.desc}</p>
                  <span className="absolute right-6 top-6 text-4xl font-bold text-muted/20">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-20 lg:py-32">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent">
                  For every role
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-5xl">
                  Built for your entire team
                </h2>
                <p className="mt-4 max-w-md text-lg text-muted-foreground">
                  One platform for reporters, supervisors, cleaners, and administrators.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Sparkles, title: 'Public Reporters', desc: 'Submit geo-tagged reports with photo evidence.' },
                  { icon: Users, title: 'Supervisors', desc: 'Review, assign, and manage cleaner rosters.' },
                  { icon: Shield, title: 'Cleaners', desc: 'Focus on assigned tasks with evidence-first workflow.' },
                  { icon: Zap, title: 'Admins', desc: 'Tenant-wide oversight, registry, and provisioning.' },
                ].map((role) => (
                  <div key={role.title} className="rounded-xl border bg-card p-5 transition-all hover:shadow-lg">
                    <role.icon className="h-5 w-5 text-accent" />
                    <h3 className="mt-3 font-semibold">{role.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight lg:text-5xl">
              Ready to make a difference?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
              Join thousands of community members keeping their spaces clean.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                className="h-14 gradient-bg px-8 text-base shadow-accent hover:shadow-accent-lg hover:brightness-110"
              >
                <Link to="/login" className="group flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded gradient-bg">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold">SpotFix</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 SpotFix Community. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
