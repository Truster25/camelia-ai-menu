import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, LogOut, Menu as MenuIcon, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Logo } from './Logo';

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
              {item.label}
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
      <div className="mx-auto max-w-[1600px] px-5 pt-16 sm:px-8 lg:px-10">
        {/* The cream card mirrors the reference footer: it floats over the
            page and closes with the wordmark bleeding off the bottom edge. */}
        <div data-header-theme="light" className="relative overflow-hidden rounded-t-[22px] bg-cream text-ink">
          <div className="grid gap-10 px-7 pb-10 pt-9 sm:px-10 md:grid-cols-[1.15fr_0.8fr_0.8fr_1.2fr] md:gap-8">
            <div>
              <Logo variant="orange" className="h-11" />
              <p className="mt-4 max-w-[26ch] text-[13px] leading-relaxed text-[#6b6f63]">
                Beat the heat with our signature cold coffees, brewed from single-origin Rwandan beans.
              </p>
              <div className="mt-6 flex items-center gap-2.5">
                {[
                  { label: 'Instagram', d: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 5.3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 7.4a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8Zm4.7-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z' },
                  { label: 'Facebook', d: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.6V13h2.3v8h3.6Z' },
                  { label: 'X', d: 'M17.5 3h2.9l-6.3 7.2L21.5 21h-5.8l-4.5-5.9L5.9 21H3l6.8-7.8L2.9 3h5.9l4.1 5.4L17.5 3Zm-1 16.2h1.6L7.6 4.7H5.9l10.6 14.5Z' },
                  { label: 'WhatsApp', d: 'M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.3-.4v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z' },
                ].map((icon) => (
                  <a
                    key={icon.label}
                    href="#"
                    aria-label={icon.label}
                    className="grid h-8 w-8 place-items-center rounded-full border border-ink/15 text-ink/70 transition hover:border-[#8a5a2b] hover:bg-[#8a5a2b] hover:text-cream"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true"><path d={icon.d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="font-display text-[13.5px] font-semibold text-ink">Explore</p>
              <ul className="mt-4 space-y-2.5 text-[12.5px] text-[#6b6f63]">
                <li><Link className="transition hover:text-[#8a5a2b]" to="/menu">Our menu</Link></li>
                <li><Link className="transition hover:text-[#8a5a2b]" to="/recommend">AI recommendation</Link></li>
                <li><Link className="transition hover:text-[#8a5a2b]" to="/how-it-works">How it works</Link></li>
                <li><Link className="transition hover:text-[#8a5a2b]" to="/orders">My orders</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-display text-[13.5px] font-semibold text-ink">About us</p>
              <ul className="mt-4 space-y-2.5 text-[12.5px] text-[#6b6f63]">
                <li>Our story</li>
                <li>Rooms &amp; events</li>
                <li>Careers</li>
                <li>Location</li>
              </ul>
            </div>

            <div>
              <p className="font-display text-[13.5px] font-semibold text-ink">Visit &amp; subscribe</p>
              <p className="mt-4 text-[12.5px] leading-relaxed text-[#6b6f63]">
                KG 7 Ave, Kigali, Rwanda
                <br />
                Mon – Sun · 07:00 – 22:00
                <br />
                +250 788 000 000
              </p>
              <form
                className="mt-5 flex items-center overflow-hidden rounded-full border border-[#8a5a2b]/40 bg-white/70 p-1 pl-4"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="email"
                  required
                  placeholder="youremail@gmail.com"
                  aria-label="Email address for the newsletter"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-[#8f9488]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#8a5a2b] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-cream transition hover:bg-[#a06a33]"
                >
                  Submit <ArrowRight size={11} />
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-ink/10 px-7 py-5 text-[11.5px] text-[#6b6f63] sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p>© {new Date().getFullYear()} Camelia Café &amp; Restaurant. All rights reserved.</p>
            <a href="mailto:hello@camelia.rw" className="transition hover:text-[#8a5a2b]">hello@camelia.rw</a>
          </div>

          {/* oversized wordmark, clipped at the card edge like the reference */}
          <div className="select-none overflow-hidden px-5" aria-hidden="true">
            <p className="-mb-[0.18em] whitespace-nowrap text-center font-display text-[clamp(3.5rem,17vw,15rem)] font-bold leading-[0.8] tracking-[-0.03em] text-[#7a4a22]/85">
              CAMELIA
            </p>
          </div>
        </div>
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
