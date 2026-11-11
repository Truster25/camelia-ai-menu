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
    body: 'Each dish is turned into a text profile (name, description, ingredients, cuisine, dietary facts, spice and occasion tags). The quiz answers become one more document. TF-IDF converts both into vectors and cosine similarity measures how close they are — the classic content-based filtering approach.',
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
    body: 'A Bayesian-style blend. With no ratings, a curated popularity seed is used. From one rating upwards the real average starts to dominate, reaching full weight after five reviews — so new data replaces assumptions instead of being drowned by them.',
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
        Camelia’s AI is a hybrid content-based ranker. Every recommendation shows its score and the four signals behind it,
        because in a restaurant the guest deserves to know <em>why</em> — and the project needs to defend the method.
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
          Weights live in <code className="rounded bg-forest-950 px-1.5 py-0.5 text-amber-pale">backend/app/recommender.py</code>{' '}
          and are also served by <code className="rounded bg-forest-950 px-1.5 py-0.5 text-amber-pale">GET /api/recommend/meta</code>,
          so the UI never hardcodes the model. Changing a weight changes the ranking everywhere at once.
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
            Every quiz is written to <code className="rounded bg-forest-950 px-1.5 py-0.5 text-amber-pale">recommendation_logs</code>{' '}
            with the answers, the ranked ids and the top score. When a guest adds a recommended dish to their order, the
            chosen dish is recorded against that log.
          </p>
          <p>
            That gives two measurable numbers for the report: how often a recommendation is acted on (top-5 click-through)
            and how often the number-one dish is chosen (top-1 hit rate). Until real guests use the system, those numbers
            describe demo traffic only and must be labelled as such.
          </p>
          <p className="text-sage-400/80">
            Known limitations: the corpus is 26 dishes, ratings are still sparse, and there is no collaborative filtering
            yet. Both are deliberate — the build plan says to add collaborative signals only when enough real ratings exist.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/recommend" className="btn-primary">Try the quiz <ArrowRight size={14} /></Link>
        <a
          href={`${(import.meta.env.VITE_API_URL ?? 'http://localhost:9000').replace(/\/$/, '')}/docs`}
          target="_blank"
          rel="noreferrer"
          className="btn-quiet"
        >
          API documentation
        </a>
      </div>
    </div>
  );
}
