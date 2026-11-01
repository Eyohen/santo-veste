import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { categories, getProduct, getRelated, imagesFor } from '../api/catalogue';
import useAsync from '../lib/useAsync';
import { useCart } from '../store/CartContext';
import { useWishlist } from '../store/WishlistContext';
import { formatPrice } from '../lib/format';
import { BRAND } from '../lib/brand';
import ProductImage from '../components/product/ProductImage';
import ProductCard from '../components/product/ProductCard';
import ColorSwatches from '../components/product/ColorSwatches';
import SizePicker from '../components/product/SizePicker';
import NotFound from './NotFound';

function Accordion({ title, children, defaultOpen = false }) {
  return (
    <details className="group border-t border-asphalt/15 py-4 last:border-b" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

function ProductView({ product }) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  const colors = useMemo(() => {
    const seen = new Map();
    product.variants.forEach((v) => {
      if (!seen.has(v.color)) seen.set(v.color, { name: v.color, hex: v.colorHex });
    });
    return [...seen.values()];
  }, [product]);

  // Prefer the first colour that still has stock.
  const firstAvailable = colors.find((c) => product.variants.some((v) => v.color === c.name && v.stock > 0)) ?? colors[0];
  const [colorName, setColorName] = useState(firstAvailable.name);
  const [size, setSize] = useState(null);

  useEffect(() => setSize(null), [colorName]);

  const color = colors.find((c) => c.name === colorName);
  const colorVariants = product.variants.filter((v) => v.color === colorName);
  const selected = colorVariants.find((v) => v.size === size);
  const saved = has(product.slug);
  const allSoldOut = colorVariants.every((v) => v.stock === 0);
  const category = categories.find((c) => c.slug === product.category);
  const photos = imagesFor(product, colorName);

  const add = () => {
    if (!selected) return toast.error('Choose a size first.');
    return addItem(product, selected);
  };

  return (
    <div className="container-x pt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop/${product.category}`} className="hover:underline">{category?.name ?? 'Shop'}</Link>
        <span className="mx-2">/</span>
        <span className="text-asphalt">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,36rem)_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-xl space-y-3 lg:mx-0">
          {photos.length ? (
            photos.map((src, i) => (
              <div key={src} className="aspect-[4/5] overflow-hidden bg-chalk">
                <img
                  src={src}
                  alt={`${product.name} in ${color.name}${photos.length > 1 ? `, view ${i + 1}` : ''}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="aspect-[4/5] overflow-hidden bg-chalk">
              <ProductImage alt={product.name} color={color.hex} />
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm text-muted">{category?.name}</p>
          <h1 className="display mt-2 text-2xl sm:text-3xl">{product.name}</h1>
          <p className="mt-4 flex items-baseline gap-3 text-lg">
            <span className="font-semibold">{formatPrice(product.price)}</span>
          </p>

          <div className="mt-8">
            <p className="mb-3 text-sm">
              <span className="font-semibold">Colour</span> <span className="text-muted">{color.name}</span>
            </p>
            <ColorSwatches colors={colors} selected={colorName} onSelect={setColorName} />
          </div>

          <div className="mt-8">
            <p className="mb-3 flex justify-between text-sm">
              <span className="font-semibold">Size</span>
              {selected && selected.stock <= 3 && selected.stock > 0 && (
                <span className="font-semibold text-signal">Only {selected.stock} left</span>
              )}
            </p>
            <SizePicker variants={colorVariants} selected={size} onSelect={setSize} />
          </div>

          <div className="mt-8 flex gap-3">
            <button type="button" onClick={add} disabled={allSoldOut} className="btn-solid flex-1">
              {allSoldOut ? `Sold out in ${color.name}` : 'Add to bag'}
            </button>
            <button
              type="button"
              onClick={() => toggle(product.slug)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              className="grid h-[3.1rem] w-[3.1rem] place-items-center border border-asphalt/25 hover:border-asphalt"
            >
              <Heart size={19} className={saved ? 'fill-asphalt' : ''} />
            </button>
          </div>

          <p className="mt-6 leading-relaxed">{product.description}</p>

          <div className="mt-8">
            <Accordion title="Fabric and features" defaultOpen>
              <p>
                <strong className="text-asphalt">Fabric:</strong> {product.fabrics}
              </p>
              <p className="mt-1">
                <strong className="text-asphalt">Features:</strong> {product.features}
              </p>
            </Accordion>
            <Accordion title="Ordering for a team or event?">
              <p>
                We can add your logo, name or message and make this piece in your colours. Custom orders start at{' '}
                {BRAND.moq} pieces.{' '}
                <Link to="/custom" className="font-semibold text-asphalt link-underline">
                  Request a quote
                </Link>
                .
              </p>
            </Accordion>
            <Accordion title="Delivery and help">
              <p>
                We deliver across Nigeria, and the delivery fee is calculated at checkout by state. For sizing or order
                questions, call{' '}
                <a href={BRAND.phoneHref} className="font-semibold text-asphalt link-underline">
                  {BRAND.phone}
                </a>
                .
              </p>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { data: product, loading, error } = useAsync(() => getProduct(slug), [slug]);
  const { data: related } = useAsync(() => (product ? getRelated(product) : Promise.resolve([])), [product?.id]);

  if (loading && !product) {
    return (
      <div className="container-x grid gap-10 pt-16 lg:grid-cols-[1.35fr_1fr]">
        <div className="aspect-[4/5] animate-pulse bg-chalk" />
        <div className="space-y-4">
          <div className="h-12 w-3/4 animate-pulse bg-chalk" />
          <div className="h-6 w-1/4 animate-pulse bg-chalk" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container-x py-24">
        <h1 className="display text-3xl">We couldn&rsquo;t load this product</h1>
        <p className="mt-3 text-muted">{error.message}</p>
      </div>
    );
  }
  if (!product) return <NotFound />;

  return (
    <>
      {/* key resets colour and size state when moving between products */}
      <ProductView key={product.id} product={product} />
      {related?.length > 0 && (
        <section className="container-x mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="display mb-8 text-2xl sm:text-3xl">
            You may also like
          </h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
