import { Link } from 'react-router-dom';
import type { Dish } from '../lib/types';
import { formatRwf } from '../lib/api';

type Props = {
  dish: Dish;
  /** Category label shown under the photo, e.g. "Coffee & tea". */
  category?: string;
};

/**
 * Compact card for the landing-page dish row.
 *
 * Modelled on the reference: a warm gradient photo tile on top (the food has no
 * background of its own, it sits in the gradient), then the dish name in
 * uppercase, a short description, and a wide low "View Now" button.
 *
 * Deliberately no rating stars, price chip, diet pills or add button — those
 * belong on /menu, where people are comparing in detail.
 */
export function DishTile({ dish, category }: Props) {
  return (
    <article className="group flex flex-col">
      {/* photo tile */}
      <Link
        to={`/menu/${dish.id}`}
        className="relative block aspect-[4/3.4] overflow-hidden rounded-xl bg-gradient-to-b from-[#7a4a22] via-[#5a3618] to-[#3a2410]"
      >
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl text-[#e9c69a]" aria-hidden="true">
            ✳
          </span>
        )}
        {/* keeps the warm tone consistent across photos shot on different tables */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2a1a0c]/45 via-transparent to-transparent" aria-hidden="true" />
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        {category && (
          <p className="text-[8.5px] uppercase tracking-[0.18em] text-[#b98a4f]">{category}</p>
        )}
        <h3 className="mt-1.5 text-[12.5px] font-bold uppercase leading-snug tracking-[0.04em] text-cream">
          <Link to={`/menu/${dish.id}`} className="hover:text-amber-pale">
            {dish.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[11.5px] leading-[1.65] text-sage-400">{dish.description}</p>

        <div className="mt-auto pt-4">
          <Link
            to={`/menu/${dish.id}`}
            className="flex w-full items-center justify-center rounded-md border border-[#6b4520]/70 bg-[#3a2412]/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e3c194] transition hover:border-[#8a5a2b] hover:bg-[#8a5a2b] hover:text-cream"
          >
            View Now
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Price variant used when a compact card needs to show the price too. */
export function DishTilePrice({ dish }: { dish: Dish }) {
  return <span className="text-[10px] text-amber-pale">{formatRwf(dish.price_rwf)}</span>;
}
