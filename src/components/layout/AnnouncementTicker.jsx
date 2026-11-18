import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { BRAND } from '../../lib/brand';

const FALLBACK = [{ id: 'default', text: `Custom and bulk orders from ${BRAND.moq} pieces. Request a quote`, link: '/custom' }];

function Item({ a }) {
  const external = /^https?:\/\//.test(a.link || '');
  if (!a.link) return <span>{a.text}</span>;
  return external
    ? <a href={a.link} target="_blank" rel="noreferrer" className="hover:underline">{a.text}</a>
    : <Link to={a.link} className="hover:underline">{a.text}</Link>;
}

/** Thin black bar whose messages (managed in Admin > Announcements) scroll endlessly right to left. */
export default function AnnouncementTicker() {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    let live = true;
    api('/announcements', { token: null }).then((res) => {
      if (live && res.announcements?.length) setItems(res.announcements);
    }, () => {});
    return () => { live = false; };
  }, []);

  // Repeat the set enough times that one half of the track is always wider than the screen,
  // even for a single short message; the track then slides by exactly one half, so the loop is seamless.
  const reps = Math.max(2, Math.ceil(8 / items.length));
  const half = Array.from({ length: reps }, (_, r) => items.map((a) => ({ a, key: `${r}-${a.id}` }))).flat();
  const seconds = Math.max(20, half.reduce((n, { a }) => n + a.text.length + 12, 0) * 0.25);

  const group = (hidden) => (
    <div className="ticker-group" aria-hidden={hidden || undefined}>
      {half.map(({ a, key }) => (
        <span key={key} className="ticker-item"><Item a={a} /><i className="ticker-dot" /></span>
      ))}
    </div>
  );

  return (
    <div className="ticker bg-asphalt py-2 text-xs font-medium text-paper" role="region" aria-label="Announcements">
      <div className="ticker-track" style={{ '--ticker-time': `${seconds}s` }}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
