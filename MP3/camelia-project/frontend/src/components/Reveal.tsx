import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll reveal.
 *
 * The house rule across this site is that motion should be felt, not watched.
 * So this does one thing and only one thing: when an element first comes into
 * view it eases up into place and then stays put. It does not re-run when you
 * scroll back up, because a page that re-animates every time you pass it feels
 * like a slideshow instead of a website.
 *
 * Two details that matter more than they look:
 *
 * `once` is not an optimisation, it is the behaviour. Replaying on every pass
 * makes a long page feel restless and, on a phone, makes you scroll past the
 * same flourish repeatedly.
 *
 * `prefers-reduced-motion` is checked in JS as well as CSS. Someone who has
 * asked their operating system to calm things down should get the content
 * immediately, without a flash of the hidden state first.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'header';
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  // Reduced motion wins before we ever hide anything.
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    // If it is already on screen at mount it should not wait to be observed,
    // otherwise the first section you land on sits blank for a beat.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.92 && box.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      // Fire slightly before the element is fully in view so the movement
      // finishes as it settles, rather than starting once you are already
      // looking at a static block.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const style = reduced
    ? undefined
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translate3d(0, ${y}px, 0)`,
        transition: `opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 720ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      };

  return (
    <Tag ref={ref as never} className={className} style={style}>
      {children}
    </Tag>
  );
}

/**
 * Staggered children.
 *
 * Applying the same delay by hand to five cards is how you end up with 0ms,
 * 80ms, 160ms, 200ms, 240ms and one card that arrives late. This spaces them
 * by index so the rhythm is even by construction.
 */
export function RevealList({
  children,
  step = 90,
  start = 0,
  className = '',
}: {
  children: ReactNode[];
  step?: number;
  start?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} delay={start + i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
