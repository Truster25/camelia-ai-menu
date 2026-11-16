import { Link } from 'react-router-dom';

type Props = {
  image: string;
  alt: string;
  title: string;
  accent: string;
  body: string;
  ctaLabel?: string;
  ctaTo?: string;
  ctaLabel2?: string;
  ctaTo2?: string;
};

/**
 * The second feature card: photogragraph on the LEFT, copy on the RIGHT —
 * mirrored from StoryCarousel, matching the reference's second card.
 *
 * Same cream card, same rounded corners, same two-button pairing, so the two
 * cards read as a set rather than two unrelated blocks.
 */
export function FeatureCard({
  image,
  alt,
  title,
  accent,
  body,
  ctaLabel = 'Read more',
  ctaTo = '/menu',
  ctaLabel2 = 'Take the quiz',
  ctaTo2 = '/recommend',
}: Props) {
  return (
    <section data-header-theme="light" className="bg-forest-900 px-5 py-8 sm:px-8 md:py-12 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div
            data-header-theme="light"
            className="overflow-hidden rounded-[22px] bg-cream text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
          <div className="grid items-center gap-2 md:grid-cols-[0.85fr_1.15fr] lg:gap-6">
            {/* plate on the LEFT — the mirror of the story card */}
            <div className="relative flex items-center justify-center px-4 pt-8 md:py-8 md:pl-8">
              <img
                src={image}
                alt={alt}
                loading="lazy"
                decoding="async"
                className="h-auto w-full max-w-[460px] md:max-w-none"
              />
            </div>

            {/* copy on the RIGHT */}
            <div className="px-7 pb-10 pt-4 sm:px-10 md:py-14 lg:px-14">
              <h2 className="max-w-[22ch] text-[clamp(1.5rem,2.7vw,2.3rem)] font-semibold uppercase leading-[1.18] tracking-[-0.01em] text-[#26271e]">
                {title} <span className="text-[#8a5a2b]">{accent}</span>
              </h2>

              <p className="mt-5 max-w-[46ch] text-[13.5px] leading-[1.85] text-[#6b6f63]">{body}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={ctaTo}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#262620] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a3a30]"
                >
                  {ctaLabel}
                </Link>
                <Link
                  to={ctaTo2}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#8a5a2b] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#a06a33]"
                >
                  {ctaLabel2}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
