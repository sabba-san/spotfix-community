import { useState } from 'react';
import { createMasterAccount, listUsers } from '@/design-revamp/lib/api';
import { ErrorState } from '@/design-revamp/components/feedback/ErrorState';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Badge } from '@/design-revamp/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Ban,
  KeyRound,
} from 'lucide-react';

const ROLE_CARDS = [
  { role: 'Public', desc: 'Submit and track own reports', tone: 'border-slate-300 bg-slate-50 text-slate-700' },
  { role: 'Supervisor', desc: 'Triage, assign cleaners, endorse resolutions', tone: 'border-teal-300 bg-teal-50 text-teal-700' },
  { role: 'Cleaner', desc: 'Accept tasks, submit resolution evidence', tone: 'border-amber-300 bg-amber-50 text-amber-700' },
  { role: 'Admin', desc: 'Provision users, create master accounts', tone: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
];

export default function AdminControlPage() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [masterBusy, setMasterBusy] = useState(false);
  const [masterMsg, setMasterMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [users, setUsers] = useState<Array<{ _id: string; name: string; role: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);

  async function handleCreateMaster(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !displayName.trim() || password.length < 6 || password !== confirm) return;
    setMasterBusy(true);
    setMasterMsg(null);
    try {
      await createMasterAccount({ username: username.trim(), name: displayName.trim(), password });
      setMasterMsg({ ok: true, text: 'Master account created.' });
      setUsername(''); setDisplayName(''); setPassword(''); setConfirm('');
    } catch (err) {
      setMasterMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to create master account' });
    } finally {
      setMasterBusy(false);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError(false);
    try {
      const data = await listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsersError(true);
    } finally {
      setUsersLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Master Control</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Role catalog, master account creation, and directory tools for the control room.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLE_CARDS.map((r) => (
          <div key={r.role} className="rounded-xl border bg-card p-3">
            <Badge variant="outline" className={`text-[11px] ${r.tone}`}>{r.role}</Badge>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      <Card className="border border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4 text-indigo-600" />Create Master Account</CardTitle>
        </CardHeader>
        <CardContent>
          {masterMsg && (
            <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2.5 text-xs ${masterMsg.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-destructive/20 bg-destructive/5 text-destructive'}`}>
              {masterMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {masterMsg.text}
            </div>
          )}
          <form onSubmit={handleCreateMaster} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required aria-label="Master username"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" required aria-label="Master display name"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" required minLength={6} aria-label="Master password"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required aria-label="Confirm master password"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <Button type="submit" disabled={masterBusy || password !== confirm} className="sm:col-span-2 min-h-11">
              {masterBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />}
              Create Master Account
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Ban className="h-4 w-4 text-muted-foreground" />Report Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Master accounts cannot submit public reports — the backend rejects them to keep
            incident data reporter-owned. To file an issue, sign in with a reporter, cleaner,
            or supervisor account and use <span className="font-medium">Submit Issue</span> from
            the dashboard.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Directory Snapshot</CardTitle>
          <Button size="sm" variant="outline" onClick={loadUsers} disabled={usersLoading}>
            {usersLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load users'}
          </Button>
        </CardHeader>
        <CardContent>
          {usersError && <ErrorState onRetry={loadUsers} />}
          {!usersLoading && !usersError && users.length === 0 && (
            <p className="text-xs text-muted-foreground">No users loaded yet.</p>
          )}
          {users.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.slice(0, 12).map((u) => (
                <div key={u._id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                  <span className="font-medium">{u.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}