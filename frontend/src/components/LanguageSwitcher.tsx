import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { LANGUAGES } from '../lib/i18n';

type Props = {
  /** Dark ink for cream backgrounds, light ink for photographs and dark bands. */
  tone?: 'light' | 'dark';
  className?: string;
  variant?: 'header' | 'footer';
};

/**
 * The language control.
 *
 * The header uses a short language code. The footer has room for the full name.
 * The choices use native language names, whichever language is active.
 */
export function LanguageSwitcher({ tone = 'light', className = '', variant = 'header' }: Props) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const triggerButton = useRef<HTMLButtonElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const footer = variant === 'footer';

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (wrap.current?.contains(document.activeElement)) triggerButton.current?.focus();
      }
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
        ref={triggerButton}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('common.language')}: ${current.label}`}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold transition ${trigger} ${footer
          ? 'min-h-11 border border-cream/20 px-3.5 text-xs hover:border-amber-soft'
          : 'px-1 py-1 text-[10px] uppercase tracking-[0.14em]'}`}
      >
        <Globe size={14} strokeWidth={1.7} aria-hidden="true" />
        {footer ? current.label : current.short}
        {footer && <ChevronDown size={13} aria-hidden="true" />}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('common.language')}
          className={`absolute z-[70] w-[168px] overflow-hidden rounded-[6px] border border-ink/10 bg-cream py-1.5 text-ink shadow-[0_18px_50px_-18px_rgba(0,0,0,0.55)] ${footer
            ? 'bottom-[calc(100%+10px)] left-0 sm:left-1/2 sm:-translate-x-1/2'
            : 'right-0 top-[calc(100%+10px)]'}`}
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
                    triggerButton.current?.focus();
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
