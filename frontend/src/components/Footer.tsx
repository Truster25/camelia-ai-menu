import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { api } from '../lib/api';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';

const groups = [
  {
    label: 'footer.about',
    links: [
      { to: '/our-story', label: 'footer.story' },
      { to: '/our-story#team', label: 'footer.team' },
      { to: '/how-it-works', label: 'footer.how' },
    ],
  },
  {
    label: 'footer.explore',
    links: [
      { to: '/menu', label: 'footer.menu' },
      { to: '/recommend', label: 'footer.find' },
      { to: '/orders', label: 'footer.orders' },
      { to: '/cart', label: 'footer.basket' },
    ],
  },
  {
    label: 'footer.visit',
    links: [
      { to: '/contact', label: 'footer.contact' },
      { to: '/contact#hours', label: 'footer.hours' },
    ],
  },
];

export function Footer() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      await api.post('/newsletter', { email: email.trim() });
      setEmail('');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <footer className="bg-forest-950 bg-[radial-gradient(ellipse_at_50%_100%,rgba(223,161,75,.10),transparent_65%)] text-sage-300">
      <div className="mx-auto max-w-[76rem] px-5 pb-7 pt-12 sm:px-8 sm:pb-9 sm:pt-16">
        <div className="flex justify-center">
          <Logo variant="white" className="h-18 sm:h-22" />
        </div>

        <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-7 sm:mt-12 sm:gap-9 lg:grid-cols-[1fr_1fr_1fr_minmax(17rem,1.4fr)]">
          {groups.map((group) => (
            <nav key={group.label} aria-label={t(group.label)}>
              <h2 className="text-lg leading-snug text-amber-pale">{t(group.label)}</h2>
              <ul className="mt-2.5 grid text-sm">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-9 items-center py-1 leading-snug underline-offset-4 hover:text-cream hover:underline"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <section className="col-span-2 max-w-md sm:col-span-1" aria-labelledby="footer-newsletter">
            <h2 id="footer-newsletter" className="text-lg leading-snug text-amber-pale">{t('footer.newsletter')}</h2>
            {status === 'done' ? (
              <p className="mt-3 text-sm leading-relaxed text-cream" role="status">{t('footer.subscribed')}</p>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed">{t('footer.news')}</p>
                <form className="mt-4 flex flex-wrap items-stretch gap-2" onSubmit={subscribe}>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    aria-label={t('login.email')}
                    placeholder={t('footer.email')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={status === 'sending'}
                    className="min-h-11 min-w-0 flex-[1_1_8rem] rounded-lg border border-cream/20 bg-forest-850 px-3 text-base text-cream placeholder:text-sage-400 sm:text-sm"
                  />
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="min-h-11 rounded-lg bg-amber-logo px-4 text-sm font-semibold text-forest-950 transition-colors hover:bg-amber-pale disabled:opacity-60"
                  >
                    {t(status === 'sending' ? 'footer.sending' : 'footer.submit')}
                  </button>
                </form>
                {status === 'error' && <p className="mt-3 text-sm text-red-300" role="alert">{t('footer.signupError')}</p>}
              </>
            )}
          </section>
        </div>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 text-xs text-sage-400 sm:mt-14 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <p className="col-span-2 leading-relaxed sm:col-span-1">
            © {new Date().getFullYear()} Camelia Café &amp; Restaurant. {t('footer.rights')}
          </p>
          <LanguageSwitcher variant="footer" className="justify-self-start sm:justify-self-center" />
          <Link to="/privacy" className="justify-self-end py-3 underline-offset-4 hover:text-cream hover:underline">
            {t('footer.privacy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
