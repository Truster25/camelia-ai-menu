import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles, Wand2, X } from 'lucide-react';
import { api, ApiError, formatRwf } from '../lib/api';
import { DishArt } from '../components/DishCard';
import { ErrorNote, ScoreBar, Spinner, Stars } from '../components/ui';
import { useCart } from '../context/CartContext';
import type { QuizAnswers, RecommendMeta, RecommendResponse, Recommendation } from '../lib/types';

const steps: { key: keyof QuizAnswers; title: string; question: string; help: string }[] = [
  { key: 'diet', title: 'Dietary needs', question: 'Anything we should leave off the plate?', help: 'This is a hard filter — dishes that do not qualify never appear in your results.' },
  { key: 'spice', title: 'Spice', question: 'How much heat do you like?', help: 'We score dishes by how close their chilli level is to yours.' },
  { key: 'budget', title: 'Budget', question: 'What are you spending per plate?', help: 'Prices are in Rwandan francs; anything above your ceiling is heavily penalised.' },
  { key: 'cuisine', title: 'Cuisine', question: 'What kind of food sounds good?', help: 'Local Rwandan classics, regional African plates, or something international.' },
  { key: 'occasion', title: 'Occasion', question: 'What is the moment?', help: 'A quick coffee and a birthday dinner should not get the same recommendation.' },
];

