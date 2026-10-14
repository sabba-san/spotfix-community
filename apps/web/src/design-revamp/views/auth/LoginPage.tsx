import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, Shield } from 'lucide-react';
import { useAuth } from '@/design-revamp/hooks/useAuth';
import { StatusBoard } from '@/design-revamp/components/composites/StatusBoard';
import { Button } from '@/design-revamp/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/design-revamp/components/ui/card';
import { Label } from '@/design-revamp/components/ui/label';
import { Separator } from '@/design-revamp/components/ui/separator';
import { cn } from '@/design-revamp/lib/utils';

type AuthTab = 'staff-login' | 'cleaner-login' | 'reporter-login' | 'register' | 'master-login';

const GOOGLE_CLIENT_ID = String(
  (window.__APP_CONFIG__?.GOOGLE_CLIENT_ID as string) ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '',
).trim();

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as AuthTab | null;
  const { login, loginMaster, register, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(
    requestedTab && ['staff-login', 'cleaner-login', 'reporter-login', 'register', 'master-login'].includes(requestedTab)
      ? requestedTab
      : 'staff-login'
  );
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [masterUsername, setMasterUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleInitialized = useRef(false);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return;
    googleInitialized.current = true;

    const initGoogle = () => {
      const google = (window as any).google?.accounts?.id;
      if (google) {
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setIsLoading(true);
            try {
              const googleTab = activeTabRef.current;
              const expectedRole = googleTab === 'staff-login'
                ? 'supervisor'
                : googleTab === 'reporter-login' || googleTab === 'register'
                  ? 'public'
                  : undefined;
              const user = await loginWithGoogle(response.credential, expectedRole);
              if (user.role === 'master') navigate('/admin');
              else if (user.role === 'supervisor') navigate('/supervisor');
              else if (user.role === 'cleaner') navigate('/cleaner');
              else navigate('/');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Google sign-in failed');
            } finally {
              setIsLoading(false);
            }
          },
        });
        setGoogleReady(true);
      }
    };

    if (document.readyState === 'complete') {
      initGoogle();
    } else {
      window.addEventListener('load', initGoogle);
    }

    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 300);

    return () => {
      window.removeEventListener('load', initGoogle);
      clearInterval(interval);
    };
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    if (!googleReady || !['staff-login', 'reporter-login', 'register'].includes(activeTab)) return;

    const container = document.getElementById('google-render-button');
    const google = (window as any).google?.accounts?.id;
    if (!container || !google) return;

    container.replaceChildren();
    google.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: activeTab === 'register' ? 'signup_with' : 'signin_with',
      width: 320,
    });
  }, [activeTab, googleReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const expectedRole = activeTab === 'staff-login'
        ? 'supervisor'
        : activeTab === 'cleaner-login'
          ? 'cleaner'
          : 'public';
      const user = await login(identifier.trim(), password, expectedRole);
      if (user.role === 'master') navigate('/admin');
      else if (user.role === 'supervisor') navigate('/supervisor');
      else if (user.role === 'cleaner') navigate('/cleaner');
      else navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regIdNumber.trim() || !regPhone.trim() || !regPassword) return;

    setIsLoading(true);
    setError('');

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        idNumber: regIdNumber.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterUsername.trim() || !masterPassword) return;

    setIsLoading(true);
    setError('');

    try {
      await loginMaster(masterUsername.trim(), masterPassword, 'master');
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: AuthTab; label: string }[] = [
    { id: 'staff-login', label: 'Supervisor Login' },
    { id: 'cleaner-login', label: 'Cleaner Login' },
    { id: 'reporter-login', label: 'Public Login' },
    { id: 'master-login', label: 'Admin Login' },
  ];

  const renderGoogleButton = () => (
    <div className="flex flex-col items-center gap-2">
      {googleReady ? (
        <div id="google-render-button" className="flex justify-center" />
      ) : (
        <p className="text-xs text-muted-foreground">
          {GOOGLE_CLIENT_ID ? 'Loading Google Sign-In...' : 'Google Sign-In not configured'}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.3fr_0.9fr] xl:grid-cols-[1.4fr_1fr]">
      {/* Left Column: Public Status Board Dashboard (Circled in green) */}
      <div className="flex flex-col justify-between bg-muted/20 p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-border/60 overflow-y-auto">
        <div className="space-y-6 max-w-4xl w-full mx-auto">
          {/* SpotFix Brand Header */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow-sm">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">SpotFix</span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground hidden sm:inline">
                  Civic Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Live 6-Metric Public Status Board Dashboard */}
          <StatusBoard />
        </div>

        <footer className="mt-8 pt-4 border-t border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 SpotFix Community</span>
          <span>Public Infrastructure Transparency</span>
        </footer>
      </div>

      <div className="flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to your SpotFix account
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    'flex min-h-[40px] items-center justify-center rounded-lg px-3 text-sm font-medium transition-all active:scale-[0.98]',
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {(activeTab === 'staff-login' || activeTab === 'cleaner-login') && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-id">
                      {activeTab === 'cleaner-login' ? 'Cleaner ID' : 'Supervisor ID or email'}
                    </Label>
                    <input
                      id="staff-id"
                      type="text"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      placeholder={activeTab === 'cleaner-login' ? 'CLN-001' : 'SUP-001 or supervisor@example.com'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-pass">Password</Label>
                    <input
                      id="staff-pass"
                      type="password"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full gradient-bg shadow-accent hover:shadow-accent-lg hover:brightness-110 active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
                {renderGoogleButton()}
              </>
            )}

            {activeTab === 'reporter-login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter-id">Email or ID number</Label>
                    <input
                      id="reporter-id"
                      type="text"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      placeholder="A1234567 or reporter@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporter-pass">Password</Label>
                    <input
                      id="reporter-pass"
                      type="password"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full gradient-bg shadow-accent hover:shadow-accent-lg hover:brightness-110 active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                {renderGoogleButton()}
              </>
            )}

            {activeTab === 'register' && (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full name</Label>
                    <input
                      id="reg-name"
                      type="text"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <input
                      id="reg-email"
                      type="email"
                      className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-id">ID number</Label>
                      <input
                        id="reg-id"
                        type="text"
                        className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        value={regIdNumber}
                        onChange={(e) => setRegIdNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone</Label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
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
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full gradient-bg shadow-accent hover:shadow-accent-lg hover:brightness-110 active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                {renderGoogleButton()}
              </>
            )}

            {activeTab === 'master-login' && (
              <form onSubmit={handleMasterLogin} className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <Shield className="h-4 w-4 text-accent" />
                  <p className="text-xs text-muted-foreground">
                    Dedicated administrator access for the control room.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="master-user">Username</Label>
                  <input
                    id="master-user"
                    type="text"
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    value={masterUsername}
                    onChange={(e) => setMasterUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="master-pass">Password</Label>
                  <input
                    id="master-pass"
                    type="password"
                    className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="h-12 w-full gradient-bg shadow-accent hover:shadow-accent-lg hover:brightness-110 active:scale-[0.98]" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Enter control room'
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {activeTab !== 'register' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => setActiveTab('register')}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => setActiveTab('staff-login')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
