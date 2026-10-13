import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';
import { Separator } from '@/design-revamp/components/ui/separator';

const GOOGLE_CLIENT_ID = String(
  ((window as any).__APP_CONFIG__?.GOOGLE_CLIENT_ID as string) ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '',
).trim();

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleInitialized = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return;
    googleInitialized.current = true;

    const initGoogle = () => {
      const google = (window as any).google?.accounts?.id;
      if (!google) return;

      google.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (!response?.credential) return;
          setIsLoading(true);
          setError('');
          try {
            const user = await loginWithGoogle(response.credential);
            if (user.role === 'supervisor') navigate('/supervisor');
            else if (user.role === 'cleaner') navigate('/cleaner');
            else navigate('/');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-up failed');
          } finally {
            setIsLoading(false);
          }
        },
      });
      setGoogleReady(true);
    };

    const interval = window.setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogle();
        window.clearInterval(interval);
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    if (!googleReady) return;
    const container = document.getElementById('google-render-button');
    const google = (window as any).google?.accounts?.id;
    if (!container || !google) return;

    container.replaceChildren();
    google.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      width: 360,
    });
  }, [googleReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !idNumber.trim() || !phone.trim() || !password) return;

    setIsLoading(true);
    setError('');

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        idNumber: idNumber.trim(),
        phone: phone.trim(),
        password,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Create account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Join SpotFix to report and track community issues.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <input
                id="name"
                type="text"
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID number</Label>
                <input
                  id="idNumber"
                  type="text"
                  className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <input
                  id="phone"
                  type="tel"
                  className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-pass">Password</Label>
              <input
                id="reg-pass"
                type="password"
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full gradient-bg shadow-accent hover:shadow-accent-lg hover:brightness-110 active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create and sign in'
              )}
            </Button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="my-4 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
              <div id="google-render-button" className="flex justify-center" />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Use Google for quick registration
              </p>
            </>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
