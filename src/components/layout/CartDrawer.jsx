import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../store/CartContext';
import { formatPrice } from '../../lib/format';
import ProductImage from '../product/ProductImage';

export default function CartDrawer() {
  const { isOpen, closeCart, lines, subtotal, setQty, removeItem } = useCart();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[60] bg-asphalt/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col bg-paper"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-asphalt/10 px-5 py-4">
              <h2 className="display text-xl">Bag</h2>
              <button type="button" onClick={closeCart} aria-label="Close bag" className="grid h-10 w-10 place-items-center">
                <X size={22} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-4 px-5">
                <p className="display text-2xl">Your bag is empty</p>
                <p className="text-muted">Add a piece and it will wait for you here.</p>
                <Link to="/shop" onClick={closeCart} className="btn-solid">
                  Shop all products
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-asphalt/10 overflow-y-auto px-5">
                  {lines.map((l) => (
                    <li key={l.sku} className="flex gap-4 py-5">
                      <Link to={l.designId ? '/design' : `/product/${l.slug}`} onClick={closeCart} className="block h-28 w-24 shrink-0 overflow-hidden bg-chalk">
                        <ProductImage src={l.image} alt={l.name} shape={l.shape} color={l.colorHex} />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold">{l.name}</p>
                            <p className="text-sm text-muted">
                              {l.color}, {l.size}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">{formatPrice(l.price * l.qty)}</p>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-asphalt/25">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${l.name}`}
                              onClick={() => setQty(l.sku, l.qty - 1)}
                              className="grid h-9 w-9 place-items-center hover:bg-chalk"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm" aria-live="polite">
                              {l.qty}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${l.name}`}
                              disabled={l.qty >= l.stock}
                              onClick={() => setQty(l.sku, l.qty + 1)}
                              className="grid h-9 w-9 place-items-center hover:bg-chalk disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button type="button" onClick={() => removeItem(l.sku)} className="text-sm text-muted link-underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-asphalt/10 px-5 py-5">
                  <div className="mb-1 flex justify-between font-semibold">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-sm text-muted">Delivery is calculated at checkout.</p>
                  <Link to="/checkout" onClick={closeCart} className="btn-solid w-full">
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
