import { useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/design-revamp/components/ui/button';
import {
  clearV2Session,
  ensureV2Session,
  isForbiddenRoleError,
} from '@/design-revamp/lib/api';

/**
 * Shown when one or more workflow (v2) queries fail with a role/permission
 * error. Offers a one-tap session reconnect (drops a potentially stale cached
 * v2 token left over from a previous role login and re-exchanges from the
 * current v1 session). If the error persists, the account genuinely lacks the
 * role and the user is pointed at the correct login portal.
 */
export function RoleErrorBanner({
  errors,
  expectedRole,
  onReconnect,
}: {
  errors: unknown[];
  expectedRole: 'supervisor' | 'cleaner';
  onReconnect?: () => void;
}) {
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);

  const denied = errors.some(isForbiddenRoleError);
  if (!denied) return null;

  async function reconnect() {
    setReconnecting(true);
    setReconnectFailed(false);
    try {
      clearV2Session();
      await ensureV2Session();
      onReconnect?.();
    } catch {
      setReconnectFailed(true);
    } finally {
      setReconnecting(false);
    }
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <p className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          This session lacks {expectedRole} permission. If you just signed in with a different
          role, reconnect to refresh the session — otherwise sign in again via the{' '}
          {expectedRole === 'supervisor' ? 'Supervisor' : 'Cleaner'} Login tab.
          {reconnectFailed && ' Reconnect failed: the account has no such role.'}
        </span>
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={reconnect}
        disabled={reconnecting}
        className="gap-1.5 shrink-0 bg-white/60 dark:bg-transparent"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
        {reconnecting ? 'Reconnecting…' : 'Reconnect session'}
      </Button>
    </div>
  );
}
