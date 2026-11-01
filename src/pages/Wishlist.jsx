import { Link } from 'react-router-dom';
import { getProducts } from '../api/catalogue';
import useAsync from '../lib/useAsync';
import { useWishlist } from '../store/WishlistContext';
import ProductCard from '../components/product/ProductCard';

export default function Wishlist() {
  const { slugs } = useWishlist();
  const { data, loading } = useAsync(() => getProducts(), []);
  const saved = (data ?? []).filter((p) => slugs.includes(p.slug));

  return (
    <div className="container-x pt-10">
      <h1 className="display text-3xl sm:text-4xl">Wishlist</h1>
      {!loading && saved.length === 0 ? (
        <div className="py-16">
          <p className="display text-xl">Nothing saved yet</p>
          <p className="mt-3 max-w-md text-muted">Tap the heart on any piece to keep it here. Your list stays on this device.</p>
          <Link to="/shop" className="btn-solid mt-6">Browse the shop</Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
          {saved.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
