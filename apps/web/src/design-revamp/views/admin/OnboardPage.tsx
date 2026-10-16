import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { provisionUser, createCleaner } from '@/design-revamp/lib/api';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminOnboardPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [role, setRole] = useState<'cleaner' | 'supervisor'>('cleaner');
  const [workId, setWorkId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
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
      await provisionUser({
        name: name.trim(),
        workId: workId.trim() || idNumber.trim(),
        idNumber: idNumber.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        workLocation: workLocation.trim(),
        password,
        role,
      });

      if (role === 'cleaner') {
        try {
          await createCleaner({
            name: name.trim(),
            workId: workId.trim() || idNumber.trim(),
            phone: phone.trim(),
            workLocation: workLocation.trim(),
          });
        } catch {
          // ignore duplicate cleaner profile creation if handled by provision
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to provision staff account. Check credentials and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Provision Staff Account
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Create administrative or cleaning workforce credentials with direct system permissions.
        </p>
      </div>

      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Account Provisioning Form</CardTitle>
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
              <span>Account provisioned successfully! Redirecting to user directory...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Choice */}
            <div className="space-y-2">
              <Label>Operational Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('cleaner')}
                  className={`rounded-lg border p-3 text-left transition-all active:scale-[0.98] ${
                    role === 'cleaner'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  <p className="font-semibold text-xs">Field Cleaner</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to facility cleaning & tasks</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('supervisor')}
                  className={`rounded-lg border p-3 text-left transition-all active:scale-[0.98] ${
                    role === 'supervisor'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  <p className="font-semibold text-xs">Duty Supervisor</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Triage desk, workforce dispatch & roster</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <input
                id="staff-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jessica Taylor"
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
                  placeholder="e.g. SUP-201 or CLN-105"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-id">Login ID / NRIC</Label>
                <input
                  id="login-id"
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. S1234567B"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Work Email (Optional)</Label>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jessica@spotfix.org"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone Number</Label>
                <input
                  id="staff-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +65 9234 5678"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-zone">Assigned Zone or Department</Label>
              <input
                id="staff-zone"
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Central Campus Facility Operations"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-pass">Initial Password</Label>
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
                  Provisioning Account...
                </>
              ) : (
                'Complete Account Provisioning'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}