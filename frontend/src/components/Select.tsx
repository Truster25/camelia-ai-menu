import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = { value: string; label: string };

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

/**
 * A listbox built to feel like the rest of the interface.
 *
 * The native <select> cannot be styled to match the cards, so this replaces it
 * with a button that opens a panel. Keyboard: arrows move, Enter or Space picks,
 * Escape closes, Tab leaves. The active row is announced to screen readers
 * through aria-activedescendant, and a pointerdown outside closes it.
 */
export function Select({ label, value, options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();
  const listId = `${baseId}-listbox`;
  const labelId = `${baseId}-label`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const openList = useCallback(() => {
    if (!options.length) return;
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [options.length, selectedIndex]);

  const choose = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      setOpen(false);
      setActiveIndex(-1);
      buttonRef.current?.focus();
    },
    [onChange, options],
  );

  // A click anywhere outside closes the panel without stealing focus.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the highlighted row inside the scrollable panel.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!options.length) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => (index + 1) % options.length);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => (index - 1 + options.length) % options.length);
        return;
      case 'Home':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) openList();
        else choose(activeIndex);
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        close();
        return;
      case 'Tab':
        if (open) close(false);
        return;
      default:
        return;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <span
        id={labelId}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-sage-400"
      >
        {label}
      </span>

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-forest-950/60 px-4 py-3 text-left text-sm text-sage-100 transition hover:border-white/30 focus:border-amber-soft focus:outline-none"
      >
        <span className="truncate">{selected ? selected.label : 'Choose'}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-sage-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-forest-850 p-1.5 shadow-2xl shadow-black/50"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={`${option.value}-${index}`}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(index)}
                onPointerEnter={() => setActiveIndex(index)}
                className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] transition ${
                  isActive ? 'bg-white/10 text-cream' : 'text-sage-200'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={13} className="shrink-0 text-amber-soft" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}