import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { categories, getFacets, getProducts, SORT_OPTIONS } from '../api/catalogue';
import { SIZES } from '../data/products.mock';
import useAsync from '../lib/useAsync';
import ProductCard from '../components/product/ProductCard';
import FilterPanel from '../components/product/FilterPanel';
import NotFound from './NotFound';

const list = (params, key) => (params.get(key) ? params.get(key).split(',') : []);

export default function Shop() {
  const { category } = useParams(); // /shop/:category
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: loadedFacets } = useAsync(() => getFacets(category), [category]);
  const facets = loadedFacets ?? { sizes: SIZES, colors: [], maxPrice: 0, minPrice: 0 };
  const categoryInfo = category ? categories.find((c) => c.slug === category) : null;

  const filters = {
    sizes: list(params, 'size'),
    colors: list(params, 'color'),
    maxPrice: params.get('max') ? Number(params.get('max')) : null,
  };
  const sort = params.get('sort') ?? 'featured';
  const q = params.get('q') ?? '';

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      const name = { sizes: 'size', colors: 'color', maxPrice: 'max' }[key] ?? key;
      const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
      if (empty) next.delete(name);
      else next.set(name, Array.isArray(value) ? value.join(',') : String(value));
    });
    setParams(next, { replace: true });
  };

  const clear = () => {
    const next = new URLSearchParams(params);
    ['size', 'color', 'max'].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };

  const queryKey = useMemo(
    () => JSON.stringify({ category, ...filters, sort, q }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, params],
  );

  const { data, loading, error } = useAsync(
    () =>
      getProducts({
        category,
        sizes: filters.sizes,
        colors: filters.colors,
        maxPrice: filters.maxPrice,
        sort,
        q,
      }),
    [queryKey],
  );

  if (category && !categoryInfo) return <NotFound />;

  const title = categoryInfo?.name ?? (q ? `Results for "${q}"` : 'All products');
  const products = data ?? [];

  return (
    <div className="container-x pt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:underline">Shop</Link>
        {categoryInfo && (
          <>
            <span className="mx-2">/</span>
            <span className="text-asphalt">{title}</span>
          </>
        )}
      </nav>

      <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-asphalt/10 pb-6">
        <h1 className="display text-3xl sm:text-4xl">{title}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="btn-outline px-4 py-2.5 lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filter
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })}
              className="border border-asphalt/25 bg-paper px-3 py-2.5 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel facets={facets} filters={filters} onChange={update} onClear={clear} />
          </div>
        </aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="flex items-center justify-between border-b border-asphalt/10 px-4 py-3">
              <p className="display text-lg">Filter</p>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="grid h-10 w-10 place-items-center">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <FilterPanel facets={facets} filters={filters} onChange={update} onClear={clear} />
            </div>
            <div className="border-t border-asphalt/10 p-4">
              <button type="button" onClick={() => setFiltersOpen(false)} className="btn-solid w-full">
                Show {products.length} {products.length === 1 ? 'product' : 'products'}
              </button>
            </div>
          </div>
        )}

        <section aria-label="Products" aria-busy={loading}>
          <p className="mb-4 text-sm text-muted" aria-live="polite">
            {loading ? 'Loading' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
          </p>

          {loading && products.length === 0 ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-10 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <div className="aspect-[4/5] animate-pulse bg-chalk" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <div className="py-20">
              <p className="display text-xl">We couldn&rsquo;t load the collection</p>
              <p className="mt-3 text-muted">{error.message}</p>
              <button type="button" onClick={() => window.location.reload()} className="btn-solid mt-6">
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20">
              <p className="display text-xl">Nothing matches</p>
              <p className="mt-3 text-muted">Try removing a filter or searching for something else.</p>
              <button type="button" onClick={clear} className="btn-solid mt-6">
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-10 xl:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} preferColors={filters.colors} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
