import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LogOut, Menu as MenuIcon, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Logo, LogoMark } from './Logo';

type NavItem = { to: string; label: string; end?: boolean };

const navItems: NavItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/recommend', label: 'Find my dish' },
  { to: '/how-it-works', label: 'About' },
  { to: '/orders', label: 'My orders' },
];

type HeaderProps = {
  /** Routes that float the header over a full-bleed hero image. */
  overlay?: boolean;
};

export function Header({ overlay = false }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // The header must never become invisible.
  //
  // Default: light text (works on every dark page in this app).
  // A section needs to be *marked* as light before the header switches to dark
  // ink, and if nothing is under the header at all we also fall back to light.
  // An untagged page therefore gets the safe answer, which is what went wrong
  // on /login: it had no marker, the header chose dark ink, and dark-on-dark
  // made the logo and links disappear.
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // True while the header sits on top of the landing page's full-bleed hero,
  // where a scrim would be visible and is not wanted.
  const [overHero, setOverHero] = useState(true);

  useEffect(() => {
    const hero = document.querySelector('[data-header-hero]');
    const themed = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme]'));

    const onScroll = () => {
      if (hero) {
        const rect = hero.getBoundingClientRect();
        // Still over the full-bleed hero photograph -> light text, every time.
        if (rect.bottom > 86) {
          setOverHero(true);
          setTheme('light');
          return;
        }
      }
      setOverHero(false);

      // Only an explicit light band flips the header to dark ink.
      let current: 'light' | 'dark' = 'light';
      for (const el of themed) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 86 && rect.bottom > 86) {
          // Keep scanning: a card nested inside an outer band is later in
          // document order, and the card is what is actually behind the
          // header. Last match = innermost band.
          current = el.dataset.headerTheme === 'light' ? 'dark' : 'light';
        }
      }
      setTheme(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      data-theme={theme}
      className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 bg-transparent transition-colors duration-300 ${
        theme === 'dark' ? 'text-ink' : 'text-sage-100'
      }`}
    >
      {/* Reading scrim. Never over the hero photograph; everywhere else (on
          every page, and on the landing page once the hero has scrolled away)
          it is a soft fade that dies out before the content starts, so the
          header stays transparent in spirit while never disappearing against
          the page. Opacity is transitioned so crossing the hero edge does not
          pop. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[128px] transition-opacity duration-300 ${
          !overlay || !overHero ? 'opacity-100' : 'opacity-0'
        } ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-cream via-cream/80 to-transparent'
            : 'bg-gradient-to-b from-black/70 via-black/35 to-transparent'
        }`}
        aria-hidden="true"
      />
      <div className="mx-auto flex h-[86px] max-w-[1600px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <Logo variant={theme === 'dark' ? 'orange' : 'white'} className="h-12 shrink-0 sm:h-14" />

        {/* centred navigation pill */}
        <nav className="mx-auto hidden items-center gap-1 xl:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  isActive
                    ? theme === 'dark'
                      ? 'font-bold text-ink'
                      : 'text-amber-logo'
                    : 'opacity-70 hover:opacity-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-5 -bottom-[7px] h-px bg-amber-logo/80" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  isActive
                    ? theme === 'dark'
                      ? 'font-bold text-ink'
                      : 'text-amber-logo'
                    : 'opacity-70 hover:opacity-100'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          {/* icon only — the bag is the link, the badge is the count */}
          <Link
            to="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-current/20 transition hover:border-current/50"
            aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
            title="Cart"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-logo px-1 text-[9px] font-bold text-forest-950">{count}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className={`hidden items-center gap-3 rounded-full border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:bg-amber-logo hover:text-forest-950 md:inline-flex ${
              theme === 'dark' ? 'border-[#a9742a]/60 text-[#8a5f1f]' : 'border-amber-logo/70 text-amber-pale'
            }`}
          >
            Book a table
            <ArrowUpRight size={13} />
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <span className="max-w-[110px] truncate text-[11px] opacity-70">{user.name.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="grid h-10 w-10 place-items-center rounded-full border border-current/20 transition hover:border-current/50"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-full border border-current/20 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-current/50 lg:inline-flex"
            >
              <UserIcon size={13} /> Sign in
            </Link>
          )}

          <button
            className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-current/10 xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-forest-950/95 px-5 py-5 backdrop-blur-md xl:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 uppercase tracking-[0.14em] ${isActive ? 'bg-white/10 text-amber-logo' : 'text-sage-300'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" className="rounded-lg px-3 py-2.5 uppercase tracking-[0.14em] text-sage-300">
                Admin dashboard
              </NavLink>
            )}
            <Link to="/cart" className="rounded-lg px-3 py-2.5 uppercase tracking-[0.14em] text-sage-300">
              Cart {count > 0 && `(${count})`}
            </Link>
            {user ? (
              <button onClick={handleLogout} className="mt-2 rounded-lg border border-white/15 px-3 py-2.5 text-left text-sage-200">
                Sign out ({user.name.split(' ')[0]})
              </button>
            ) : (
              <Link to="/login" className="mt-2 rounded-full bg-amber-logo px-3 py-2.5 text-center uppercase tracking-[0.14em] text-forest-950">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-forest-950">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 sm:px-8 lg:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo variant="white" className="h-14" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-sage-400">
            Café &amp; restaurant in Kigali. Good food, good moments — and a menu that learns what you like.
          </p>
        </div>
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-soft">Explore</p>
          <ul className="space-y-2 text-sm text-sage-300">
            <li><Link className="hover:text-white" to="/menu">Our menu</Link></li>
            <li><Link className="hover:text-white" to="/recommend">AI recommendation</Link></li>
            <li><Link className="hover:text-white" to="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-white" to="/orders">My orders</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-soft">Visit</p>
          <ul className="space-y-2 text-sm text-sage-300">
            <li>KG 7 Ave, Kigali, Rwanda</li>
            <li>Mon – Sun · 07:00 – 22:00</li>
            <li>+250 788 000 000</li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <LogoMark className="h-8 w-8 text-xs" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-sage-400">
              Final-year project · MKU
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-5 py-5 text-center text-[10px] uppercase tracking-[0.18em] text-sage-400/70">
        © {new Date().getFullYear()} Camelia Café &amp; Restaurant · AI-based menu recommendation system
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  // The landing page has a full-bleed hero, so its header floats on top of it.
  const overlay = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <Header overlay={overlay} />
      <main className={overlay ? 'flex-1' : 'flex-1 pt-0'}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
