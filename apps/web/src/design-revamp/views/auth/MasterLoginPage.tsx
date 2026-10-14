import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';

export default function MasterLoginPage() {
  const navigate = useNavigate();
  const { loginMaster } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setError('');

    try {
      await loginMaster(username.trim(), password, 'master');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Admin Login</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground pt-1">
            Dedicated administrator access for the municipal control room.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <input
                id="username"
                type="text"
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="master-password">Password</Label>
              <input
                id="master-password"
                type="password"
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full gradient-bg shadow-accent hover:brightness-110 active:scale-[0.98] font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Enter control room'
              )}
            </Button>
          </form>

          <p className="pt-2 text-center text-sm text-muted-foreground">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to main login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
