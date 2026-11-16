import { Link } from 'react-router-dom';

type LogoProps = {
  variant?: 'orange' | 'white';
  /** Height utility, e.g. "h-11". Width follows the artwork's 1.85:1 ratio. */
  className?: string;
  to?: string | null;
};

/**
 * Official Camelia logo.
 *
 * `logo-orange.png` / `logo-white.png` are the client-supplied artwork with the
 * transparent margins trimmed and downscaled (86 KB instead of 600 KB). The
 * original untrimmed files are kept as `camellia-orange.png` / `camellia-white.png`.
 * On dark backgrounds the white artwork is used; the orange mark sits on cream/amber panels.
 */
export function Logo({ variant = 'orange', className = 'h-11', to = '/' }: LogoProps) {
  const src = variant === 'white' ? '/images/logo-white.png' : '/images/logo-orange.png';
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
