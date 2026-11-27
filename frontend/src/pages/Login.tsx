import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ErrorNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { ApiError } from '../lib/api';
import './Login.css';

type AuthFieldProps = ComponentPropsWithoutRef<'input'> & {
  id: string;
  label: string;
  icon: LucideIcon;
};

export function AuthField({ id, label, icon: Icon, type = 'text', ...input }: AuthFieldProps) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input">
        <Icon size={17} aria-hidden="true" />
        <input
          {...input}
          id={id}
          type={isPassword && visible ? 'text' : type}
        />
        {isPassword && (
          <button
            type="button"
            className="auth-visibility"
            aria-label={t(visible ? 'login.hidePassword' : 'login.showPassword')}
            aria-controls={id}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

function LoginForm({ registering }: { registering: boolean }) {
  const { t } = useLang();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/menu';
  const heading = useRef<HTMLHeadingElement>(null);
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitLabel = t(registering ? 'login.create' : 'login.submit');

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    // Read the fields before disabling them. Password managers can fill them
    // without triggering a React change handler.
    const form = event.currentTarget;
    const values = new FormData(form);
    const email = String(values.get('email') ?? '').trim();
    const password = String(values.get('password') ?? '');
    setError('');
    if (registering && values.get('confirmation') !== password) {
      setMismatch(true);
      form.querySelector<HTMLInputElement>('#auth-confirmation')?.focus();
      return;
    }

    setMismatch(false);
    setBusy(true);
    try {
      const user = registering
        ? await register(String(values.get('name') ?? '').trim(), email, password)
        : await login(email, password, values.has('remember'));
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        setError(t('login.unavailable'));
      } else if (caught.status === 401) {
        setError(t('login.credentials'));
      } else if (caught.status === 409) {
        setError(t('login.accountExists'));
      } else {
        setError(caught.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="auth-panel"
      aria-labelledby="auth-heading"
      data-mode={registering ? 'register' : 'login'}
    >
      <div className="auth-frame" aria-hidden="true" />
      <span className="auth-corner auth-corner--start" aria-hidden="true" />
      <span className="auth-corner auth-corner--end" aria-hidden="true" />

      <div className="auth-intro">
        <h1 id="auth-heading" ref={heading} tabIndex={-1}>
          {t(registering ? 'login.registerStart' : 'login.welcomeStart')}{' '}
          <span>{t(registering ? 'login.registerAccent' : 'login.welcomeAccent')}</span>
        </h1>
        <p>{t(registering ? 'login.registerBody' : 'login.welcomeBody')}</p>
      </div>

      <form className="auth-form" onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="auth-fields">
          {registering && (
            <AuthField
              id="auth-name"
              name="name"
              icon={UserRound}
              label={t('login.name')}
              placeholder="Aline Mukamana"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
            />
          )}

          <AuthField
            id="auth-email"
            name="email"
            type="email"
            icon={Mail}
            label={t('login.email')}
            placeholder="name@example.com"
            autoComplete={registering ? 'email' : 'username'}
            spellCheck={false}
            required
          />

          <div className={registering ? 'auth-passwords' : undefined}>
            <AuthField
              id="auth-password"
              name="password"
              type="password"
              icon={LockKeyhole}
              label={t('login.password')}
              autoComplete={registering ? 'new-password' : 'current-password'}
              aria-describedby={registering ? 'auth-password-hint' : undefined}
              required
              minLength={registering ? 6 : undefined}
              maxLength={registering ? 128 : undefined}
              onInput={() => setMismatch(false)}
            />
            {registering && (
              <AuthField
                id="auth-confirmation"
                name="confirmation"
                type="password"
                icon={LockKeyhole}
                label={t('login.confirmPassword')}
                autoComplete="new-password"
                aria-invalid={mismatch || undefined}
                aria-describedby={mismatch ? 'auth-confirmation-error' : undefined}
                required
                onInput={() => setMismatch(false)}
              />
            )}
          </div>

          {registering ? (
            <div className="auth-options">
              <p id="auth-password-hint">{t('login.passwordHint')}</p>
              <Link to="/privacy">{t('login.privacy')}</Link>
            </div>
          ) : (
            <div className="auth-options">
              <label className="auth-remember">
                <input type="checkbox" name="remember" defaultChecked />
                {t('login.remember')}
              </label>
              <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
            </div>
          )}
        </fieldset>

        {mismatch && (
          <p className="auth-validation" id="auth-confirmation-error" role="alert">
            {t('login.passwordMismatch')}
          </p>
        )}
        {error && <ErrorNote message={error} />}

        <button type="submit" className="auth-submit" disabled={busy}>
          {submitLabel}
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-950 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <ArrowRight className="auth-submit-arrow" size={17} aria-hidden="true" />
          )}
        </button>
      </form>

      <div className="auth-links">
        <p>
          {t(registering ? 'login.haveaccount' : 'login.noaccount')}{' '}
          <Link
            to={registering ? '/login' : '/login?mode=register'}
            state={location.state}
          >
            {t(registering ? 'login.submit' : 'login.create')}
          </Link>
        </p>
        <Link className="auth-guest" to="/recommend">{t('login.guest')}</Link>
      </div>
    </section>
  );
}

export function Login() {
  const [search] = useSearchParams();
  const registering = search.get('mode') === 'register';

  return (
    <div className="auth-scene" data-header-theme="dark">
      <LoginForm key={registering ? 'register' : 'login'} registering={registering} />
    </div>
  );
}
