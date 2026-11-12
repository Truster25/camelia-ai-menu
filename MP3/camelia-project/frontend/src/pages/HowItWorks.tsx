import { Link } from 'react-router-dom';
import { ArrowRight, Braces, Filter, Gauge, Scale, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RecommendMeta } from '../lib/types';

const signals = [
  {
    icon: <Braces size={18} />,
    weight: '40%',
    title: 'Text similarity',
    body: 'Every dish is read for its name, description, ingredients, cuisine, dietary facts, spice and occasion tags. Your quiz answers are read the same way, and the dishes whose profile sits closest to your answers rise to the top.',
  },
  {
    icon: <Scale size={18} />,
    weight: '25%',
    title: 'Preference rules',
    body: 'Explicit checks on the things a guest stated: does the dish match the requested diet, is the chilli level the same distance from the target, is the price under the stated ceiling, does the cuisine match? Each contributes a transparent, explainable point score.',
  },
  {
    icon: <Gauge size={18} />,
    weight: '20%',
    title: 'Popularity',
    body: 'A dish guests already love starts with a head start. From the first rating onwards real guest averages start to take over, and after five reviews they fully replace the starting assumption — so new opinions count more than old guesses.',
  },
  {
    icon: <Sparkles size={18} />,
    weight: '15%',
    title: 'Occasion match',
    body: 'A quick coffee and a birthday dinner should not get the same plate. Dishes carry occasion tags, and closely related occasions earn partial credit (a celebration dish is still reasonable for a date).',
  },
];

export function HowItWorks() {
  const [meta, setMeta] = useState<RecommendMeta | null>(null);
  useEffect(() => {
    api.get<RecommendMeta>('/recommend/meta').then(setMeta).catch(() => setMeta(null));
  }, []);

  return (
    <div data-header-theme="dark" className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <p className="kicker"><span className="kicker-line" /> Under the hood</p>
      <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.06] tracking-[-0.035em]">
        A recommender you can <em className="not-italic text-amber-soft">explain</em>, not just trust.
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sage-400">
        Camelia’s AI reads the whole menu, then ranks it around you. Every recommendation shows its score and the four
        signals behind it — because at the table you deserve to know <em>why</em> a dish was picked for you.
      </p>

      <div className="mt-10 rounded-2xl border border-amber-soft/25 bg-forest-850 p-6">
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-soft">
          <Filter size={13} /> Filters run first
        </p>
        <p className="mt-3 text-sm leading-relaxed text-sage-300">
          Dietary requirements are never a weighted score. If you ask for halal, vegetarian, vegan or gluten-free, dishes
          that do not carry that verified label are removed <strong className="text-sage-100">before</strong> ranking starts.
          A popular dish can never outscore a dietary requirement. Availability works the same way.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {signals.map((signal) => (
          <article key={signal.title} className="card p-6">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-amber-soft/40 text-amber-soft">{signal.icon}</span>
              <span className="font-display text-2xl text-amber-pale">{signal.weight}</span>
            </div>
            <h2 className="mt-4 font-display text-xl">{signal.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-sage-400">{signal.body}</p>
          </article>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl">The final score</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-forest-950 p-4 text-[12px] leading-relaxed text-amber-pale/90">
{`score = 100 × (0.40 × similarity
            + 0.25 × preference
            + 0.20 × popularity
            + 0.15 × occasion)`}
        </pre>
        <p className="mt-4 text-[13px] leading-relaxed text-sage-400">
          These four weights are fixed for every guest, so the same taste profile always ranks the menu the
          same way — and any single weight can be tuned without the rest of the model changing.
        </p>
        {meta && (
          <ul className="mt-4 grid gap-2 text-[12px] text-sage-300 sm:grid-cols-2">
            {Object.entries(meta.weights).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <span className="capitalize">{key}</span>
                <span className="text-amber-pale">{Math.round(value * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl">Evaluation, honestly</h2>
        <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-sage-400">
          <p>
            Every quiz is remembered with the answers you gave and the dishes it ranked, so the recommendations you see
            next time are shaped by what you actually chose.
          </p>
          <p>
            When you order a dish we suggested, we count it — that is how we know the suggestions are genuinely useful
            and not just plausible.
          </p>
          <p className="text-sage-400/80">
            Known limitations: the menu is still growing and guest ratings are new, so a collaborative
            &ldquo;people who liked this also liked&rdquo; signal is added only once enough real ratings exist.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/recommend" className="btn-primary">Try the quiz <ArrowRight size={14} /></Link>
        <Link to="/menu" className="btn-quiet">
          Browse the menu
        </Link>
      </div>
    </div>
  );
}
