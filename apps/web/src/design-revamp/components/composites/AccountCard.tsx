import { useEffect, useState } from 'react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import {
  useNotificationsV2,
  useMarkNotificationReadV2,
  useUpdateProfile,
} from '@/design-revamp/hooks/useV2';
import { getV2Me } from '@/design-revamp/lib/api';
import { Button } from '@/design-revamp/components/ui/button';
import { Badge } from '@/design-revamp/components/ui/badge';
import { Label } from '@/design-revamp/components/ui/label';
import { LogOut, Bell, CheckCheck, Pencil, X, Loader2, CheckCircle2 } from 'lucide-react';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground break-words text-right">{value}</span>
    </div>
  );
}

/**
 * Shared per-role account card (Android AccountScreen parity): profile,
 * details, notification history, sign out. Rendered on every role's
 * /account route. Non-master users can edit name/phone/zone via
 * PATCH /api/v1/users/me.
 */
export function AccountCard() {
  const { user, logout, refreshUser } = useAuth();
  const notifications = useNotificationsV2(20);
  const markRead = useMarkNotificationReadV2();
  const updateProfile = useUpdateProfile();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [rolesError, setRolesError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isMaster = user?.authType === 'master';

  useEffect(() => {
    let cancelled = false;
    if (user?.authType === 'master') {
      setRoles(null);
      return;
    }
    getV2Me()
      .then((me) => {
        if (cancelled || !me) return;
        const active = Object.entries(me.roles)
          .filter(([, v]) => v)
          .map(([k]) => k);
        setRoles(active);
      })
      .catch(() => {
        if (!cancelled) setRolesError(true);
      });
    return () => { cancelled = true; };
  }, [user]);

  const shown = (notifications.data ?? []).slice(0, 10);

  function startEdit() {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setWorkLocation(user?.workLocation ?? '');
    setFormError(null);
    setSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFormError(null);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedZone = workLocation.trim();
    if (trimmedName.length > 0 && trimmedName.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 120 || trimmedPhone.length > 30 || trimmedZone.length > 120) {
      setFormError('One or more fields exceed the maximum length.');
      return;
    }
    setFormError(null);
    try {
      await updateProfile.mutateAsync({
        ...(trimmedName ? { name: trimmedName } : {}),
        phone: trimmedPhone,
        workLocation: trimmedZone,
      });
      await refreshUser();
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {initials(user?.name ?? '?')}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground">{user?.name}</h2>
            <p className="text-xs text-muted-foreground">{user?.authType === 'master' ? 'Master administrator' : 'Signed in'}</p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-border/60">
          <InfoRow label="Role" value={user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : '—'} />
          {roles && (
            <InfoRow
              label="Capabilities"
              value={roles.map((r) => r[0].toUpperCase() + r.slice(1)).join(', ') || 'Reporter'}
            />
          )}
          {rolesError && <InfoRow label="Capabilities" value="Reporter" />}
          <InfoRow label="ID" value={user?.idNumber || '—'} />
          <InfoRow label="Email" value={user?.email || '—'} />
          {!editing && (
            <>
              <InfoRow label="Phone" value={user?.phone || '—'} />
              <InfoRow label="Zone" value={user?.workLocation || '—'} />
            </>
          )}
          <InfoRow label="Sign-in" value={user?.authType === 'master' ? 'Master' : 'User'} />
        </div>
        {saved && !editing && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Profile updated.
          </p>
        )}
        {!isMaster && !editing && (
          <Button onClick={startEdit} variant="outline" className="mt-4 w-full min-h-11">
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit profile
          </Button>
        )}
        {!isMaster && editing && (
          <form onSubmit={saveEdit} className="mt-4 space-y-3 border-t border-border/60 pt-4">
            {formError && (
              <p role="alert" className="text-xs font-medium text-destructive">{formError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Full name</Label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={120}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-phone">Phone</Label>
              <input
                id="account-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +65 9234 5678"
                maxLength={30}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-zone">Zone / Department</Label>
              <input
                id="account-zone"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Central Campus"
                maxLength={120}
                className={inputClass}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateProfile.isPending} className="min-h-11 flex-1">
                {updateProfile.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} className="min-h-11">
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        )}
        <Button
          onClick={logout}
          variant="outline"
          className="mt-4 w-full min-h-11 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign out
        </Button>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" />
            Notification history
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {notifications.data?.length ?? 0}
          </Badge>
        </div>
        {notifications.isLoading && <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>}
        {!notifications.isLoading && shown.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No notifications yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {shown.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border px-3 py-2 text-xs ${n.is_read ? 'border-border/60 bg-muted/30' : 'border-primary/30 bg-primary/5'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-foreground">{n.title}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-0.5 text-muted-foreground">{n.body}</p>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AdminAccountPage() {
  return <AccountCard />;
}

export function SupervisorAccountPage() {
  return <AccountCard />;
}

export function CleanerAccountPage() {
  return <AccountCard />;
}
