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
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const floating = overlay && !scrolled;

  return (
    <header
      className={`${overlay ? 'fixed' : 'sticky'} inset-x-0 top-0 z-50 transition-all duration-300 ${
        floating
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-white/10 bg-forest-950/90 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-[86px] max-w-[1600px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <Logo variant="orange" className="h-12 shrink-0 sm:h-14" />

        {/* centred navigation pill */}
        <nav className="mx-auto hidden items-center gap-1 rounded-full border border-white/15 bg-forest-950/40 px-2 py-1.5 backdrop-blur-md xl:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                  isActive ? 'text-amber-logo' : 'text-sage-200/80 hover:text-white'
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
                  isActive ? 'text-amber-logo' : 'text-sage-200/80 hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Link to="/cart" className="relative hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sage-200 transition hover:border-white/40 hover:text-white sm:inline-flex" aria-label={`Cart with ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingBag size={14} />
            Cart
            {count > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-amber-logo px-1 text-[9px] font-bold text-forest-950">{count}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className="hidden items-center gap-3 rounded-full border border-amber-logo/70 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-pale transition hover:bg-amber-logo hover:text-forest-950 md:inline-flex"
          >
            Book a table
            <ArrowUpRight size={13} />
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <span className="max-w-[110px] truncate text-[11px] text-sage-300">{user.name.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-sage-200 transition hover:border-white/40 hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-200 transition hover:border-white/40 hover:text-white lg:inline-flex"
            >
              <UserIcon size={13} /> Sign in
            </Link>
          )}

          <button
            className="grid h-10 w-10 place-items-center rounded-full text-sage-100 transition hover:bg-white/10 xl:hidden"
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
