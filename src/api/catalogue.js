// The only module that knows where catalogue data comes from: the Santo Veste API.
// Return shapes are unchanged from the mock days, so pages don't care.

import { api } from './client';
import { categories, SIZES } from '../data/products.mock';

// The catalogue is small, so it is fetched once and filtered in the browser.
// A short TTL keeps stock figures fresh without a request per filter click.
const TTL_MS = 30_000;
let cache = null;

async function loadAll() {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.products;
  const { products } = await api('/products');
  cache = { at: Date.now(), products };
  return products;
}

/** Call after anything that changes stock (a completed checkout). */
export const invalidateCatalogue = () => { cache = null; };

const sorters = {
  featured: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
];

export function inStock(product) {
  return product.variants.some((v) => v.stock > 0);
}

/** Photos for the given colour, falling back to the product's default photos. */
export function imagesFor(product, colorName) {
  return product.imagesByColor?.[colorName] ?? product.images;
}

/**
 * @param {{category?: string, sizes?: string[], colors?: string[],
 *          maxPrice?: number, q?: string, sort?: string}} filters
 */
export async function getProducts(filters = {}) {
  const { category, sizes = [], colors = [], maxPrice, q, sort = 'featured' } = filters;
  const term = q?.trim().toLowerCase();

  const result = (await loadAll())
    .filter((p) => !category || p.category === category)
    .filter((p) => !maxPrice || p.price <= maxPrice)
    .filter((p) => !sizes.length || p.variants.some((v) => v.stock > 0 && sizes.includes(v.size)))
    .filter((p) => !colors.length || p.variants.some((v) => colors.includes(v.color)))
    .filter(
      (p) =>
        !term ||
        [p.name, p.category, p.fabrics, p.features, ...p.variants.map((v) => v.color)]
          .join(' ')
          .toLowerCase()
          .includes(term),
    )
    .sort(sorters[sort] ?? sorters.featured);

  return result;
}

export async function getProduct(slug) {
  try {
    return (await api(`/products/${encodeURIComponent(slug)}`)).product;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getRelated(product, limit = 4) {
  const related = (await loadAll())
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, limit);
  return related;
}

/** Options for the filter panel. */
export async function getFacets(category) {
  const all = await loadAll();
  const scoped = category ? all.filter((p) => p.category === category) : all;
  const colors = new Map();
  scoped.forEach((p) => p.variants.forEach((v) => colors.set(v.color, { name: v.color, hex: v.colorHex })));
  const prices = scoped.map((p) => p.price);
  return {
    sizes: SIZES,
    colors: [...colors.values()],
    maxPrice: prices.length ? Math.max(...prices) : 0,
    minPrice: prices.length ? Math.min(...prices) : 0,
  };
}

export { categories };
