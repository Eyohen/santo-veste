import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../api/shop';
import { formatPrice } from '../lib/format';

const STEPS = ['processing', 'shipped', 'delivered'];

// Paystack sends shoppers back here (and the popup navigates here on success).
// The page never trusts the redirect: it asks the server to confirm with Paystack.
export default function OrderStatus() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState({ status: reference ? 'checking' : 'missing', order: null, error: null });

  useEffect(() => {
    if (!reference) return undefined;
    let cancelled = false;
    let attempts = 0;
    const run = () => {
      verifyPayment(reference)
        .then((order) => !cancelled && setState({ status: order.paymentStatus, order, error: null }))
        .catch((error) => {
          if (cancelled) return;
          // The webhook may still be settling; retry a couple of times before giving up.
          if (attempts++ < 2 && error.status !== 404) setTimeout(run, 2500);
          else setState({ status: 'error', order: null, error });
        });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const { status, order, error } = state;

  return (
    <div className="container-x max-w-3xl py-16">
      {status === 'checking' && (
        <>
          <h1 className="display text-3xl">Confirming your payment…</h1>
          <p className="mt-3 text-muted">This only takes a moment. Please don&rsquo;t close this page.</p>
        </>
      )}

      {status === 'paid' && order && (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-olive">Payment received</p>
          <h1 className="display mt-2 text-3xl sm:text-4xl">Thank you, {order.customerName.split(' ')[0]}.</h1>
          <p className="mt-3 text-charcoal">
            Order <b>{order.orderNumber}</b> is confirmed. A receipt is on its way to {order.email}, and we&rsquo;ll email
            you again when it ships.
          </p>

          <ol className="mt-8 flex gap-2 text-sm" aria-label="Order progress">
            {STEPS.map((s) => (
              <li
                key={s}
                className={`flex-1 border-t-2 pt-2 capitalize ${
                  STEPS.indexOf(s) <= STEPS.indexOf(order.status) ? 'border-asphalt font-semibold' : 'border-asphalt/15 text-muted'
                }`}
              >
                {s}
              </li>
            ))}
          </ol>

          <ul className="mt-8 divide-y divide-asphalt/10 border-y border-asphalt/10">
            {order.items.map((i) => (
              <li key={i.sku} className="flex justify-between gap-4 py-4 text-sm">
                <span>
                  <b>{i.name}</b>
                  <br />
                  <span className="text-muted">{i.color}, {i.size} × {i.quantity}</span>
                </span>
                <span className="font-semibold">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between"><dt>Discount</dt><dd>-{formatPrice(order.discountAmount)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(order.shippingFee)}</dd></div>
            <div className="flex justify-between border-t border-asphalt/15 pt-2 text-base font-semibold">
              <dt>Total paid</dt><dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-muted">
            Delivering to {order.shipping.address}, {order.shipping.city}, {order.shipping.state}.
          </p>
          <Link to="/shop" className="btn-solid mt-8">Keep shopping</Link>
        </>
      )}

      {(status === 'failed' || status === 'unpaid') && (
        <>
          <h1 className="display text-3xl">Payment didn&rsquo;t go through</h1>
          <p className="mt-3 text-muted">
            {status === 'failed'
              ? 'Your card was not charged for this order. Your bag is still saved if you want to try again.'
              : 'We have not received a payment for this order yet. If you were charged, it will update here shortly.'}
          </p>
          <Link to="/checkout" className="btn-solid mt-6">Back to checkout</Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="display text-3xl">We couldn&rsquo;t confirm your payment</h1>
          <p className="mt-3 text-muted">
            {error?.message} If money left your account, don&rsquo;t pay again. Contact us with order number{' '}
            <b>{orderNumber}</b> and we&rsquo;ll sort it out.
          </p>
          <Link to="/" className="btn-solid mt-6">Back home</Link>
        </>
      )}

      {status === 'missing' && (
        <>
          <h1 className="display text-3xl">Order {orderNumber}</h1>
          <p className="mt-3 text-muted">Open the link from your confirmation email, or contact us with your order number.</p>
          <Link to="/" className="btn-solid mt-6">Back home</Link>
        </>
      )}
    </div>
  );
}
