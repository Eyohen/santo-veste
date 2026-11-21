import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '../../store/CartContext';
import { useWishlist } from '../../store/WishlistContext';
import { useCategories } from '../../api/catalogue';

const navLink = ({ isActive }) =>
  `py-2 text-sm font-semibold transition-colors hover:text-taupe ${isActive ? 'underline underline-offset-8' : ''}`;

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute right-0.5 top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-asphalt px-1 text-[10px] font-bold text-paper">
      {count}
    </span>
  );
}

function SearchOverlay({ onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q').toString().trim();
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    onClose();
  };

  return (
    <div className="absolute inset-x-0 top-full z-40 border-t border-asphalt/10 bg-paper shadow-lg">
      <form onSubmit={submit} role="search" className="container-x flex items-center gap-4 py-5">
        <Search size={20} aria-hidden />
        <input
          ref={inputRef}
          name="q"
          type="search"
          placeholder="Search polos, hoodies, cargo"
          aria-label="Search the store"
          className="w-full bg-transparent text-lg focus:outline-none"
        />
        <button type="button" onClick={onClose} aria-label="Close search" className="grid h-10 w-10 place-items-center">
          <X size={20} />
        </button>
      </form>
    </div>
  );
}

export default function Header() {
  const categories = useCategories();
  const { count, openCart } = useCart();
  const { count: wishCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  // Close any open panel when the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setMega(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur" onMouseLeave={() => setMega(false)}>
      <div className="container-x relative grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-asphalt/10">
        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          <button
            type="button"
            className="py-2 text-sm font-semibold hover:text-taupe"
            aria-expanded={mega}
            onMouseEnter={() => setMega(true)}
            onFocus={() => setMega(true)}
            onClick={() => setMega((v) => !v)}
          >
            Shop
          </button>
          <NavLink to="/design" className={navLink}>
            Design your own
          </NavLink>
          <NavLink to="/custom" className={navLink}>
            Custom orders
          </NavLink>
          <NavLink to="/about" className={navLink}>
            About
          </NavLink>
        </nav>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center lg:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Link to="/" aria-label="Santo Veste home" className="justify-self-center">
          <img src="/brand/lockup-horizontal.png" alt="Santo Veste" width="130" height="36" className="h-8 w-auto sm:h-9" />
        </Link>

        <div className="flex items-center justify-end">
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center hover:text-taupe"
          >
            <Search size={20} />
          </button>
          <Link to="/account" aria-label="Account" className="hidden h-10 w-10 place-items-center hover:text-taupe sm:grid">
            <User size={20} />
          </Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative grid h-10 w-10 place-items-center hover:text-taupe">
            <Heart size={20} />
            <Badge count={wishCount} />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open bag, ${count} items`}
            className="relative grid h-10 w-10 place-items-center hover:text-taupe"
          >
            <ShoppingBag size={20} />
            <Badge count={count} />
          </button>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {mega && (
        <div className="absolute inset-x-0 top-full hidden border-b border-asphalt/10 bg-paper shadow-lg lg:block">
          <div className="container-x grid grid-cols-[1fr_1.2fr] gap-10 py-8">
            <ul className="space-y-1">
              <li>
                <Link to="/shop" className="display block py-1.5 text-lg hover:text-taupe">
                  All products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop/${c.slug}`} className="display block py-1.5 text-lg hover:text-taupe">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="grid grid-cols-4 gap-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop/${c.slug}`} className="group block">
                    <span className="block aspect-[4/5] overflow-hidden bg-chalk">
                      {c.image && <img src={c.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </span>
                    <span className="mt-2 block text-sm font-semibold">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-paper lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="container-x flex h-16 items-center justify-between border-b border-asphalt/10">
            <img src="/brand/lockup-horizontal.png" alt="Santo Veste" className="h-8 w-auto" />
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center">
              <X size={22} />
            </button>
          </div>
          <nav aria-label="Mobile" className="container-x flex flex-col py-4">
            {[
              ['All products', '/shop'],
              ...categories.map((c) => [c.name, `/shop/${c.slug}`]),
              ['Design your own', '/design'],
              ['Custom orders', '/custom'],
              ['About', '/about'],
              ['Account', '/account'],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="display border-b border-asphalt/10 py-4 text-xl">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
