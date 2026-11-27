import { Link } from 'react-router-dom';
import { ArrowUpRight, UtensilsCrossed } from 'lucide-react';
import type { Dish } from '../lib/types';
import { assetUrl, formatRwf } from '../lib/api';
import { tiltEvents } from '../lib/tilt';
import { useLang } from '../context/LanguageContext';

type Props = {
  dish: Dish;
  category?: string;
};

export function DishTile({ dish, category }: Props) {
  const { t } = useLang();

  return (
    <article className="home-dish tilt" {...tiltEvents}>
      <Link to={`/menu/${dish.id}`} className="home-dish-link">
        <div className="home-dish-photo" aria-hidden="true">
          {assetUrl(dish.image_url) ? (
            <img src={assetUrl(dish.image_url)!} alt="" loading="lazy" decoding="async" />
          ) : (
            <UtensilsCrossed size={34} strokeWidth={1.25} />
          )}
        </div>
        {category && <p className="home-dish-category">{category}</p>}
        <h3>{dish.name}</h3>
        <p className="home-dish-summary">{dish.description}</p>
        <span className="home-dish-more">
          {t('dishes.view')} <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

/** Price line kept for the /menu grid, which shows money on the card. */
export function DishTilePrice({ dish }: { dish: Dish }) {
  return <span className="text-[11px] text-amber-pale">{formatRwf(dish.price_rwf)}</span>;
}
