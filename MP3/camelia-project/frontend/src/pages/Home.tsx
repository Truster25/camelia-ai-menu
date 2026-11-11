import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Coffee, Quote, Sparkles, UtensilsCrossed } from 'lucide-react';
import { api, formatRwf } from '../lib/api';
import type { Dish } from '../lib/types';
import { DishCard } from '../components/DishCard';
import { HeroSlideshow } from '../components/HeroSlideshow';
import type { HeroSlide } from '../components/HeroSlideshow';
import { SectionHeading, Spinner } from '../components/ui';
import { useCart } from '../context/CartContext';

const quizSteps = [
  { n: '01', title: 'Tell us your taste', body: 'Diet, spice, budget, cuisine and the occasion — five quick questions.' },
  { n: '02', title: 'The AI ranks the menu', body: 'TF-IDF similarity, preference rules, popularity and occasion are blended into one score.' },
  { n: '03', title: 'Your top 5, explained', body: 'Every dish comes with a score and a plain-English reason you can trust.' },
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
    src: '/images/hero/dish-salad.jpg',
    alt: 'Avocado and tomato garden salad with groundnuts',
    dish: 'Camelia Garden Salad',
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

export function Home() {
  const [signatures, setSignatures] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { add } = useCart();

  useEffect(() => {
    api
      .get<Dish[]>('/dishes?sort=popularity')
      .then((dishes) => {
        setSignatures(dishes.filter((dish) => dish.is_signature).slice(0, 3));
        if (dishes.length) setSignatures((current) => (current.length ? current : dishes.slice(0, 3)));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      {/* ------------------------------------------------------------------ hero */}
      <section data-header-hero className="relative min-h-[100svh] w-full">
        <div className="relative min-h-[100svh]">
          {/* the photograph fills the whole first screen; header floats over it */}
          <div className="relative min-h-[100svh] w-full">
            <HeroSlideshow slides={heroSlides} interval={4000} className="absolute inset-0" />

            {/* copy sits on top of the photograph */}
            <div className="hero-copy relative z-10 flex h-full flex-col justify-center px-5 pb-20 pt-24 sm:px-10 sm:pb-24 sm:pt-28 lg:max-w-[62%] lg:px-14 lg:pb-24 lg:pt-32 xl:max-w-[58%]">
              <h1 className="max-w-[13ch] font-display text-[clamp(2rem,5.4vw,4.6rem)] leading-[1.03] tracking-[-0.03em] text-cream">
                Good food
                <br />
                creates
                <br />
                <em className="not-italic text-amber-logo">better days</em>
              </h1>

              <span className="mt-7 block h-px w-10 bg-cream/40" aria-hidden="true" />

              <p className="mt-6 max-w-[30ch] text-[13.5px] leading-[1.9] text-cream/85">
                We blend modern techniques with seasonal ingredients to create dishes that inspire and bring people
                together.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link to="/menu" className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-logo text-forest-950 transition group-hover:translate-x-1">
                    <ArrowRight size={18} />
                  </span>
                  Explore our menu
                </Link>
                <Link to="/recommend" className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/70 transition hover:text-cream sm:inline-flex">
                  <Sparkles size={13} /> Ask the AI
                </Link>
              </div>

            </div>
          </div>

          {/* right-hand panel, exactly like the reference layout */}
          <aside className="absolute inset-y-0 right-0 z-10 hidden w-[440px] flex-col justify-center px-10 py-24 lg:flex xl:w-[480px] xl:px-12">
            {/* glass wash: no hard edge, the photograph still reads through it */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/70 via-black/45 to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/5" aria-hidden="true" />
            <div className="relative">
            <p className="text-[11px] tracking-[0.04em] text-sage-300/80">A seat at our table.</p>

            <h2 className="mt-6 font-display text-[clamp(1.9rem,2.4vw,2.5rem)] leading-[1.18] tracking-[-0.02em] text-cream">
              Your next
              <br />
              favourite <em className="not-italic text-amber-logo">meal.</em>
            </h2>

            <p className="mt-7 max-w-[30ch] text-[13.5px] leading-[1.85] text-sage-300">
              A little about your taste.
              <br />
              A little more delight on your plate.
            </p>

            <p className="mt-5 max-w-[34ch] text-[12px] leading-[1.85] text-sage-400">
              Tell us what you enjoy. We’ll save your preferences and show you dishes that answer them.
            </p>

            <Link
              to="/recommend"
              className="mt-9 inline-flex w-fit items-center gap-4 rounded-full bg-amber-logo px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-forest-950 transition hover:bg-amber-pale"
            >
              View your taste profile <ArrowRight size={15} />
            </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ----------------------------------------------------------------- intro */}
      <section id="story" data-header-theme="light" className="bg-cream text-ink">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-20 sm:px-8 lg:px-10 md:grid-cols-[0.7fr_1.6fr_0.5fr] md:py-28">
          <p className="kicker self-start pt-2 !text-[#956328]">
            <span className="kicker-line !bg-[#956328]" /> Welcome to Camelia
          </p>
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.1] tracking-[-0.035em]">
              Good food has a way of <em className="not-italic text-[#a86d2b]">bringing us together.</em>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#6b7568]">
              A place for the everyday catch-ups, long lunches and the dishes you can’t stop thinking about. In 2026 the
              menu learned a new trick: it now suggests the plate that fits <em>you</em> — your diet, your budget, your
              moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cream transition hover:bg-[#3a4a3e]">
                Full menu <ArrowRight size={14} />
              </Link>
              <Link to="/recommend" className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink">
                Take the quiz
              </Link>
            </div>
          </div>
          <div className="hidden place-items-center md:grid">
            <div className="grid h-[120px] w-[120px] place-items-center rounded-full border border-[#b5b6a4] text-center text-[#8c7954]">
              <div className="flex flex-col items-center gap-2">
                <Coffee size={30} strokeWidth={1} />
                <span className="text-[8px] uppercase leading-[1.5] tracking-[0.12em]">
                  Thoughtfully
                  <br />
                  served
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ signatures */}
      <section data-header-theme="dark" className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8 lg:px-10 md:py-24">
        <SectionHeading
          kicker="Something for every craving"
          title={(
            <>
              A taste of <em className="not-italic text-amber-soft">Camelia.</em>
            </>
          )}
          description="Six sections, twenty-six dishes, and one AI that reads the whole menu before making a suggestion. These are the plates guests keep coming back for."
          action={
            <Link to="/menu" className="btn-quiet">
              All dishes <ArrowUpRight size={14} />
            </Link>
          }
        />

        {status === 'loading' && <Spinner label="Setting the table…" />}
        {status === 'error' && (
          <div className="card mt-10 p-8">
            <p className="font-display text-xl text-sage-100">The kitchen is offline</p>
            <p className="mt-2 text-sm text-sage-400">
              The menu API could not be reached. Start the backend with{' '}
              <code className="rounded bg-forest-950 px-1.5 py-0.5 text-xs text-amber-pale">uvicorn app.main:app --port 9000</code>{' '}
              and refresh.
            </p>
          </div>
        )}
        {status === 'ready' && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {signatures.map((dish, index) => (
              <DishCard key={dish.id} dish={dish} index={index} onAdd={add} />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------------- AI block */}
      <section data-header-theme="dark" className="relative overflow-hidden bg-forest-800">
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-amber-soft/15" aria-hidden="true" />
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-20 sm:px-8 lg:px-10 md:py-28 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="kicker">
              <span className="kicker-line" /> Made a little more personal
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] leading-[1.08] tracking-[-0.03em]">
              Not sure what to order?
              <br />
              <em className="not-italic text-amber-soft">Let the menu ask.</em>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-sage-300">
              Answer five short questions and Camelia’s recommender scores every available dish against your answers —
              diet, spice, budget, cuisine and occasion. Dietary needs are hard filters: if it is not halal, it will never
              appear in a halal result.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/recommend" className="btn-primary">
                <Sparkles size={15} /> Start the 60-second quiz
              </Link>
              <Link to="/how-it-works" className="btn-quiet">
                How it works
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['26', 'Dishes ranked'],
                ['40%', 'Text similarity'],
                ['25%', 'Preference rules'],
                ['15%', 'Occasion match'],
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
                  <h3 className="font-display text-xl text-sage-100">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-sage-400">{step.body}</p>
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
            fondant — exactly what I would have ordered after ten minutes of arguing with my friends.”
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Demo feedback · Aline M. · Kigali
          </p>
          <Link to="/recommend" className="inline-flex items-center gap-2 rounded-full border border-forest-950/40 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition hover:bg-forest-950 hover:text-cream">
            <UtensilsCrossed size={14} /> Find your dish
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- price strip */}
      {status === 'ready' && signatures[0] && (
        <section data-header-theme="dark" className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-10">
          <div className="card flex flex-wrap items-center justify-between gap-6 p-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-amber-soft">Today at the counter</p>
              <p className="mt-2 font-display text-xl text-sage-100">
                {signatures[0].name} · <span className="text-amber-pale">{formatRwf(signatures[0].price_rwf)}</span>
              </p>
            </div>
            <Link to={`/menu/${signatures[0].id}`} className="btn-ghost">
              See the dish <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
