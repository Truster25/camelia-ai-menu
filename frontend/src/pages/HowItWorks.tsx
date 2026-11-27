import { Link } from 'react-router-dom';
import { ArrowRight, Braces, Filter, Gauge, Scale, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../context/LanguageContext';
import type { RecommendMeta } from '../lib/types';

export function HowItWorks() {
  const { t } = useLang();
  const [meta, setMeta] = useState<RecommendMeta | null>(null);
  useEffect(() => {
    api.get<RecommendMeta>('/recommend/meta').then(setMeta).catch(() => setMeta(null));
  }, []);

  const signals = useMemo(
    () => [
      {
        icon: <Braces size={18} />,
        weight: '40%',
        title: t('ai.stat2'),
        body: t('howitworks.signal.similarity.body'),
      },
      {
        icon: <Scale size={18} />,
        weight: '25%',
        title: t('ai.stat3'),
        body: t('howitworks.signal.preference.body'),
      },
      {
        icon: <Gauge size={18} />,
        weight: '20%',
        title: t('howitworks.signal.popularity.title'),
        body: t('howitworks.signal.popularity.body'),
      },
      {
        icon: <Sparkles size={18} />,
        weight: '15%',
        title: t('ai.stat4'),
        body: t('howitworks.signal.occasion.body'),
      },
    ],
    [t],
  );

  return (
    <div data-header-theme="dark" className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <p className="kicker">{t('howitworks.kicker')}</p>
      <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.06] tracking-[-0.035em]">
        {t('howitworks.title')} <em className="not-italic text-amber-soft">{t('howitworks.title.accent')}</em>{t('howitworks.title.suffix')}
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-sage-400">
        {t('howitworks.body.pre')} <em>{t('howitworks.body.em')}</em> {t('howitworks.body.post')}
      </p>

      <div className="mt-10 rounded-2xl border border-amber-soft/25 bg-forest-850 p-6">
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-soft">
          <Filter size={13} /> {t('howitworks.filtersFirst')}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-sage-300">
          {t('howitworks.filtersBody.pre')} <strong className="text-sage-100">{t('howitworks.filtersBody.strong')}</strong> {t('howitworks.filtersBody.post')}
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
        <h2 className="font-display text-xl">{t('howitworks.finalScore')}</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-forest-950 p-4 text-[12px] leading-relaxed text-amber-pale/90">
{`score = 100 × (0.40 × similarity
            + 0.25 × preference
            + 0.20 × popularity
            + 0.15 × occasion)`}
        </pre>
        <p className="mt-4 text-[13px] leading-relaxed text-sage-400">
          {t('howitworks.finalScoreBody')}
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
        <h2 className="font-display text-xl">{t('howitworks.evaluation')}</h2>
        <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-sage-400">
          <p>
            {t('howitworks.eval.p1')}
          </p>
          <p>
            {t('howitworks.eval.p2')}
          </p>
          <p className="text-sage-400/80">
            {t('howitworks.eval.limitations')}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/recommend" className="btn-primary">{t('howitworks.tryQuiz')} <ArrowRight size={14} /></Link>
        <Link to="/menu" className="btn-quiet">
          {t('cart.browse')}
        </Link>
      </div>
    </div>
  );
}
