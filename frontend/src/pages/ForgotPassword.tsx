import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { ErrorNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { ApiError } from '../lib/api';
import { AuthField } from './Login';
import './Login.css';

const spinner = (
  <span
    className="h-4 w-4 animate-spin rounded-full border-2 border-forest-950 border-t-transparent motion-reduce:animate-none"
    aria-hidden="true"
  />
);

export function ForgotPassword() {
  const { t } = useLang();
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);

  // Step 2 needs both the email (just to show it back) and the token the
  // first step earned -- holding that token in component state, not the
  // URL, keeps it out of browser history and the address bar.
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [step]);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const typed = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    setError('');
    setBusy(true);
    try {
      const token = await requestPasswordReset(typed);
      setEmail(typed);
      setResetToken(token);
      setStep('password');
    } catch (caught) {
      if (!(caught instanceof ApiError)) setError(t('login.unavailable'));
      else if (caught.status === 404) setError(t('forgotPassword.notFound'));
      else setError(caught.message);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const password = String(values.get('password') ?? '');
    setError('');
    if (values.get('confirmation') !== password) {
      setMismatch(true);
      form.querySelector<HTMLInputElement>('#auth-confirmation')?.focus();
      return;
    }
    setMismatch(false);
    setBusy(true);
    try {
      const user = await resetPassword(resetToken, password);
      navigate(user.role === 'admin' ? '/admin' : '/menu', { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('login.unavailable'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-scene" data-header-theme="dark">
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-frame" aria-hidden="true" />
        <span className="auth-corner auth-corner--start" aria-hidden="true" />
        <span className="auth-corner auth-corner--end" aria-hidden="true" />

        <div className="auth-intro">
          <h1 id="auth-heading" ref={heading} tabIndex={-1}>
            {t('forgotPassword.title')} <span>{t('forgotPassword.titleAccent')}</span>
          </h1>
          <p>
            {step === 'email'
              ? t('forgotPassword.step1Body')
              : t('forgotPassword.step2Body').replace('{email}', email)}
          </p>
        </div>

        {step === 'email' ? (
          <form className="auth-form" onSubmit={submitEmail} aria-busy={busy}>
            <fieldset disabled={busy} className="auth-fields">
              <AuthField
                id="auth-email"
                name="email"
                type="email"
                icon={Mail}
                label={t('login.email')}
                placeholder="name@example.com"
                autoComplete="username"
                spellCheck={false}
                required
              />
            </fieldset>

            {error && <ErrorNote message={error} />}

            <button type="submit" className="auth-submit" disabled={busy}>
              {t('forgotPassword.continue')}
              {busy ? spinner : <ArrowRight className="auth-submit-arrow" size={17} aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitPassword} aria-busy={busy}>
            <fieldset disabled={busy} className="auth-fields">
              <div className="auth-passwords">
                <AuthField
                  id="auth-password"
                  name="password"
                  type="password"
                  icon={LockKeyhole}
                  label={t('forgotPassword.newPassword')}
                  autoComplete="new-password"
                  aria-describedby="auth-password-hint"
                  required
                  minLength={6}
                  maxLength={128}
                  onInput={() => setMismatch(false)}
                />
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
              </div>
              <div className="auth-options">
                <p id="auth-password-hint">{t('login.passwordHint')}</p>
              </div>
            </fieldset>

            {mismatch && (
              <p className="auth-validation" id="auth-confirmation-error" role="alert">
                {t('login.passwordMismatch')}
              </p>
            )}
            {error && <ErrorNote message={error} />}

            <button type="submit" className="auth-submit" disabled={busy}>
              {t('forgotPassword.setPassword')}
              {busy ? spinner : <ArrowRight className="auth-submit-arrow" size={17} aria-hidden="true" />}
            </button>
          </form>
        )}

        <div className="auth-links">
          <p>
            <Link to="/login">{t('forgotPassword.backToSignIn')}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
