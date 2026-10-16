import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { provisionUser, createCleaner } from '@/design-revamp/lib/api';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';
import {
  ShieldAlert,
  ClipboardList,
  Users,
  UserPlus,
  Home,
  Inbox,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  CircleUserRound,
} from 'lucide-react';

export default function SupervisorOnboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [name, setName] = useState('');
  const [workId, setWorkId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !idNumber.trim() || !password) return;

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // v2-visible path: provisioning a UserAccount with role 'cleaner' is
      // what the supervisor roster/dispatch lists (v1 column lift in the
      // workforce service), so the new cleaner appears immediately without
      // any extra step.
      await provisionUser({
        name: name.trim(),
        workId: workId.trim() || idNumber.trim(),
        idNumber: idNumber.trim(),
        phone: phone.trim(),
        workLocation: workLocation.trim(),
        password,
        role: 'cleaner',
      });

      try {
        await createCleaner({
          name: name.trim(),
          workId: workId.trim() || idNumber.trim(),
          phone: phone.trim(),
          workLocation: workLocation.trim(),
          supervisorId: user?.id,
        });
      } catch {
        // ignore duplicate cleaner profile creation if handled by provision
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/supervisor/workforce');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to onboard staff member. Check credentials and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Onboard Cleaner Staff
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register field personnel credentials and designate primary zone coverage.
        </p>
      </div>

      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Staff Enrolment Form</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Staff registered successfully! Redirecting to workforce roster...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <input
                id="staff-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. David Miller"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="work-id">Work Staff ID</Label>
                <input
                  id="work-id"
                  type="text"
                  required
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  placeholder="e.g. CLN-104"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-id">Login Identification</Label>
                <input
                  id="login-id"
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. S9876543A"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone Number</Label>
                <input
                  id="staff-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +65 9123 4567"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-zone">Assigned Zone / Facility</Label>
                <input
                  id="staff-zone"
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="e.g. Block C, Level 1-3"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-pass">Temporary Initial Password</Label>
              <input
                id="staff-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 gradient-bg text-white font-semibold text-sm shadow-accent active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enrolling Cleaner...
                </>
              ) : (
                'Complete Cleaner Enrolment'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}