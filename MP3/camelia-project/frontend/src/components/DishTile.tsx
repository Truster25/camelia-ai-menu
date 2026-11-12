import { Link } from 'react-router-dom';
import type { Dish } from '../lib/types';
import { formatRwf } from '../lib/api';

type Props = {
  dish: Dish;
  /** Category label shown above the name, e.g. "Coffee & tea". */
  category?: string;
};

/**
 * Compact card for the landing-page dish row.
 *
 * Modelled on the reference: the plate is *cut out* of its own background and
 * floats on a warm brown gradient tile, so the tile reads as a studio shot
 * rather than a cropped photograph. Below it: a short uppercase name, a
 * two-line description and a wide rounded "View Now" button.
 *
 * Deliberately no rating stars, price chip, diet pills or add button — those
 * belong on /menu, where people are comparing in detail.
 */
export function DishTile({ dish, category }: Props) {
  return (
    <article className="group flex flex-col">
      {/* product tile — warm gradient, the plate sits inside it */}
      <Link
        to={`/menu/${dish.id}`}
        className="relative block aspect-[4/3.4] overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_45%,#9a6330_0%,#7c4c22_42%,#4a2c12_78%,#3a2410_100%)]"
      >
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            style={{
              // A soft inner vignette melts the photograph's own edges into the
              // warm tile, so it reads as one studio plate rather than a photo
              // pasted into a rectangle. Kept subtle so the food stays bright.
              maskImage:
                'radial-gradient(ellipse 88% 88% at 50% 50%, #000 62%, rgba(0,0,0,0.75) 84%, rgba(0,0,0,0.35) 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 88% 88% at 50% 50%, #000 62%, rgba(0,0,0,0.75) 84%, rgba(0,0,0,0.35) 100%)',
            }}
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl text-[#e9c69a]" aria-hidden="true">
            ✳
          </span>
        )}
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        {category && (
          <p className="text-[8.5px] uppercase tracking-[0.18em] text-[#b98a4f]">{category}</p>
        )}
        <h3 className="mt-1.5 text-[13px] font-semibold uppercase leading-snug tracking-[0.02em] text-cream">
          <Link to={`/menu/${dish.id}`} className="hover:text-amber-pale">
            {dish.name}
          </Link>
        </h3>
        <p className="mt-2.5 line-clamp-2 text-[11.5px] leading-[1.7] text-sage-400">{dish.description}</p>

        <div className="mt-auto pt-4">
          <Link
            to={`/menu/${dish.id}`}
            className="flex w-full items-center justify-center rounded-lg bg-[#7a4a22] px-3 py-2.5 text-[11px] font-medium text-[#f0e5d6] transition hover:bg-[#8a5a2b]"
          >
            View Now
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Price line kept for the /menu grid, which shows money on the card. */
export function DishTilePrice({ dish }: { dish: Dish }) {
  return <span className="text-[11px] text-amber-pale">{formatRwf(dish.price_rwf)}</span>;
}
