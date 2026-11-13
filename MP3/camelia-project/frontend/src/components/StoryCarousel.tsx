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
  cta?: { label: string; to: string };
  cta2?: { label: string; to: string };
};

type Props = {
  slides: StorySlide[];
  /** Milliseconds per slide before it advances on its own. */
  interval?: number;
  /** Photograph on the left, copy on the right. */
  mirrored?: boolean;
  /** Anchor id, so footer links can jump straight to the band. */
  anchor?: string;
  label?: string;
};

/**
 * The cream "story" band, also used mirrored for the drinks card.
 *
 * A cream card inset on the dark page, with two round arrows sitting in the
 * gutters either side. The arrows sit in a circular bite taken out of the card:
 * a dark disc is painted *over* the card edge, then the cream arrow sits
 * centred inside it. A disc — not a tall capsule — because a capsule's straight
 * vertical edges read as a black wedge driven into the card.
 *
 * The card is inset on md+ so the gutters exist at all; on small screens there
 * is no room, so the arrows move below the card instead of covering the food.
 *
 * Sideways motion only, and `prefers-reduced-motion` turns it off entirely.
 */
export function StoryCarousel({ slides, interval = 6500, mirrored = false, anchor, label }: Props) {
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

  const slide = slides[index];

  return (
    <section
      id={anchor}
      data-header-theme="light"
      className="relative bg-forest-900 px-5 py-12 sm:px-8 md:py-16 lg:px-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={label ?? 'Camelia story'}
    >
      <div className="relative mx-auto max-w-[1460px]">
        {/* Circular bites. Painted in the section's own colour, over the card
            edge, so the cream appears to curve away around each arrow. Only
            drawn where the gutters exist (md and up). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-10 hidden h-[86px] w-[86px] -translate-y-1/2 rounded-full bg-forest-900 md:left-[5px] md:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 z-10 hidden h-[86px] w-[86px] -translate-y-1/2 rounded-full bg-forest-900 md:right-[5px] md:block"
        />

        {/* the card */}
        <div
          data-header-theme="light"
          className="overflow-hidden rounded-[22px] bg-cream text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] md:mx-12"
        >
          <div
            key={slide.id}
            className={`grid items-center gap-2 motion-safe:animate-[storyIn_650ms_ease-out] ${
              mirrored ? 'md:grid-cols-[0.85fr_1.15fr]' : 'md:grid-cols-[1.15fr_0.85fr]'
            } lg:gap-6`}
          >
            {/* copy */}
            <div
              className={`px-7 pb-4 pt-10 sm:px-10 md:py-14 lg:px-14 ${
                mirrored ? 'md:order-2' : ''
              }`}
            >
              <h2 className="max-w-[22ch] text-[clamp(1.5rem,2.7vw,2.3rem)] font-semibold uppercase leading-[1.18] tracking-[-0.01em] text-[#26271e]">
                {slide.title} <span className="text-[#8a5a2b]">{slide.accent}</span>
              </h2>

              <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.85] text-[#6b6f63]">{slide.body}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={slide.cta?.to ?? '/menu'}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#262620] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a3a30]"
                >
                  {slide.cta?.label ?? 'Read more'}
                </Link>
                <Link
                  to={slide.cta2?.to ?? '/recommend'}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8a5a2b] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#a06a33]"
                >
                  {slide.cta2?.label ?? 'Take the quiz'}
                </Link>
              </div>
            </div>

            {/* plate — blends into the card because it was shot on cream */}
            <div
              className={`relative flex items-center justify-center px-4 pb-8 md:py-8 ${
                mirrored ? 'md:order-1 md:pl-8' : 'md:pr-8'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                loading="lazy"
                decoding="async"
                className="h-auto w-full max-w-[460px] md:max-w-none"
              />
            </div>
          </div>
        </div>

        {/* Arrows: in the gutters on md+, in a row under the card on phones.
            Each sits centred in its circular bite. */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous"
          className="mx-auto mt-6 grid h-11 w-11 place-items-center rounded-full bg-[#f6f3ec] text-[#4a4b42] transition hover:bg-white md:absolute md:left-[26px] md:top-1/2 md:z-20 md:mt-0 md:-translate-y-1/2"
        >
          <ArrowLeft size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next"
          className="mx-auto mt-3 grid h-11 w-11 place-items-center rounded-full bg-[#f6f3ec] text-[#4a4b42] transition hover:bg-white md:absolute md:right-[26px] md:top-1/2 md:z-20 md:mt-0 md:-translate-y-1/2"
        >
          <ArrowRight size={18} strokeWidth={1.6} />
        </button>
      </div>
    </section>
  );
}
