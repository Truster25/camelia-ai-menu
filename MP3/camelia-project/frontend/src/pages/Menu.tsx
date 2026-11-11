import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, Sparkles, X } from 'lucide-react';
import { api, formatRwf } from '../lib/api';
import type { Category, Dish } from '../lib/types';
import { DishCard } from '../components/DishCard';
import { EmptyState, SectionHeading, Spinner } from '../components/ui';
import { useCart } from '../context/CartContext';

type DietFilter = '' | 'vegetarian' | 'vegan' | 'halal' | 'gluten-free';

const dietOptions: { value: DietFilter; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten-free', label: 'Gluten free' },
];

const maxPriceOptions = [
  { value: 0, label: 'Any price' },
  { value: 4000, label: 'Under 4,000' },
  { value: 7000, label: 'Under 7,000' },
  { value: 10000, label: 'Under 10,000' },
];

export function Menu() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [category, setCategory] = useState<string>('');
  const [diet, setDiet] = useState<DietFilter>('');
  const [maxPrice, setMaxPrice] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'menu' | 'price' | 'rating' | 'popularity'>('menu');
  const { add, count } = useCart();
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get<Category[]>('/categories'), api.get<Dish[]>('/dishes?sort=menu')])
      .then(([categoryRows, dishRows]) => {
        setCategories(categoryRows);
        setDishes(dishRows);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const handleAdd = useCallback(
    (dish: Dish) => {
      add(dish);
      setAdded(dish.name);
      window.setTimeout(() => setAdded(null), 2200);
    },
    [add],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let rows = dishes.filter((dish) => {
      if (category && dish.category_slug !== category) return false;
      if (diet === 'vegetarian' && !dish.is_vegetarian) return false;
      if (diet === 'vegan' && !dish.is_vegan) return false;
      if (diet === 'halal' && !dish.is_halal) return false;
      if (diet === 'gluten-free' && !dish.is_gluten_free) return false;
      if (maxPrice && dish.price_rwf > maxPrice) return false;
      if (needle) {
        const haystack = `${dish.name} ${dish.description} ${dish.ingredients} ${dish.category_name}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
    if (sort === 'price') rows = [...rows].sort((a, b) => a.price_rwf - b.price_rwf);
    if (sort === 'rating') rows = [...rows].sort((a, b) => b.rating_average - a.rating_average || b.rating_count - a.rating_count);
    if (sort === 'popularity') rows = [...rows].sort((a, b) => b.popularity_seed - a.popularity_seed);
    return rows;
  }, [dishes, category, diet, maxPrice, search, sort]);

  const activeFilters = [category, diet, maxPrice ? String(maxPrice) : '', search].filter(Boolean).length;
  const resetFilters = () => {
    setCategory('');
    setDiet('');
    setMaxPrice(0);
    setSearch('');
  };

  return (
    <div data-header-theme="dark" className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <SectionHeading
        kicker="Our menu"
        title={(
          <>
            A taste of <em className="not-italic text-amber-soft">Camellia.</em>
          </>
        )}
        description="Everything the kitchen is serving today — filtered by category, diet, price or a word you remember. Prices in Rwandan francs."
        action={
          <Link to="/recommend" className="btn-ghost">
            <Sparkles size={14} /> Not sure? Ask the AI
          </Link>
        }
      />

      {/* filter bar */}
      <div className="card mt-9 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes, ingredients…"
              className="field pl-10"
              aria-label="Search the menu"
            />
          </label>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="field w-auto" aria-label="Sort dishes">
            <option value="menu">Menu order</option>
            <option value="price">Price: low to high</option>
            <option value="rating">Best rated</option>
            <option value="popularity">Most popular</option>
          </select>
          {activeFilters > 0 && (
            <button onClick={resetFilters} className="btn-quiet !px-4 !py-2.5 !text-[10px]">
              <X size={12} /> Clear ({activeFilters})
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
          <Filter size={13} className="mr-1 text-sage-400" />
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
              category === '' ? 'bg-amber-logo text-forest-950' : 'border border-white/10 text-sage-300 hover:border-white/30'
            }`}
          >
            All sections
          </button>
          {categories.map((row) => (
            <button
              key={row.id}
              onClick={() => setCategory(row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))}
              className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                category === row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  ? 'bg-amber-logo text-forest-950'
                  : 'border border-white/10 text-sage-300 hover:border-white/30'
              }`}
            >
              {row.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.16em] text-sage-400">Diet</span>
          {dietOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDiet(option.value)}
              className={`rounded-full px-3 py-1 text-[10px] transition ${
                diet === option.value ? 'bg-white/15 text-white' : 'text-sage-400 hover:text-sage-200'
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="mx-2 h-4 w-px bg-white/10" />
          {maxPriceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setMaxPrice(option.value)}
              className={`rounded-full px-3 py-1 text-[10px] transition ${
                maxPrice === option.value ? 'bg-white/15 text-white' : 'text-sage-400 hover:text-sage-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {status === 'loading' && <Spinner label="Loading the menu…" />}
      {status === 'error' && (
        <div className="mt-8">
          <EmptyState
            title="The menu could not load"
            body="The API is not responding. Make sure the FastAPI backend is running on port 9000, then refresh."
          />
        </div>
      )}

      {status === 'ready' && (
        <>
          <p className="mt-8 text-[11px] uppercase tracking-[0.16em] text-sage-400">
            {filtered.length} dish{filtered.length === 1 ? '' : 'es'}
            {category && ` in ${category.replace(/-/g, ' ')}`}
          </p>
          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing matches that combination"
                body="Try widening the budget, clearing the diet filter, or letting the AI quiz suggest something close to what you want."
                action={<button onClick={resetFilters} className="btn-ghost">Reset filters</button>}
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((dish, index) => (
                <DishCard key={dish.id} dish={dish} index={index} onAdd={handleAdd} compact />
              ))}
            </div>
          )}
        </>
      )}

      {added && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-rise">
          <div className="flex items-center gap-4 rounded-full border border-amber-soft/40 bg-forest-850 px-5 py-3 text-sm shadow-2xl">
            <span className="text-sage-100">{added} added</span>
            <Link to="/cart" className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-pale">
              View cart ({count})
            </Link>
          </div>
        </div>
      )}

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-soft/25 bg-amber-logo/10 px-6 py-6">
        <div>
          <p className="font-display text-xl text-sage-100">Still deciding?</p>
          <p className="mt-1 text-sm text-sage-400">
            The quiz narrows 26 dishes to your top 5 · from {formatRwf(2500)}.
          </p>
        </div>
        <Link to="/recommend" className="btn-primary">
          <Sparkles size={14} /> Take the quiz
        </Link>
      </div>
    </div>
  );
}
