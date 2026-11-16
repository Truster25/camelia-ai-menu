import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LANGUAGES } from '../lib/i18n';

type Props = {
  /** Dark ink for cream backgrounds, light ink for photographs and dark bands. */
  tone?: 'light' | 'dark';
  className?: string;
};

/**
 * The language control.
 *
 * A globe with the two-letter code, because three full language names would
 * not fit in the header on a phone. The names appear in the menu, each written
 * in its own language — an English speaker looking for French finds
 * "Français", and a Kinyarwanda speaker finds "Kinyarwanda", not "RW".
 *
 * The menu closes on outside click and on Escape, and the current choice is
 * marked, so it is usable with a keyboard alone.
 */
export function LanguageSwitcher({ tone = 'light', className = '' }: Props) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const trigger =
    tone === 'light'
      ? 'text-cream/75 hover:text-cream'
      : 'text-ink/70 hover:text-ink';

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}. Change language`}
        className={`inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${trigger}`}
      >
        <Globe size={14} strokeWidth={1.7} />
        {current.short}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[168px] overflow-hidden rounded-[6px] border border-ink/10 bg-cream py-1.5 text-ink shadow-[0_18px_50px_-18px_rgba(0,0,0,0.55)]"
        >
          {LANGUAGES.map((option) => {
            const on = option.code === lang;
            return (
              <li key={option.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    setLang(option.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[12.5px] transition hover:bg-[#8a5a2b]/10 ${
                    on ? 'font-semibold text-[#8a5a2b]' : 'text-[#3a3d34]'
                  }`}
                >
                  {option.label}
                  {on && <Check size={13} strokeWidth={2.4} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
