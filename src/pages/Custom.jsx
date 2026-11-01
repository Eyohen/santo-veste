import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitCustomRequest } from '../api/shop';
import { customLines, customServices, orderSteps } from '../data/products.mock';
import { formatPrice } from '../lib/format';
import { BRAND } from '../lib/brand';

function QuoteForm() {
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    const form = e.currentTarget;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const next = {};
    if (!d.name?.trim()) next.name = 'Enter your name or organisation.';
    if (!/^\S+@\S+\.\S+$/.test(d.email ?? '')) next.email = 'Enter a valid email address.';
    if (!/^(\+?234|0)\d{10}$/.test((d.phone ?? '').replace(/[\s-]/g, ''))) next.phone = 'Enter a Nigerian phone number, like 0803 123 4567.';
    if (!(Number(d.quantity) >= BRAND.moq)) next.quantity = `Custom orders start at ${BRAND.moq} pieces.`;
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Check the highlighted fields.');
      document.getElementById(`q-${Object.keys(next)[0]}`)?.focus();
      return;
    }

    setSending(true);
    try {
      await submitCustomRequest({ ...d, quantity: Number(d.quantity) });
      form.reset();
      toast.success('Request received. We will contact you with a quote soon.');
    } catch (error) {
      toast.error(error.message);
      if (error.field) setErrors({ [error.field.toLowerCase()]: error.message });
    } finally {
      setSending(false);
    }
  };

  const err = (id) => ({
    'aria-invalid': Boolean(errors[id]),
    'aria-describedby': errors[id] ? `q-${id}-error` : undefined,
  });
  const Msg = ({ id }) =>
    errors[id] ? (
      <p id={`q-${id}-error`} className="mt-1 text-sm text-signal">
        {errors[id]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="q-name" className="mb-1.5 block text-sm font-semibold">Name or organisation</label>
          <input id="q-name" name="name" autoComplete="organization" className="field" {...err('name')} />
          <Msg id="name" />
        </div>
        <div>
          <label htmlFor="q-email" className="mb-1.5 block text-sm font-semibold">Email address</label>
          <input id="q-email" name="email" type="email" autoComplete="email" className="field" {...err('email')} />
          <Msg id="email" />
        </div>
        <div>
          <label htmlFor="q-phone" className="mb-1.5 block text-sm font-semibold">Phone number</label>
          <input id="q-phone" name="phone" type="tel" autoComplete="tel" className="field" {...err('phone')} />
          <Msg id="phone" />
        </div>
        <div>
          <label htmlFor="q-quantity" className="mb-1.5 block text-sm font-semibold">Quantity (minimum {BRAND.moq})</label>
          <input id="q-quantity" name="quantity" type="number" min={BRAND.moq} defaultValue={BRAND.moq} className="field" {...err('quantity')} />
          <Msg id="quantity" />
        </div>
      </div>
      <div>
        <label htmlFor="q-product" className="mb-1.5 block text-sm font-semibold">Product</label>
        <select id="q-product" name="product" className="field">
          {customLines.map((l) => (
            <option key={l.name}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="q-message" className="mb-1.5 block text-sm font-semibold">Tell us what you need</label>
        <textarea
          id="q-message"
          name="message"
          rows={5}
          placeholder="Colours, sizes, logo or text, printing or embroidery, and when you need it."
          className="field"
        />
      </div>
      <button type="submit" disabled={sending} className="btn-solid">{sending ? 'Sending…' : 'Request a quote'}</button>
    </form>
  );
}

export default function Custom() {
  return (
    <div>
      <section className="bg-asphalt text-paper">
        <div className="container-x grid items-end gap-10 py-16 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="display text-3xl sm:text-4xl">Custom and bulk orders</h1>
            <p className="mt-6 max-w-xl text-lg text-paper/80">
              Uniforms, team kits, branded polos and tees. Tailored for schools, professional use, corporate teams and
              events, with your logo, names or message on every piece.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-t border-paper/20 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <dt className="text-sm text-paper/60">Minimum order</dt>
              <dd className="display mt-1 text-xl">{BRAND.moq} pieces</dd>
            </div>
            <div>
              <dt className="text-sm text-paper/60">Sizes</dt>
              <dd className="display mt-1 text-xl">S to XXXL</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="container-x mt-16" aria-labelledby="price-title">
        <h2 id="price-title" className="display text-xl sm:text-2xl">
          What we make
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Base prices are per piece. Final prices are subject to your requirements, so we quote each order.
        </p>
        <ul className="mt-8 divide-y divide-asphalt/15 border-y border-asphalt/15">
          {customLines.map((l) => (
            <li key={l.name} className="grid gap-1 py-4 sm:grid-cols-[1fr_2fr_auto] sm:items-baseline sm:gap-6">
              <h3 className="font-semibold">{l.name}</h3>
              <p className="text-muted">{l.note}</p>
              <p className="font-semibold sm:text-right">From {formatPrice(l.price)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x mt-20 grid gap-12 lg:grid-cols-2" aria-labelledby="services-title">
        <div>
          <h2 id="services-title" className="display text-xl sm:text-2xl">
            Customization
          </h2>
          <ul className="mt-8 space-y-5">
            {customServices.map((s) => (
              <li key={s.title}>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="display text-xl sm:text-2xl">How it works</h2>
          <ol className="mt-8 space-y-5">
            {orderSteps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="display grid h-8 w-8 shrink-0 place-items-center bg-asphalt text-xs text-paper">{i + 1}</span>
                <p className="pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x mt-20 grid gap-12 lg:grid-cols-[1.4fr_1fr]" aria-labelledby="quote-title">
        <div>
          <h2 id="quote-title" className="display text-xl sm:text-2xl">
            Request a quote
          </h2>
          <div className="mt-8">
            <QuoteForm />
          </div>
        </div>
        <aside className="h-fit bg-chalk p-6" aria-label="Contact details">
          <h2 className="display text-lg">Talk to us</h2>
          <ul className="mt-5 space-y-3">
            <li>
              <a href={BRAND.phoneHref} className="font-semibold link-underline">{BRAND.phone}</a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="font-semibold link-underline">{BRAND.email}</a>
            </li>
            <li>Instagram: {BRAND.social}</li>
            <li>
              {BRAND.addressLines.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
            </li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
