import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LANGUAGES, translate } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key. Missing keys fall back to English, then to the key itself. */
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'camelia.lang';

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'rw' || value === 'fr';
}

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can be blocked in private mode; fall through to the browser hint.
  }
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('rw')) return 'rw';
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitial());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Nothing to do: the choice still holds for this session.
    }
  }, []);

  // Keep the document language in step, so screen readers and the browser's
  // spell-checker switch with the interface.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (key: string) => translate(lang, key) }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
  return ctx;
}

export { LANGUAGES };