export function Recommend() {
  const [meta, setMeta] = useState<RecommendMeta | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({ diet: 'none', spice: 'mild', budget: 'mid', cuisine: 'any', occasion: 'casual' });
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { add } = useCart();
  const [addedId, setAddedId] = useState<number | null>(null);

  useEffect(() => {
    api.get<RecommendMeta>('/recommend/meta').then(setMeta).catch(() => setError('We could not load the quiz just now. Please refresh in a moment.'));
  }, []);

  const current = steps[step];
  const options = meta && current ? meta.options[current.key] : [];
  const progress = result ? 100 : Math.round((step / steps.length) * 100);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api.post<RecommendResponse>('/recommend?limit=5', answers);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'The recommender is unavailable right now.');
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setResult(null);
    setStep(0);
    window.scrollTo({ top: 0 });
  };

  const handleRecommendationAdd = async (recommendation: Recommendation) => {
    add(recommendation.dish);
    setAddedId(recommendation.dish.id);
    window.setTimeout(() => setAddedId(null), 2000);
    if (result?.log_id) {
      try {
        await api.post(`/recommend/${result.log_id}/choose/${recommendation.dish.id}`);
      } catch {
        /* logging is best-effort */
      }
    }
  };

  const weights = meta?.weights ?? {};
  const weightList = useMemo(
    () => [
      { key: 'similarity', label: 'How closely it matches your answers' },
      { key: 'preference', label: 'Preference rules' },
      { key: 'popularity', label: 'Popularity' },
      { key: 'occasion', label: 'Occasion match' },
    ],
    [],
  );

  return (
    <div data-header-theme="dark" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker"><span className="kicker-line" /> AI recommender</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.2rem)] leading-tight tracking-[-0.03em]">
            {result ? 'Your top five, explained.' : 'Five questions. One perfect plate.'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-sage-400">
            {result
              ? `${result.considered} dishes were eligible after filters. Each score below is the weighted blend of four signals.`
              : 'The same method on every screen: how closely a dish matches your answers, your stated preferences, what other guests love, and the occasion.'}
          </p>
        </div>
        {result && (
          <button onClick={restart} className="btn-quiet">
            <RotateCcw size={14} /> Start over
          </button>
        )}
      </div>

      <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-logo transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {!result && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.18em] text-amber-soft">
                Step {step + 1} of {steps.length} · {current.title}
              </span>
              <div className="flex gap-1">
                {steps.map((s, index) => (
                  <button
                    key={s.key}
                    onClick={() => setStep(index)}
                    className={`h-1.5 w-5 rounded-full transition ${index <= step ? 'bg-amber-logo' : 'bg-white/15'}`}
                    aria-label={`Go to step ${index + 1}: ${s.title}`}
                  />
                ))}
              </div>
            </div>

            <h2 className="mt-6 font-display text-[clamp(1.5rem,3vw,2.2rem)] leading-snug">{current.question}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-sage-400">{current.help}</p>

            {!meta ? (
              <Spinner label="Loading options…" />
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {options.map((option) => {
                  const selected = answers[current.key] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setAnswers((current) => ({ ...current, [steps[step].key]: option.value } as QuizAnswers));
                      }}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                        selected
                          ? 'border-amber-logo bg-amber-logo/10'
                          : 'border-white/12 bg-forest-950/40 hover:border-white/30'
                      }`}
                      aria-pressed={selected}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          selected ? 'border-amber-logo bg-amber-logo text-forest-950' : 'border-white/30'
                        }`}
                      >
                        {selected && <Check size={12} />}
                      </span>
                      <span>
                        <span className="block text-sm text-sage-100">{option.label}</span>
                        <span className="mt-0.5 block text-[11px] text-sage-400">{option.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={step === 0}
                className="btn-quiet disabled:opacity-40"
              >
                <ArrowLeft size={14} /> Back
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep((value) => value + 1)} className="btn-primary">
                  Next <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={submit} disabled={busy} className="btn-primary">
                  {busy ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest-950 border-t-transparent" />
                      Ranking…
                    </>
                  ) : (
                    <>
                      <Wand2 size={15} /> Show my top 5
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="card p-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-amber-soft">Your answers so far</p>
              <ul className="mt-4 space-y-3">
                {steps.map((s) => {
                  const option = meta?.options[s.key]?.find((row) => row.value === answers[s.key]);
                  return (
                    <li key={s.key} className="flex items-start justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <span className="text-[11px] uppercase tracking-[0.1em] text-sage-400">{s.title}</span>
                      <span className="text-right text-[13px] text-sage-100">{option?.label ?? answers[s.key]}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="card p-6">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-soft">
                <Sparkles size={13} /> The model
              </p>
              <div className="mt-4 space-y-3">
                {weightList.map((row) => (
                  <div key={row.key} className="flex items-center justify-between text-[12px] text-sage-300">
                    <span>{row.label}</span>
                    <span className="text-amber-pale">{Math.round((weights[row.key] ?? 0) * 100)}%</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-sage-400">
                Dietary requirements are applied as filters before ranking, never as a score you can trade against a
                popular dish.
              </p>
            </div>
          </aside>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-sage-300">
              <span className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Filters</span>
              {result.filters_applied.length === 0 ? (
                <span className="rounded-full border border-white/15 px-3 py-1">No dietary restriction</span>
              ) : (
                result.filters_applied.map((filter) => (
                  <span key={filter} className="chip">{filter}</span>
                ))
              )}
              <span className="mx-1 h-4 w-px bg-white/10" />
              <span className="text-sage-400">{result.considered} eligible dishes ranked</span>
            </div>
            <Link to="/menu" className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-pale hover:text-white">
              Browse the full menu →
            </Link>
          </div>

          {result.results.length === 0 ? (
            <div className="card mt-5 p-10 text-center">
              <X size={26} className="mx-auto text-amber-soft" />
              <h3 className="mt-3 font-display text-2xl">Nothing fits those filters</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-sage-400">
                The kitchen has no dish matching that combination today. Try relaxing the dietary filter or budget.
              </p>
              <button onClick={restart} className="btn-ghost mt-5">Adjust my answers</button>
            </div>
          ) : (
            <ol className="mt-5 space-y-4">
              {result.results.map((recommendation, index) => (
                <li key={recommendation.dish.id} className="card overflow-hidden">
                  <div className="grid gap-0 sm:grid-cols-[190px_1fr]">
                    <Link to={`/menu/${recommendation.dish.id}`} className="relative block">
                      <DishArt dish={recommendation.dish} index={index} className="h-40 sm:h-full" />
                      <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-forest-950/80 font-display text-sm text-amber-pale">
                        {index + 1}
                      </span>
                    </Link>
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link to={`/menu/${recommendation.dish.id}`} className="font-display text-2xl leading-tight hover:text-white">
                            {recommendation.dish.name}
                          </Link>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-amber-soft">
                            {recommendation.dish.category_name} · {formatRwf(recommendation.dish.price_rwf)} · {recommendation.dish.prep_minutes} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-3xl text-amber-pale">{recommendation.score.toFixed(1)}</p>
                          <p className="text-[9px] uppercase tracking-[0.16em] text-sage-400">match score</p>
                        </div>
                      </div>

                      <p className="mt-3 text-[13px] leading-relaxed text-sage-300">{recommendation.reason}</p>

                      {recommendation.badges.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {recommendation.badges.map((badge) => (
                            <span key={badge} className="chip">{badge}</span>
                          ))}
                          {recommendation.dish.rating_count > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1">
                              <Stars value={recommendation.dish.rating_average} size={10} />
                              <span className="text-[10px] text-sage-400">{recommendation.dish.rating_count}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-5 grid gap-3 sm:grid-cols-4">
                        <ScoreBar label="Similarity" value={recommendation.score_breakdown.similarity} weight={0.4} />
                        <ScoreBar label="Preference" value={recommendation.score_breakdown.preference} weight={0.25} />
                        <ScoreBar label="Popularity" value={recommendation.score_breakdown.popularity} weight={0.2} />
                        <ScoreBar label="Occasion" value={recommendation.score_breakdown.occasion} weight={0.15} />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Link to={`/menu/${recommendation.dish.id}`} className="btn-quiet !py-2">
                          View dish
                        </Link>
                        <button onClick={() => handleRecommendationAdd(recommendation)} className="btn-primary !py-2">
                          {addedId === recommendation.dish.id ? <><Check size={14} /> Added</> : <>Add to order</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-8 rounded-2xl border border-amber-soft/25 bg-amber-logo/10 p-6">
            <p className="font-display text-xl">Was this useful?</p>
            <p className="mt-1 text-sm text-sage-400">
              Your quiz answers are logged (anonymously for guests) so the project can report how often the top
              recommendation is actually ordered — the evaluation metric in the write-up.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
