import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type StorySlide = {
  id: string;
  image: string;
  alt: string;
  title: string;
  accent: string;
  body: string;
};

type Props = {
  slides: StorySlide[];
  /** Milliseconds per slide before it advances on its own. */
  interval?: number;
};

/**
 * The "Welcome to Camelia" band.
 *
 * A cream card inset on the dark page, text on the left and the dish plate on
 * the right, with two round arrows overlapping the card edges. Arrows sit
 * outside the card on purpose: that is what keeps the left and right margins
 * looking as generous as the design reference.
 *
 * Sideways motion only, and `prefers-reduced-motion` turns it off entirely.
 */
export function StoryCarousel({ slides, interval = 6500 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (step: number) => setIndex((current) => ((current + step) % count + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => setIndex((c) => (c + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, interval, paused]);

  if (!count) return null;

  return (
    <section
      id="story"
      data-header-theme="light"
      className="relative overflow-hidden bg-forest-900 px-5 py-16 sm:px-8 md:py-20 lg:px-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Welcome to Camelia"
    >
      <div className="relative mx-auto max-w-[1400px]">
        {/* the card */}
        <div
            data-header-theme="light"
            className="overflow-hidden rounded-[22px] bg-cream text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
          <div
            key={slides[index].id}
            className="grid items-center gap-2 motion-safe:animate-[storyIn_650ms_ease-out] md:grid-cols-[1.15fr_0.85fr] lg:gap-6"
          >
            {/* copy */}
            <div className="px-7 pb-4 pt-10 sm:px-10 md:py-14 lg:px-14">
              <h2 className="max-w-[22ch] text-[clamp(1.5rem,2.7vw,2.3rem)] font-semibold uppercase leading-[1.18] tracking-[-0.01em] text-[#26271e]">
                {slides[index].title}{' '}
                <span className="text-[#8a5a2b]">{slides[index].accent}</span>
              </h2>

              <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.85] text-[#6b6f63]">{slides[index].body}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#262620] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a3a30]"
                >
                  Read more
                </Link>
                <Link
                  to="/recommend"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8a5a2b] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#a06a33]"
                >
                  Take the quiz
                </Link>
              </div>
            </div>

            {/* plate — blends into the card because it was shot on cream */}
            <div className="relative flex items-center justify-center px-4 pb-8 md:py-8 md:pr-8">
              <img
                src={slides[index].image}
                alt={slides[index].alt}
                loading="lazy"
                decoding="async"
                className="h-auto w-full max-w-[460px] md:max-w-none"
              />
            </div>
          </div>
        </div>

        {/* arrows overlap the card edges so the gutters stay wide */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous"
          className="absolute bottom-4 left-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-[#e8e4d8] text-ink shadow-[0_6px_20px_-6px_rgba(0,0,0,0.45)] transition hover:bg-white sm:h-12 sm:w-12 md:-left-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          <ArrowLeft size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next"
          className="absolute bottom-4 right-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-[#e8e4d8] text-ink shadow-[0_6px_20px_-6px_rgba(0,0,0,0.45)] transition hover:bg-white sm:h-12 sm:w-12 md:-right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          <ArrowRight size={18} strokeWidth={1.6} />
        </button>
      </div>
    </section>
  );
}
