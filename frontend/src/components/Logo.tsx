import { Link } from 'react-router-dom';

type LogoProps = {
  variant?: 'orange' | 'white';
  /** Height utility, e.g. "h-11". Width follows the artwork. */
  className?: string;
  to?: string | null;
};

/** Camelia coffee-cup wordmark in white for dark backgrounds or orange for light backgrounds. */
export function Logo({ variant = 'orange', className = 'h-11', to = '/' }: LogoProps) {
  const src = `/images/camelia-logo-${variant}.png`;
  const image = (
    <img
      src={src}
      alt="Camelia Café & Restaurant, Kigali"
      className={`logo-img w-auto ${className}`}
      width={560}
      height={variant === 'white' ? 267 : 302}
    />
  );
  if (to === null) return image;
  return (
    <Link to={to} className="inline-flex shrink-0 items-center" aria-label="Camelia home">
      {image}
    </Link>
  );
}

/** Small monogram for tight spaces (footer strip, loading states). */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span
      className={`${className} inline-grid place-items-center rounded-full border border-amber-logo/40 font-display text-amber-logo`}
      aria-hidden="true"
    >
      C
    </span>
  );
}
