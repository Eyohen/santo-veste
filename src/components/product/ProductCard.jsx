import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductImage from './ProductImage';
import ColorSwatches from './ColorSwatches';
import { useWishlist } from '../../store/WishlistContext';
import { formatPrice } from '../../lib/format';
import { imagesFor, inStock } from '../../api/catalogue';

function uniqueColors(product) {
  const seen = new Map();
  product.variants.forEach((v) => {
    if (!seen.has(v.color)) seen.set(v.color, { name: v.color, hex: v.colorHex });
  });
  return [...seen.values()];
}

export default function ProductCard({ product, preferColors = [] }) {
  const colors = uniqueColors(product);
  const preferred = colors.find((c) => preferColors.includes(c.name));
  const [chosen, setColorName] = useState(null);
  const colorName = chosen ?? preferred?.name ?? colors[0].name;
  const active = colors.find((c) => c.name === colorName) ?? colors[0];
  const { has, toggle } = useWishlist();
  const saved = has(product.slug);
  const soldOut = !inStock(product);
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-chalk">
        <Link to={`/product/${product.slug}`} aria-label={product.name} className="block h-full">
          <ProductImage
            src={imagesFor(product, active.name)[0]}
            alt={`${product.name} in ${active.name}`}
            shape={product.shape}
            color={active.hex}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="bg-asphalt px-2 py-1 text-xs font-semibold text-paper">Sold out</span>
          ) : (
            <>
              {product.isNew && <span className="bg-paper px-2 py-1 text-xs font-semibold">New</span>}
              {onSale && <span className="bg-signal px-2 py-1 text-xs font-semibold text-paper">Sale</span>}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-paper/90 transition-colors hover:bg-paper"
        >
          <Heart size={17} className={saved ? 'fill-signal text-signal' : ''} />
        </button>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            <Link to={`/product/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            {colors.length > 1 ? `${colors.length} colours` : active.name}
          </p>
        </div>
        <p className="shrink-0 text-right text-sm">
          <span className={onSale ? 'font-semibold text-signal' : 'font-semibold'}>{formatPrice(product.price)}</span>
          {onSale && <span className="block text-muted line-through">{formatPrice(product.compareAtPrice)}</span>}
        </p>
      </div>

      {colors.length > 1 && (
        <div className="mt-2">
          <ColorSwatches colors={colors} selected={colorName} onSelect={setColorName} size="sm" />
        </div>
      )}
    </article>
  );
}
