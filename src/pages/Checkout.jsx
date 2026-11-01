import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaystackPop from '@paystack/inline-js';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../lib/format';
import { getDeliveryFees, quoteCart, startCheckout } from '../api/shop';
import { invalidateCatalogue } from '../api/catalogue';
import useAsync from '../lib/useAsync';
import ProductImage from '../components/product/ProductImage';

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [state, setState] = useState('');
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [quote, setQuote] = useState(null);

  const { data: fees, error: feesError } = useAsync(getDeliveryFees, []);
  const feeByState = useMemo(() => new Map((fees ?? []).map((f) => [f.state, f])), [fees]);

  // The server prices the bag (delivery + discount), so the total shown is the total charged.
  const linesKey = lines.map((l) => `${l.sku}:${l.qty}`).join(',');
  useEffect(() => {
    if (!state || lines.length === 0) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    quoteCart({ lines, state, discountCode: appliedCode })
      .then((q) => !cancelled && setQuote(q))
      .catch((err) => {
        if (cancelled) return;
        setQuote(null);
        if (appliedCode) {
          toast.error(err.message);
          setAppliedCode('');
        } else if (err.status === 409) {
          toast.error(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, linesKey, appliedCode]);

  const fee = quote?.shippingFee ?? feeByState.get(state)?.fee ?? 0;
  const discount = quote?.discountAmount ?? 0;
  const total = quote?.total ?? subtotal + fee;

  if (lines.length === 0) {
    return (
      <div className="container-x py-24">
        <h1 className="display text-3xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Add something to your bag before checking out.</p>
        <Link to="/shop" className="btn-solid mt-6">Shop all products</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (paying) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(data.email ?? '')) next.email = 'Enter a valid email address.';
    if (!data.name?.trim()) next.name = 'Enter your full name.';
    if (!/^(\+?234|0)\d{10}$/.test((data.phone ?? '').replace(/[\s-]/g, ''))) next.phone = 'Enter a Nigerian phone number, like 0803 123 4567.';
    if (!data.address?.trim()) next.address = 'Enter your delivery address.';
    if (!data.city?.trim()) next.city = 'Enter your city.';
    if (!data.state) next.state = 'Choose your state.';
    setErrors(next);

    if (Object.keys(next).length) {
      toast.error('Check the highlighted fields.');
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }

    setPaying(true);
    try {
      const order = await startCheckout({
        lines,
        discountCode: appliedCode,
        customer: {
          email: data.email.trim(),
          name: data.name.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          state: data.state,
        },
      });

      const done = () => {
        clear();
        invalidateCatalogue();
        navigate(`/order/${order.orderNumber}?reference=${encodeURIComponent(order.reference)}`);
      };

      // The order is already created and priced on the server; Paystack only collects the money.
      new PaystackPop().resumeTransaction(order.accessCode, {
        onSuccess: done,
        onCancel: () => {
          setPaying(false);
          toast('Payment cancelled. Your bag is saved, so you can try again.');
        },
        onError: (error) => {
          setPaying(false);
          toast.error(error?.message || 'Payment could not start. Please try again.');
        },
      });
    } catch (err) {
      setPaying(false);
      toast.error(err.message);
      if (err.field) {
        setErrors((prev) => ({ ...prev, [err.field.toLowerCase()]: err.message }));
      }
    }
  };

  const err = (id) => ({
    'aria-invalid': Boolean(errors[id]),
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
  });

  return (
    <div className="container-x pt-10">
      <h1 className="display text-3xl sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={submit} noValidate className="space-y-10" id="checkout-form">
          <fieldset className="space-y-4">
            <legend className="display mb-4 text-lg">Contact</legend>
            <Field id="email" label="Email address" error={errors.email}>
              <input id="email" name="email" type="email" autoComplete="email" className="field" {...err('email')} />
            </Field>
            <Field id="phone" label="Phone number" error={errors.phone}>
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" {...err('phone')} />
            </Field>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="display mb-4 text-lg">Delivery</legend>
            <Field id="name" label="Full name" error={errors.name}>
              <input id="name" name="name" autoComplete="name" className="field" {...err('name')} />
            </Field>
            <Field id="address" label="Address" error={errors.address}>
              <input id="address" name="address" autoComplete="street-address" className="field" {...err('address')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City" error={errors.city}>
                <input id="city" name="city" autoComplete="address-level2" className="field" {...err('city')} />
              </Field>
              <Field id="state" label="State" error={errors.state}>
                <select
                  id="state"
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  autoComplete="address-level1"
                  className="field"
                  {...err('state')}
                >
                  <option value="">Choose a state</option>
                  {(fees ?? []).map((f) => (
                    <option key={f.state}>{f.state}</option>
                  ))}
                </select>
              </Field>
            </div>
            {feesError && <p className="text-sm text-signal">Couldn&rsquo;t load delivery areas. Refresh to try again.</p>}
            {state && feeByState.get(state)?.estimate && (
              <p className="text-sm text-muted">Estimated delivery to {state}: {feeByState.get(state).estimate}.</p>
            )}
          </fieldset>

          <fieldset>
            <legend className="display mb-4 text-lg">Payment</legend>
            <p className="border border-asphalt/20 p-4 text-sm text-muted">
              You&rsquo;ll pay securely by card, bank transfer or USSD with Paystack after you place the order.
            </p>
          </fieldset>
        </form>

        <aside className="h-fit bg-chalk p-6 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="display text-lg">Order summary</h2>
          <ul className="mt-5 divide-y divide-asphalt/10">
            {lines.map((l) => (
              <li key={l.sku} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-paper">
                  <ProductImage src={l.image} alt={l.name} shape={l.shape} color={l.colorHex} />
                  <span className="absolute right-0 top-0 grid h-5 min-w-[1.25rem] place-items-center bg-asphalt px-1 text-[11px] font-bold text-paper">
                    {l.qty}
                  </span>
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-muted">
                    {l.color}, {l.size}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-asphalt/15 pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-olive">
                <dt>Discount ({quote.discountCode})</dt>
                <dd>-{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{!state ? 'Choose a state' : formatPrice(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-asphalt/15 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!state) return toast('Choose your state first.');
              setAppliedCode(codeInput.trim().toUpperCase());
            }}
          >
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Discount code"
              aria-label="Discount code"
              className="field"
            />
            <button type="submit" className="btn-outline px-4">Apply</button>
          </form>

          <button type="submit" form="checkout-form" disabled={paying || (state && !quote)} className="btn-solid mt-6 w-full">
            {paying ? 'Opening secure payment…' : `Pay ${formatPrice(total)}`}
          </button>
          <Link to="/shop" className="mt-4 block text-center text-sm link-underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
