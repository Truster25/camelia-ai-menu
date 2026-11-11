import { Link } from 'react-router-dom';
import { Flame, Leaf, Plus, Timer } from 'lucide-react';
import { formatRwf } from '../lib/api';
import { dietaryLabels, spiceLabels, toneClasses, toneGlow } from '../lib/occasions';
import type { Dish } from '../lib/types';
import { Stars } from './ui';

type DishCardProps = {
  dish: Dish;
  onAdd?: (dish: Dish) => void;
  compact?: boolean;
  index?: number;
};

/**
 * Dish "art" is generated from the dish tone because the project has no
 * licensed photography for every plate; it keeps the VELO editorial look.
 */
export function DishArt({
  dish,
  index = 0,
  className = 'h-52',
  showLabels = true,
}: {
  dish: Dish;
  index?: number;
  className?: string;
  showLabels?: boolean;
}) {
  const tone = toneClasses[dish.art_tone] ?? toneClasses.green;
  const glow = toneGlow[dish.art_tone] ?? toneGlow.green;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${tone}`} />
      <div
        className="absolute -right-16 -top-20 h-64 w-64 rounded-full blur-2xl"
        style={{ background: glow }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <div className="grid h-32 w-32 place-items-center rounded-full border border-white/25">
          <div className="grid h-24 w-24 place-items-center rounded-full border border-white/15">
            {dish.is_vegan || dish.is_vegetarian ? (
              <Leaf size={42} strokeWidth={0.9} className="text-cream/80" />
            ) : (
              <Flame size={40} strokeWidth={0.9} className="text-cream/80" />
            )}
          </div>
        </div>
      </div>
      {showLabels && (
        <div className="absolute left-4 top-4 text-[9px] uppercase tracking-[0.16em] text-cream/60">
          0{index + 1} / the menu
        </div>
      )}
      {showLabels && dish.is_signature && (
        <span className="absolute right-4 top-4 rounded-full bg-forest-950/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-pale">
          Signature
        </span>
      )}
    </div>
  );
}

export function DishCard({ dish, onAdd, compact = false, index = 0 }: DishCardProps) {
  const labels = dietaryLabels(dish);
  return (
    <article className="group card overflow-hidden transition hover:border-amber-soft/40">
      <Link to={`/menu/${dish.id}`} className="block">
        <DishArt dish={dish} index={index} className={compact ? 'h-36' : 'h-52'} />
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.13em] text-amber-soft">
          <span className="truncate">{dish.category_name}</span>
          <span className="shrink-0">{formatRwf(dish.price_rwf)}</span>
        </div>

        <Link to={`/menu/${dish.id}`}>
          <h3 className="mt-2 font-display text-xl leading-snug text-sage-100 transition group-hover:text-white">
            {dish.name}
          </h3>
        </Link>

        {!compact && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-sage-400">{dish.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] uppercase tracking-[0.1em] text-sage-400">
          <span className="inline-flex items-center gap-1">
            <Timer size={11} /> {dish.prep_minutes}m
          </span>
          <span>{spiceLabels[dish.spice_level] ?? 'Mild'}</span>
          {dish.rating_count > 0 ? (
            <Stars value={dish.rating_average} count={dish.rating_count} size={11} />
          ) : (
            <span className="text-sage-400/70">New</span>
          )}
        </div>

        {labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {labels.slice(0, compact ? 2 : 3).map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-sage-300"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Link
            to={`/menu/${dish.id}`}
            className="flex-1 rounded-full border border-white/15 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-sage-200 transition hover:border-amber-soft hover:text-amber-pale"
          >
            Details
          </Link>
          {onAdd && (
            <button
              onClick={() => onAdd(dish)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-logo text-forest-950 transition hover:bg-amber-pale"
              aria-label={`Add ${dish.name} to cart`}
              title="Add to cart"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
