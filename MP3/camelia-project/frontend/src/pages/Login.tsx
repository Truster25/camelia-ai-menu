import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { ErrorNote } from '../components/ui';
import { LogoMark } from '../components/Logo';

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/menu';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = mode === 'login' ? await login(email, password) : await register(name, email, password);
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'We could not sign you in just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (role: 'admin' | 'customer') => {
    setMode('login');
    setEmail(role === 'admin' ? 'admin@camelia.rw' : 'customer@camelia.rw');
    setPassword(role === 'admin' ? 'Admin123' : 'Customer123');
    setError('');
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-24">
      <div>
        <LogoMark className="h-14 w-14 text-xl" />
        <h1 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] leading-tight tracking-[-0.03em]">
          {mode === 'login' ? 'Welcome back to Camelia.' : 'Join the table.'}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-sage-400">
          {mode === 'login'
            ? 'Sign in to keep your favourites, rate dishes you have tried and track your pre-orders.'
            : 'An account keeps your ratings, favourites and orders together. It takes about ten seconds.'}
        </p>

        <div className="mt-9 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-sage-400">Demo accounts</p>
          <button onClick={() => fillDemo('customer')} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-forest-850 px-4 py-3 text-left transition hover:border-amber-soft/50">
            <span>
              <span className="block text-sm text-sage-100">Customer</span>
              <span className="text-[11px] text-sage-400">customer@camelia.rw · Customer123</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-amber-pale">Use</span>
          </button>
          <button onClick={() => fillDemo('admin')} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-forest-850 px-4 py-3 text-left transition hover:border-amber-soft/50">
            <span>
              <span className="block text-sm text-sage-100">Administrator</span>
              <span className="text-[11px] text-sage-400">admin@camelia.rw · Admin123</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em] text-amber-pale">Use</span>
          </button>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="mb-6 flex rounded-full border border-white/10 p-1 text-[10px] font-bold uppercase tracking-[0.14em]">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-full py-2.5 transition ${mode === 'login' ? 'bg-amber-logo text-forest-950' : 'text-sage-300'}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 rounded-full py-2.5 transition ${mode === 'register' ? 'bg-amber-logo text-forest-950' : 'text-sage-300'}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} className="field" required minLength={2} placeholder="Aline Mukamana" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field" required placeholder="you@example.rw" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field" required minLength={6} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && <p className="mt-1.5 text-[11px] text-sage-400">At least 6 characters.</p>}
          </div>

          {error && <ErrorNote message={error} />}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest-950 border-t-transparent" />
            ) : mode === 'login' ? (
              <><LogIn size={15} /> Sign in</>
            ) : (
              <><UserPlus size={15} /> Create account</>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-sage-400">
          Browsing and the AI quiz work without an account.{' '}
          <Link to="/recommend" className="text-amber-pale underline">Try the quiz</Link>
        </p>
      </div>
    </div>
  );
}
