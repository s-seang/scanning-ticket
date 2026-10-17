import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authMessage, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { ThemeToggle, Wordmark } from '../components/layout/AppShell';

export function SignIn() {
  const { user, loading, configured, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const [mode, setMode] = useState('in'); // 'in' | 'up'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={location.state?.from || '/'} replace />;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'in') await signIn(form.email.trim(), form.password);
      else await signUp(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!form.email.trim()) {
      setError('Enter your email first, then tap reset.');
      return;
    }
    try {
      await resetPassword(form.email.trim());
      toast.success('Reset link sent. Check your inbox.');
    } catch (err) {
      setError(authMessage(err));
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between p-5 sm:p-6">
        <Wordmark className="text-[15px]" />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-display font-semibold">
            {mode === 'in' ? 'Run the door.' : 'Set up ScanFlow.'}
          </h1>
          <p className="muted mt-3 text-[15px]">
            {mode === 'in'
              ? 'Sign in to open an event and start scanning.'
              : 'One account covers every event you run.'}
          </p>

          {!configured && (
            <div className="mt-6 rounded-xl2 border border-fail/30 bg-fail/[0.06] p-4 text-[13px] text-fail">
              Firebase keys are missing. Copy <code className="font-mono">.env.example</code> to{' '}
              <code className="font-mono">.env</code>, paste your project config, and restart the dev server.
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={submit}>
            {mode === 'up' && (
              <Input
                label="Your name"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
                placeholder="Wathanak"
              />
            )}
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
              data-autofocus
              placeholder="you@team.com"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              placeholder="At least 6 characters"
              error={error}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={busy}
              disabled={!configured}
            >
              {mode === 'in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="hairline h-px flex-1 border-t" />
            <span className="muted text-[13px]">or</span>
            <span className="hairline h-px flex-1 border-t" />
          </div>

          <Button size="lg" className="w-full" onClick={google} disabled={!configured || busy}>
            <GoogleGlyph />
            Continue with Google
          </Button>

          <div className="muted mt-6 flex items-center justify-between text-[13px]">
            <button
              type="button"
              className="rounded font-medium text-black underline underline-offset-2 dark:text-white"
              onClick={() => {
                setMode(mode === 'in' ? 'up' : 'in');
                setError('');
              }}
            >
              {mode === 'in' ? 'Create an account' : 'I already have an account'}
            </button>
            {mode === 'in' && (
              <button type="button" className="rounded underline underline-offset-2" onClick={forgot}>
                Reset password
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6c1.9-5.6 7.2-9.8 13.6-9.8Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.15-3.2-.44-4.7H24v9h12.7c-.55 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.2 6.9-17.3Z"
      />
      <path fill="#FBBC05" d="M10.4 28.2a14.4 14.4 0 0 1 0-8.4l-7.8-6a23.6 23.6 0 0 0 0 20.4l7.8-6Z" />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.2-13.6-9.9l-7.8 6C6.5 42.1 14.6 47.5 24 47.5Z"
      />
    </svg>
  );
}
