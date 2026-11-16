import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Quote, Sparkles, UtensilsCrossed } from 'lucide-react';
import { api } from '../lib/api';
import type { Dish } from '../lib/types';
import { HeroSlideshow } from '../components/HeroSlideshow';
import { StoryCarousel } from '../components/StoryCarousel';
import type { StorySlide } from '../components/StoryCarousel';
import type { HeroSlide } from '../components/HeroSlideshow';
import { SectionHeading, Spinner } from '../components/ui';
import { DishReveal } from '../components/DishReveal';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';

const quizSteps = [
  { n: '01', title: 'quiz.step1.title', body: 'quiz.step1.body' },
  { n: '02', title: 'quiz.step2.title', body: 'quiz.step2.body' },
  { n: '03', title: 'quiz.step3.title', body: 'quiz.step3.body' },
];

/** Five clean plates that rotate every three seconds behind the landing hero. */
const heroSlides: HeroSlide[] = [
  {
    src: '/images/hero-dish.jpg',
    alt: 'Char-grilled chicken with rosemary potatoes and garden salad on a dark plate',
    dish: 'Chicken Brochette',
    category: 'From the grill',
    price: 'RWF 7,500',
  },
  {
    src: '/images/hero/dish-tilapia.jpg',
    alt: 'Whole grilled tilapia with lime, chilli and fried plantain',
    dish: 'Grilled Tilapia',
    category: 'From the grill',
    price: 'RWF 12,000',
  },
  {
    src: '/images/hero/dish-brochette.jpg',
    alt: 'Beef brochette skewers with charred onion and chilli dip',
    dish: 'Beef Brochette',
    category: 'From the grill',
    price: 'RWF 8,500',
  },
  {
    src: '/images/hero/dish-avocado-salad.jpg',
    alt: 'Avocado and tomato salad with groundnuts',
    dish: 'Avocado & Tomato Salad',
    category: 'Starters & salads',
    price: 'RWF 4,500',
  },
  {
    src: '/images/hero/dish-fondant.jpg',
    alt: 'Molten chocolate fondant with vanilla cream and raspberries',
    dish: 'Chocolate Fondant',
    category: 'Desserts',
    price: 'RWF 6,000',
  },
];

const storySlides: StorySlide[] = [
  {
    id: 'grill',
    image: '/images/story/story-grill.jpg',
    alt: 'Char-grilled chicken brochettes on a slate plate with chilli sauce and lime',
    title: 'Charcoal-kissed plates,',
    accent: 'made to order.',
    body: 'Skewers go on the grill when you order, not before. Brochette, tilapia and the day’s vegetables come off the fire and straight to your table. That is how a Kigali kitchen should work.',
  },
  {
    id: 'salad',
    image: '/images/story/story-salad.jpg',
    alt: 'Garden salad with avocado, cherry tomatoes and lemon dressing in a cream bowl',
    title: 'Fresh from the garden,',
    accent: 'never from a packet.',
    body: 'Leaves, tomatoes and avocados are cut the same morning you eat them. Lighter plates that still taste like a proper meal, and the ones our regulars order when it is hot.',
  },
  {
    id: 'fondant',
    image: '/images/story/story-fondant.jpg',
    alt: 'Warm chocolate fondant with vanilla ice cream and raspberries on a slate board',
    title: 'Something sweet,',
    accent: 'worth staying for.',
    body: 'Warm chocolate fondant, vanilla ice cream, raspberries. The dessert people order “just to share” and then finish alone. Ask the menu and it will find the one that fits your evening.',
  },
];

const drinkSlides: StorySlide[] = [
  {
    id: 'drinks',
    image: '/images/story/story-drinks.jpg',
    alt: 'Two iced coffee drinks on a cream linen table with scattered coffee beans',
    title: 'Refreshing drinks,',
    accent: 'brewed to order.',
    body: 'Single-origin pour over, iced mocha, spiced tea and cold juice pressed the same day. Whether you are working through the afternoon or cooling down after a long walk, there is a glass with your name on it.',
    cta: { label: 'See the drinks', to: '/menu' },
    cta2: { label: 'Ask the AI', to: '/recommend' },
  },
];

