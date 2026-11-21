import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useStoredState from './useStoredState';
import { imagesFor } from '../api/catalogue';

const CartContext = createContext(null);

// A cart line is a snapshot of one variant (sku), so the cart keeps working
// without re-fetching the catalogue.
export function CartProvider({ children }) {
  const [lines, setLines] = useStoredState('sv-cart', []);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback(
    (product, variant, qty = 1) => {
      const existing = lines.find((l) => l.sku === variant.sku);
      if (existing && existing.qty >= variant.stock) {
        toast.error(`That's all we have in ${variant.size}.`);
        setIsOpen(true);
        return;
      }
      setLines((current) => {
        const found = current.find((l) => l.sku === variant.sku);
        if (found) {
          const next = Math.min(found.qty + qty, variant.stock);
          return current.map((l) => (l.sku === variant.sku ? { ...l, qty: next, stock: variant.stock } : l));
        }
        return [
          ...current,
          {
            sku: variant.sku,
            slug: product.slug,
            name: product.name,
            shape: product.shape,
            price: product.price,
            color: variant.color,
            colorHex: variant.colorHex,
            size: variant.size,
            stock: variant.stock,
            image: imagesFor(product, variant.color)?.[0] ?? null,
            qty: Math.min(qty, variant.stock),
          },
        ];
      });
      setIsOpen(true);
    },
    [lines, setLines],
  );

  /** A customer-designed t-shirt. Priced by the server at checkout; `price` here is only for display. */
  const addCustom = useCallback((design, size, qty, price) => {
    const sku = `custom-${design.id}-${size}`;
    setLines((current) => {
      const found = current.find((l) => l.sku === sku);
      if (found) return current.map((l) => (l.sku === sku ? { ...l, qty: Math.min(found.qty + qty, 50) } : l));
      return [...current, { sku, designId: design.id, slug: null, name: 'Custom T-shirt', price, color: 'Black', colorHex: '#171714', size, stock: 50, image: design.previewUrl, qty }];
    });
    setIsOpen(true);
  }, [setLines]);

  const setQty = useCallback(
    (sku, qty) => {
      setLines((current) =>
        current
          .map((l) => (l.sku === sku ? { ...l, qty: Math.min(qty, l.stock) } : l))
          .filter((l) => l.qty > 0),
      );
    },
    [setLines],
  );

  const removeItem = useCallback((sku) => setLines((c) => c.filter((l) => l.sku !== sku)), [setLines]);
  const clear = useCallback(() => setLines([]), [setLines]);

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
    return {
      lines,
      count,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      addCustom,
      setQty,
      removeItem,
      clear,
    };
  }, [lines, isOpen, addItem, addCustom, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
