import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroSlide = {
  src: string;
  alt: string;
  dish: string;
  category: string;
  price: string;
};

type Props = {
  slides: HeroSlide[];
  /** Milliseconds between automatic transitions. */
  interval?: number;
  /** Pause automatically while the pointer is over the image. */
  pauseOnHover?: boolean;
  className?: string;
};

/**
 * Crossfading plate rotation.
 *
 * All images are mounted at once and stacked, so switching is a pure opacity
 * change — no request, no layout shift, no flash of empty glass. The next image
 * is preloaded as soon as the component mounts.
 *
 * Respects `prefers-reduced-motion`: the rotation still happens, but without the
 * slow zoom, and the timer is left running (WCAG: motion, not change, is the issue).
 *
 * NOTE: the root deliberately carries no `relative` utility. Tailwind emits
 * `.relative` after `.absolute`, so a hardcoded `relative` here would silently
 * beat the `absolute inset-0` a caller passes in. The wrapper owns positioning.
 */
export function HeroSlideshow({ slides, interval = 3000, pauseOnHover = true, className = '' }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      if (paused) return;
      setIndex((current) => (current + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [slides.length, interval, paused]);

  if (!slides.length) return null;

  return (
    <div
      className={`overflow-hidden bg-forest-950 ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      onFocus={() => pauseOnHover && setPaused(true)}
      onBlur={() => pauseOnHover && setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Signature Camelia dishes"
    >
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-[1100ms] ease-out"
            style={{ opacity: active ? 1 : 0 }}
            aria-hidden={!active}
          >
            <img
              src={slide.src}
              alt={active ? slide.alt : ''}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setLoaded((current) => ({ ...current, [i]: true }))}
              className={`h-full w-full object-cover transition-transform ease-linear ${
                active ? 'scale-100' : 'scale-[1.06]'
              } ${reducedMotion.current ? '' : 'duration-[7000ms]'}`}
            />
          </div>
        );
      })}

      {/* readability + brand tint so every photo sits in the same dark palette */}
      <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/5 to-black/60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 to-transparent" aria-hidden="true" />

      {/* transition progress + slide controls */}
      <div className="absolute bottom-6 left-5 z-10 flex items-center gap-2.5 sm:left-1/2 sm:-translate-x-1/2">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            onClick={() => go(i)}
            className="group relative h-1 overflow-hidden rounded-full bg-white/25 transition-all"
            style={{ width: i === index ? 44 : 18 }}
            aria-label={`Show ${slide.dish}`}
            aria-current={i === index}
          >
            <span
              className="absolute inset-y-0 left-0 bg-amber-logo"
              style={{
                width: i === index ? '100%' : '0%',
                transition: i === index ? `width ${interval}ms linear` : 'none',
                animation: i === index && !paused ? 'none' : undefined,
              }}
            />
          </button>
        ))}
      </div>

      {/* current dish caption */}
      <div className="absolute bottom-6 right-5 z-10 max-w-[46%] text-right sm:right-6 sm:max-w-[58%]">
        <p className="text-[9px] uppercase tracking-[0.22em] text-amber-soft">Now plating</p>
        <p className="mt-1 truncate font-display text-base text-sage-100 sm:text-lg">{slides[index].dish}</p>
        <p className="text-[9px] uppercase tracking-[0.12em] text-sage-300/80 sm:text-[10px] sm:tracking-[0.14em]">
          {slides[index].category} · {slides[index].price}
        </p>
      </div>

      {!loaded[0] && <div className="absolute inset-0 -z-10 animate-pulse bg-forest-800" aria-hidden="true" />}
    </div>
  );
}
