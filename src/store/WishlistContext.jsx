import { createContext, useContext, useMemo } from 'react';
import useStoredState from './useStoredState';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [slugs, setSlugs] = useStoredState('sv-wishlist', []);

  const value = useMemo(
    () => ({
      slugs,
      count: slugs.length,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        setSlugs((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug])),
    }),
    [slugs, setSlugs],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