export function Home() {
  const [signatures, setSignatures] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { add: _add } = useCart();
  const { t } = useLang();

  const visibleDishes = useMemo(() => {
    // Signature plates first, then whatever else the menu holds. No pills any
    // more: the landing row is a taster, and /menu is where the full filter
    // lives. Four plates, matching the four-across reference row.
    return [...signatures]
      .sort(
        (a, b) =>
          Number(b.is_signature) - Number(a.is_signature) || b.popularity_seed - a.popularity_seed,
      )
      .slice(0, 4);
  }, [signatures]);

  useEffect(() => {
    api
      .get<Dish[]>('/dishes?sort=popularity')
      .then((dishes) => {
        // Keep the whole list: the pill row filters it in the browser.
        setSignatures(dishes);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      {/* ------------------------------------------------------------------ hero */}
      {/* Built from the reference the client sent: the whole site sits inside a
          rounded panel that floats above a blurred version of the food, with a
          deep shadow underneath. The blur is the same photograph, so the panel
          always agrees with what is inside it. */}
      <section data-header-hero className="relative w-full px-3 pb-14 pt-[86px] sm:px-5 sm:pb-20 sm:pt-[92px] lg:px-7">
        <div className="relative mx-auto max-w-[1560px]">
          {/* Blurred backdrop, inset and rounded, sitting behind the panel. */}
          <div className="absolute -inset-x-1 -bottom-2 top-2 -z-10 overflow-hidden rounded-[32px] sm:-inset-x-2 sm:rounded-[40px]">
            <HeroSlideshow
              slides={heroSlides}
              interval={5200}
              className="absolute inset-0 scale-105 blur-[30px] saturate-[1.15]"
            />
            {/* Only enough darkening to keep the halo from competing with the
                panel. Too much and it reads as flat black instead of glow. */}
            <div className="absolute inset-0 bg-forest-950/20" aria-hidden="true" />
          </div>

          {/* The panel itself. */}
          <div className="hero-panel relative overflow-hidden rounded-[26px] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] ring-1 ring-white/10 sm:rounded-[34px]">
            <HeroSlideshow slides={heroSlides} interval={5200} className="absolute inset-0" />

            {/* Scrim: the photograph has to stay visible, so this only darkens
                the left two-thirds where the type sits. */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950/94 via-forest-950/62 to-forest-950/20"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-forest-950/25"
              aria-hidden="true"
            />

            <div className="relative flex min-h-[520px] flex-col justify-center px-6 py-20 sm:px-10 sm:py-24 lg:min-h-[600px] lg:px-14 lg:py-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-pale/90">
                {t('home.aside.kicker')}
              </p>

              <h1 className="mt-6 max-w-[14ch] font-display text-[clamp(2.1rem,5vw,4.4rem)] leading-[1.03] tracking-[-0.03em] text-cream">
                {t('home.hero.line1')} <br />
                {t('home.hero.line2')} <br />
                <em className="not-italic text-amber-logo">{t('home.hero.line3')}</em>
              </h1>

              <span className="mt-8 block h-px w-10 bg-cream/40" aria-hidden="true" />

              {/* Copy is capped to a narrow column so it never reaches the
                  plate. The plate owns the right half of the photograph. */}
              <p className="mt-8 max-w-[38ch] text-[13px] leading-[1.8] text-sage-200/85">
                {t('home.aside.lead')}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  to="/menu"
                  className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-cream"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-logo text-forest-950 transition group-hover:translate-x-1">
                    <ArrowRight size={18} />
                  </span>
                  {t('home.hero.explore')}
                </Link>
                <Link
                  to="/recommend"
                  className="inline-flex items-center gap-2 rounded-full bg-cream/95 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-forest-950 transition hover:bg-amber-pale"
                >
                  {t('home.aside.cta')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- story */}
      <StoryCarousel slides={storySlides} />

      {/* ------------------------------------------------------------ signatures */}
      {/* Four plates, four cards. The reference this is built from keeps four
          items in the row and lets the type underneath do the naming, so the
          photographs are the whole card. */}
      <section
        data-header-theme="dark"
        className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10 md:py-24"
      >
        <SectionHeading
          kicker={t('dishes.kicker')}
          title={
            <>
              {t('dishes.title')}{' '}
              <em className="not-italic text-amber-soft">{t('dishes.title.accent')}</em>
            </>
          }
          description={t('dishes.body')}
          action={
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-200 transition hover:border-white/50 hover:text-white"
            >
              {t('dishes.all')} <ArrowUpRight size={14} />
            </Link>
          }
        />

        {status === 'loading' && <Spinner label={t('dishes.loading')} />}

        {status === 'error' && (
          <div className="card mt-10 p-8">
            <p className="font-display text-xl text-sage-100">{t('dishes.empty.title')}</p>
            <p className="mt-2 text-sm text-sage-400">{t('dishes.empty.body')}</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 md:mt-16 md:grid-cols-4 md:gap-x-7">
            {visibleDishes.map((dish) => (
              <DishReveal key={dish.id} dish={dish} category={dish.category_name} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ second card */}
      {/* The drinks card is the same band as the story card, mirrored, so the
          two read as one set and both get the same arrows and slide timing. */}
      <StoryCarousel
        slides={drinkSlides}
        interval={7000}
        mirrored
        anchor="drinks"
        label="Drinks at Camelia"
      />

      {/* --------------------------------------------------------------- AI block */}
      <section data-header-theme="dark" className="relative overflow-hidden bg-forest-800">
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-amber-soft/15" aria-hidden="true" />
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-20 sm:px-8 lg:px-10 md:py-28 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="kicker">
              <span className="kicker-line" /> {t('ai.kicker')}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.08] tracking-[-0.03em]">
              {t('ai.title1')}
              <br />
              <em className="not-italic text-amber-soft">{t('ai.title2')}</em>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-sage-300">
              {t('ai.body')}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/recommend" className="btn-primary">
                <Sparkles size={15} /> {t('ai.cta')}
              </Link>
              <Link to="/how-it-works" className="btn-quiet">
                {t('ai.how')}
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['26', t('ai.stat1')],
                ['40%', t('ai.stat2')],
                ['25%', t('ai.stat3')],
                ['15%', t('ai.stat4')],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl text-amber-pale">{value}</dt>
                  <dd className="mt-1 text-[9px] uppercase leading-relaxed tracking-[0.14em] text-sage-400">{label}</dd>
                </div>
              ))}
            </dl>
            </div>

          <ol className="space-y-4">
            {quizSteps.map((step) => (
              <li key={step.n} className="card flex items-start gap-5 p-6">
                <span className="font-display text-3xl text-amber-soft/70">{step.n}</span>
                <div>
                  <h3 className="font-display text-xl text-sage-100">{t(step.title)}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-sage-400">{t(step.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------- testimonial */}
      <section data-header-theme="light" className="bg-amber-logo text-forest-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8">
          <Quote size={28} strokeWidth={1.2} aria-hidden="true" />
          <p className="max-w-2xl font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug">
            “I typed vegetarian, medium spice, mid budget, date night. It gave me the mushroom soup and the chocolate
            fondant, exactly what I would have ordered after ten minutes of arguing with my friends.”
          </p>
          <Link to="/recommend" className="inline-flex items-center gap-2 rounded-full border border-forest-950/40 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-forest-950 hover:text-cream">
            <UtensilsCrossed size={14} /> {t('quote.cta')}
          </Link>
        </div>
      </section>

    </div>
  );
}
