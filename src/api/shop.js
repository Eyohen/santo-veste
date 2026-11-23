// Storefront calls that aren't catalogue reads: delivery rates, checkout, orders, quote requests.
import { api, API_BASE } from './client';
import { invalidateCatalogue } from './catalogue';

export const getDeliveryFees = async () => (await api('/delivery-fees')).deliveryFees;

const toItems = (lines) => lines.map((l) => (l.designId ? { designId: l.designId, size: l.size, qty: l.qty } : { sku: l.sku, qty: l.qty }));

/** Server-priced totals for the bag, including any discount code. */
export const quoteCart = ({ lines, state, discountCode }) =>
  api('/checkout/quote', { method: 'POST', body: { items: toItems(lines), state, discountCode: discountCode || undefined } });

/** Creates an unpaid order and a Paystack transaction. Returns { orderNumber, reference, accessCode, total }. */
export const startCheckout = ({ lines, customer, discountCode }) =>
  api('/checkout', { method: 'POST', body: { ...customer, items: toItems(lines), discountCode: discountCode || undefined } });

/** Confirms a payment with the server (which asks Paystack). Safe to repeat. */
export async function verifyPayment(reference) {
  const { order } = await api('/payments/verify', { method: 'POST', body: { reference } });
  if (order.paymentStatus === 'paid') invalidateCatalogue();
  return order;
}

export const trackOrder = async (orderNumber, email) => (await api('/orders/track', { query: { orderNumber, email } })).order;

export const submitCustomRequest = (body) => api('/custom-requests', { method: 'POST', body });

/** Saves a customer's t-shirt design (mockup + print artwork, both PNG blobs). Returns { id, previewUrl, price }. */
export async function saveDesign({ model, printSize, preview, artwork }) {
  const form = new FormData();
  form.append('model', model);
  form.append('printSize', printSize);
  form.append('preview', preview, 'preview.jpg');
  form.append('artwork', artwork, 'artwork.png');
  const res = await fetch(`${API_BASE}/custom-designs`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Could not save your design. Please try again.');
  return data;
}
