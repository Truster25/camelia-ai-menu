import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Timer, Flame, Info } from 'lucide-react';
import { api, formatDate, formatRwf, ApiError } from '../lib/api';
import type { Dish, Rating } from '../lib/types';
import { DishArt } from '../components/DishCard';
import { ErrorNote, Spinner, Stars } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { dietaryLabels, spiceLabels } from '../lib/occasions';

export function DishDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user } = useAuth();

  const [dish, setDish] = useState<Dish | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [related, setRelated] = useState<Dish[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [quantity, setQuantity] = useState(1);

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [saved, setSaved] = useState(false);
  const [favourited, setFavourited] = useState(false);

  useEffect(() => {
    if (!id) return;
    setStatus('loading');
    window.scrollTo({ top: 0 });
    Promise.all([
      api.get<Dish>(`/dishes/${id}`),
      api.get<Rating[]>(`/dishes/${id}/ratings`),
      api.get<Dish[]>('/dishes'),
    ])
      .then(([dishData, ratingData, all]) => {
        setDish(dishData);
        setRatings(ratingData);
        setRelated(all.filter((row) => row.id !== dishData.id && row.category_id === dishData.category_id).slice(0, 3));
        setStatus('ready');
      })
      .catch((error) => setStatus(error instanceof ApiError && error.status === 404 ? 'missing' : 'error'));
  }, [id]);

  useEffect(() => {
    if (!user) {
      setFavourited(false);
      return;
    }
    api
      .get<Dish[]>('/favourites')
      .then((rows) => setFavourited(rows.some((row) => String(row.id) === id)))
      .catch(() => setFavourited(false));
  }, [user, id]);

  const submitRating = async () => {
    if (!id) return;
    setRatingError('');
    try {
      const saved = await api.post<Rating>(`/dishes/${id}/ratings`, { stars, comment });
      setRatings((current) => [saved, ...current.filter((row) => row.user_id !== saved.user_id)]);
      setComment('');
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
      const refreshed = await api.get<Dish>(`/dishes/${id}`);
      setDish(refreshed);
    } catch (error) {
      setRatingError(error instanceof ApiError ? error.message : 'Could not save your rating.');
    }
  };

  const toggleFavourite = async () => {
    if (!id) return;
    if (!user) {
      navigate('/login', { state: { from: `/menu/${id}` } });
      return;
    }
    try {
      const rows = await api.post<Dish[]>(`/favourites/${id}`);
      setFavourited(rows.some((row) => String(row.id) === id));
    } catch {
      /* silent — favourites are a nicety */
    }
  };

  if (status === 'loading') return <Spinner label="Plating your dish…" />;
  if (status === 'missing')
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-3xl">That dish is not on the menu</h1>
        <p className="mt-3 text-sm text-sage-400">It may have been retired by the kitchen.</p>
        <Link to="/menu" className="btn-ghost mt-6">Back to the menu</Link>
      </div>
    );
  if (status === 'error' || !dish)
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <ErrorNote message="We could not load this dish just now. Please refresh in a moment." />
      </div>
    );

  const labels = dietaryLabels(dish);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-sage-400 hover:text-sage-100">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="card overflow-hidden">
          <DishArt dish={dish} className="h-72 sm:h-96" />
          <div className="p-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-soft">
              {dish.category_name} · {dish.cuisine} cuisine
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-tight">{dish.name}</h1>
            <p className="mt-4 text-sm leading-relaxed text-sage-300">{dish.description}</p>

            <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Price</dt>
                <dd className="mt-1 text-amber-pale">{formatRwf(dish.price_rwf)}</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Prep time</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5"><Timer size={13} /> {dish.prep_minutes} min</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Spice</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5"><Flame size={13} /> {spiceLabels[dish.spice_level]}</dd>
              </div>
              <div>
                <dt className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Energy</dt>
                <dd className="mt-1">{dish.calories} kcal</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Ingredients</p>
                <p className="mt-1.5 break-words text-[13px] leading-relaxed text-sage-300">
                  {dish.ingredients.split(',').join(', ')}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Allergens</p>
                <p className="mt-1.5 break-words text-[13px] leading-relaxed text-sage-300">
                  {dish.allergens ? (
                    dish.allergens.split(',').join(', ')
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sage-400">
                      <Info size={12} /> None declared — ask staff about cross-contact
                    </span>
                  )}
                </p>
              </div>
            </div>

            {labels.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span key={label} className="chip">{label}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl text-amber-pale">{formatRwf(dish.price_rwf)}</p>
              <Stars value={dish.rating_average} count={dish.rating_count} />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-white/15">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center text-sage-300 hover:text-white" aria-label="Decrease quantity">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity((value) => Math.min(20, value + 1))} className="grid h-10 w-10 place-items-center text-sage-300 hover:text-white" aria-label="Increase quantity">
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => {
                  add(dish, quantity);
                  navigate('/cart');
                }}
                className="btn-primary flex-1"
                disabled={!dish.is_available}
              >
                <ShoppingBag size={15} /> {dish.is_available ? 'Add to order' : 'Unavailable today'}
              </button>
            </div>

            <button
              onClick={toggleFavourite}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                favourited ? 'border-amber-logo text-amber-pale' : 'border-white/15 text-sage-300 hover:border-white/35'
              }`}
            >
              <Heart size={13} className={favourited ? 'fill-amber-logo text-amber-logo' : ''} />
              {favourited ? 'Saved to favourites' : 'Save to favourites'}
            </button>

            <p className="mt-4 text-[11px] leading-relaxed text-sage-400">
              Pre-order with a table number and the kitchen starts as soon as you arrive. Pay at the table.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="font-display text-xl">Rate this dish</h2>
            {user ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <Stars value={stars} size={22} onChange={setStars} />
                  <span className="text-xs text-sage-400">{stars}/5</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What did you think? (optional)"
                  className="field mt-3 resize-none"
                />
                {ratingError && <div className="mt-3"><ErrorNote message={ratingError} /></div>}
                <button onClick={submitRating} className="btn-ghost mt-3 w-full">
                  {saved ? 'Saved — thank you!' : 'Submit rating'}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-sage-400">
                <Link to="/login" className="text-amber-pale underline">Sign in</Link> to rate this dish and keep your
                favourites.
              </p>
            )}

            {ratings.length > 0 && (
              <ul className="mt-6 space-y-4 border-t border-white/10 pt-5">
                {ratings.slice(0, 4).map((rating) => (
                  <li key={rating.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] text-sage-200">{rating.user_name}</span>
                      <Stars value={rating.stars} size={11} />
                    </div>
                    {rating.comment && <p className="mt-1 text-[12.5px] leading-relaxed text-sage-400">“{rating.comment}”</p>}
                    <p className="mt-1 text-[10px] text-sage-400/60">{formatDate(rating.updated_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl">More from {dish.category_name}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((row) => (
              <Link key={row.id} to={`/menu/${row.id}`} className="card flex items-center gap-4 p-4 transition hover:border-amber-soft/40">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <DishArt dish={row} className="h-16" showLabels={false} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg">{row.name}</p>
                  <p className="text-xs text-amber-pale">{formatRwf(row.price_rwf)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
