import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu as MenuIcon, ShoppingBag, Sparkles, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Logo, LogoMark } from './Logo';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/menu', label: 'Menu' },
  { to: '/recommend', label: 'Find my dish' },
  { to: '/orders', label: 'My orders' },
];

export function Header() {
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
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="flex h-8 items-center justify-center gap-3 bg-amber-logo px-4 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-forest-950">
        <span className="hidden sm:inline">A little more to love ✳ every day at Camelia</span>
        <span className="sm:hidden">Good food. Good moments. ✳</span>
      </div>
      <header
        className={`sticky top-0 z-40 border-b transition-colors ${
          scrolled ? 'border-white/10 bg-forest-900/95 backdrop-blur' : 'border-transparent bg-forest-900'
        }`}
      >
        <div className="mx-auto flex h-[74px] max-w-7xl items-center gap-6 px-5 sm:px-8">
          <Logo variant="white" className="h-11 shrink-0 sm:h-12" />

          <nav className="ml-auto hidden items-center gap-7 text-[12px] text-sage-300 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `border-b py-2 transition ${
                    isActive ? 'border-amber-logo text-white' : 'border-transparent hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `border-b py-2 transition ${isActive ? 'border-amber-logo text-white' : 'border-transparent hover:text-white'}`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Link
              to="/recommend"
              className="hidden items-center gap-2 rounded-full border border-amber-soft/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-pale transition hover:bg-amber-logo hover:text-forest-950 sm:inline-flex"
            >
              <Sparkles size={13} /> AI quiz
            </Link>

            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-sage-200 transition hover:border-white/40 hover:text-white"
              aria-label={`Cart with ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-logo px-1 text-[10px] font-bold text-forest-950">
                  {count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="max-w-[120px] truncate text-[11px] text-sage-300">{user.name.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-sage-200 transition hover:border-white/40 hover:text-white"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sage-200 transition hover:border-white/40 hover:text-white sm:inline-flex"
              >
                <UserIcon size={13} /> Sign in
              </Link>
            )}

            <button
              className="inline-grid h-10 w-10 place-items-center rounded-full border border-white/15 text-sage-100 lg:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-white/10 bg-forest-850 px-5 py-4 lg:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1 text-sm">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 ${isActive ? 'bg-forest-700 text-white' : 'text-sage-300'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin" className="rounded-lg px-3 py-2.5 text-sage-300">
                  Admin dashboard
                </NavLink>
              )}
              {user ? (
                <button onClick={handleLogout} className="mt-2 rounded-lg border border-white/15 px-3 py-2.5 text-left text-sage-200">
                  Sign out ({user.name.split(' ')[0]})
                </button>
              ) : (
                <Link to="/login" className="mt-2 rounded-lg bg-amber-logo px-3 py-2.5 text-center text-forest-950">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-forest-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
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
            <li><Link className="hover:text-white" to="/orders">My orders</Link></li>
            <li><Link className="hover:text-white" to="/cart">Cart</Link></li>
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
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
