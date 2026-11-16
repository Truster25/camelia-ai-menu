import { Link } from 'react-router-dom';
import type { Dish } from '../lib/types';
import { formatRwf } from '../lib/api';

/**
 * Dish card for the landing row.
 *
 * Modelled on the reference the client sent: a square-ish picture card, sitting
 * on the page, with the name underneath in small type. Nothing inside the card
 * except the photograph, because the reference keeps the inside completely
 * empty: the label belongs below, on the page, not on top of the food.
 *
 * The lift is a real shadow rather than a border. On a dark page a border
 * reads as a box drawn round the picture; a shadow reads as the card being
 * above the page, which is the effect in the reference.
 */
export function DishReveal({ dish, category }: { dish: Dish; category?: string }) {
  return (
    <article className="group">
      <Link to={`/menu/${dish.id}`} className="block">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-forest-800 shadow-[0_18px_44px_-16px_rgba(0,0,0,0.75)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_60px_-18px_rgba(0,0,0,0.85)]"
        >
          {dish.image_url ? (
            <img
              src={dish.image_url}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-4xl text-amber-soft" aria-hidden="true">
              ✦
            </span>
          )}

          {/* A soft amber wash from the bottom, only on hover, so the card
              answers the pointer without changing shape. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </div>

        <p className="mt-4 text-[13.5px] font-semibold leading-snug text-sage-100">{dish.name}</p>
        {category && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-sage-400">{category}</p>
        )}
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[12px] text-amber-pale">{formatRwf(dish.price_rwf)}</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-sage-400">
          {dish.is_vegan ? 'Vegan' : dish.is_vegetarian ? 'Vegetarian' : ''}
        </span>
      </div>
    </article>
  );
}
