import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { tiltEvents } from '../lib/tilt';

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
  interval?: number;
  mirrored?: boolean;
  anchor?: string;
  label?: string;
};

export function StoryCarousel({ slides, interval = 6500, mirrored = false, anchor, label }: Props) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const { t } = useLang();
  const count = slides.length;
  const slide = slides[index % count];

  useEffect(() => {
    if (count <= 1 || hovered || focused) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = window.setInterval(() => {
      if (!motion.matches) setIndex((current) => (current + 1) % count);
    }, interval);
    return () => window.clearInterval(timer);
  }, [count, interval, hovered, focused]);

  if (!slide) return null;

  function go(step: number) {
    setIndex((current) => ((current + step) % count + count) % count);
  }

  return (
    <section
      id={anchor}
      data-header-theme="dark"
      className={mirrored ? 'home-story home-story--mirrored' : 'home-story'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      aria-roledescription={count > 1 ? 'carousel' : undefined}
      aria-label={label ?? 'Camelia story'}
    >
      <div className="home-shell home-story-grid">
        <div className="home-story-copy">
          <p className="home-kicker">{label ?? t('footer.story')}</p>
          <div key={slide.id} className="home-slide">
            <h2 className="home-heading">
              {slide.title} <em>{slide.accent}</em>
            </h2>
            <p className="home-description">{slide.body}</p>
          </div>
          <div className="home-actions">
            <Link to={slide.cta?.to ?? '/menu'} className="home-action home-action--solid tilt" {...tiltEvents}>
              {slide.cta?.label ?? t('home.hero.explore')} <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link to={slide.cta2?.to ?? '/recommend'} className="home-action tilt" {...tiltEvents}>
              {slide.cta2?.label ?? t('nav.recommend')}
            </Link>
          </div>
          {count > 1 && (
            <div className="home-story-controls">
              <button type="button" onClick={() => go(-1)} className="home-icon-action tilt" aria-label={t('common.back')} {...tiltEvents}>
                <ArrowLeft size={19} aria-hidden="true" />
              </button>
              <span className="home-slide-count" aria-live="off">{(index % count) + 1} / {count}</span>
              <button type="button" onClick={() => go(1)} className="home-icon-action tilt" aria-label={t('common.next')} {...tiltEvents}>
                <ArrowRight size={19} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        <div className="home-story-orbit">
          <article className="home-story-photo tilt" {...tiltEvents}>
            <img key={slide.id} src={slide.image} alt={slide.alt} loading="lazy" decoding="async" />
          </article>
        </div>
      </div>
    </section>
  );
}
