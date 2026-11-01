import { useState } from 'react';
import toast from 'react-hot-toast';

// UI shell only. Sign-in and order lookup connect to the backend later.
const notReady = (e) => {
  e.preventDefault();
  toast('Accounts and order tracking open once the store goes live.');
};

export default function Account() {
  const [tab, setTab] = useState('signin');
  const tabs = [
    ['signin', 'Sign in'],
    ['track', 'Track an order'],
  ];

  return (
    <div className="container-x max-w-xl pt-10">
      <h1 className="display text-3xl sm:text-4xl">Account</h1>

      <div role="tablist" aria-label="Account" className="mt-8 flex border-b border-asphalt/15">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold ${
              tab === id ? 'border-asphalt' : 'border-transparent text-muted hover:text-asphalt'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-8">
        {tab === 'signin' ? (
          <form onSubmit={notReady} className="space-y-4">
            <div>
              <label htmlFor="acc-email" className="mb-1.5 block text-sm font-semibold">Email address</label>
              <input id="acc-email" type="email" required autoComplete="email" className="field" />
            </div>
            <div>
              <label htmlFor="acc-pass" className="mb-1.5 block text-sm font-semibold">Password</label>
              <input id="acc-pass" type="password" required autoComplete="current-password" className="field" />
            </div>
            <button type="submit" className="btn-solid w-full">Sign in</button>
            <p className="text-sm text-muted">You can check out as a guest without an account.</p>
          </form>
        ) : (
          <form onSubmit={notReady} className="space-y-4">
            <div>
              <label htmlFor="trk-order" className="mb-1.5 block text-sm font-semibold">Order number</label>
              <input id="trk-order" required className="field" placeholder="SV-10234" />
            </div>
            <div>
              <label htmlFor="trk-email" className="mb-1.5 block text-sm font-semibold">Email used at checkout</label>
              <input id="trk-email" type="email" required className="field" />
            </div>
            <button type="submit" className="btn-solid w-full">Track order</button>
          </form>
        )}
      </div>
    </div>
  );
}
