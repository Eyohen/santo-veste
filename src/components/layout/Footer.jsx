import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { categories } from '../../api/catalogue';
import { BRAND } from '../../lib/brand';

export default function Footer() {
  const subscribe = (e) => {
    e.preventDefault();
    e.currentTarget.reset();
    toast.success("You're on the list. We'll email you before the next release.");
  };

  return (
    <footer className="relative mt-24 overflow-hidden bg-asphalt text-paper">
      <img
        src="/brand/pattern-light.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full select-none object-cover object-top"
      />
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <img src="/brand/lockup-vertical-white.png" alt="Santo Veste" className="h-20 w-auto" />
          <p className="display mt-6 text-base">{BRAND.tagline}</p>
          <form onSubmit={subscribe} className="mt-6 flex max-w-sm">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="Email address"
              className="w-full border border-paper/30 bg-transparent px-4 py-3 text-sm placeholder:text-paper/50 focus:border-paper focus:outline-none"
            />
            <button type="submit" className="bg-paper px-5 text-sm font-semibold text-asphalt hover:bg-chalk">
              Join
            </button>
          </form>
          <p className="mt-3 max-w-sm text-sm text-paper/60">One email before each release. No weekly noise.</p>
        </div>

        <nav aria-label="Shop">
          <p className="mb-4 text-sm text-paper/60">Shop</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="hover:underline">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link to={`/shop/${c.slug}`} className="hover:underline">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="mb-4 text-sm text-paper/60">Santo Veste</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:underline">About us</Link></li>
            <li><Link to="/custom" className="hover:underline">Custom and bulk orders</Link></li>
            <li><Link to="/account" className="hover:underline">Track your order</Link></li>
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-sm text-paper/60">Contact</p>
          <ul className="space-y-2.5 text-sm">
            <li><a href={BRAND.phoneHref} className="hover:underline">{BRAND.phone}</a></li>
            <li><a href={`mailto:${BRAND.email}`} className="hover:underline">{BRAND.email}</a></li>
            <li className="text-paper/80">Instagram: {BRAND.social}</li>
            <li className="text-paper/80">
              {BRAND.addressLines.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </li>
          </ul>
        </div>
      </div>

      <div className="container-x relative flex flex-col gap-2 border-t border-paper/15 py-6 text-sm text-paper/60 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Santo Veste. All rights reserved.</p>
        <p>Prices in Nigerian naira. Delivery across Nigeria.</p>
      </div>
    </footer>
  );
}
