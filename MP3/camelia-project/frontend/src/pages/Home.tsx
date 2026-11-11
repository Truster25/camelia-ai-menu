import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Coffee, Quote, Sparkles, UtensilsCrossed } from 'lucide-react';
import { api } from '../lib/api';
import type { Dish } from '../lib/types';
import { DishCard } from '../components/DishCard';
import { SectionHeading, Spinner } from '../components/ui';
import { useCart } from '../context/CartContext';

const quizSteps = [
  { n: '01', title: 'Tell us your taste', body: 'Diet, spice, budget, cuisine and the occasion — five quick questions.' },
  { n: '02', title: 'The AI ranks the menu', body: 'TF-IDF similarity, preference rules, popularity and occasion are blended into one score.' },
  { n: '03', title: 'Your top 5, explained', body: 'Every dish comes with a score and a plain-English reason you can trust.' },
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
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch lg:grid-cols-[1.05fr_1fr_0.75fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 lg:py-24 lg:pr-0">
            <p className="kicker">
              <span className="kicker-line" /> Good food. Good moments.
            </p>
            <h1 className="mt-7 font-display text-[clamp(2.9rem,6.4vw,5rem)] leading-[1.02] tracking-[-0.045em] text-sage-100">
              Made for
              <br />
              moments <em className="not-italic text-amber-soft">worth</em>
              <br />
              <em className="not-italic text-amber-soft">savouring.</em>
            </h1>
            <p className="mt-7 max-w-sm text-sm leading-relaxed text-sage-300">
              From your first coffee to your favourite plate, find a little something to love at Camelia — now guided by
              an AI that actually knows the menu.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/recommend" className="group inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.14em] text-sage-100">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-logo text-forest-950 transition group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </span>
                Find my dish
              </Link>
              <Link to="/menu" className="btn-ghost">
                Explore the menu
              </Link>
            </div>

            <a href="#story" className="mt-12 inline-flex items-center gap-3 text-[8.5px] uppercase tracking-[0.2em] text-sage-400">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-sage-400/50">
                <ArrowDown size={13} />
              </span>
              Scroll to explore
            </a>
          </div>

          <div className="relative min-h-[360px] lg:min-h-[620px]">
            <img
              src="/images/hero-dish.jpg"
              alt="A plated chicken dish with garden vegetables in the Camelia dining room"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="hero-shade absolute inset-0" aria-hidden="true" />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-soft/35"
              aria-hidden="true"
            />
            <div className="absolute inset-x-8 bottom-7 flex items-center justify-between text-[8.5px] uppercase tracking-[0.18em] text-cream/80">
              <span>The Camelia experience</span>
              <span>01 — 03</span>
            </div>
          </div>

          <aside className="hidden flex-col justify-between bg-forest-700 px-8 py-24 lg:flex">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-soft">A place to belong</p>
              <h2 className="mt-5 max-w-[200px] font-display text-[26px] leading-snug text-sage-100">
                Good food tastes even better together.
              </h2>
              <span className="mt-6 block h-px w-7 bg-amber-soft" />
              <p className="mt-5 text-xs leading-relaxed text-sage-300">
                Come for the flavours.
                <br />
                Stay for the feeling.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[8.5px] uppercase leading-[2] tracking-[0.16em] text-sage-400">
              <span className="text-3xl text-amber-logo" aria-hidden="true">✳</span>
              <span>
                Café &amp; Restaurant
                <br />
                <strong className="text-[9.5px] text-sage-100">Kigali, Rwanda</strong>
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* ----------------------------------------------------------------- intro */}
      <section id="story" className="bg-cream text-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 md:grid-cols-[0.7fr_1.6fr_0.5fr] md:py-28">
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
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24">
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
      <section className="relative overflow-hidden bg-forest-800">
        <div className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-amber-soft/15" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1fr_1.1fr]">
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
      <section className="bg-amber-logo text-forest-950">
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

    </div>
  );
}
