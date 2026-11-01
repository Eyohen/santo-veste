import { ChevronLeft, ChevronRight, Grid2X2, Loader2, TriangleAlert, X } from 'lucide-react';

export const money = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};
export const fmtDay = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtMonth = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export const initials = (name = '') => (String(name).trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('') || '?').toUpperCase();

/** Seed images are relative (/products/x.webp, served by the storefront origin); uploads are absolute. Both work as-is. */
export const imgSrc = (src) => src || '';

/** The API wraps lists in a named key; accept the named key, a bare array, or the first array found. */
export const listOf = (res, ...keys) => {
  if (Array.isArray(res)) return res;
  if (!res) return [];
  for (const k of keys) if (Array.isArray(res[k])) return res[k];
  return Object.values(res).find(Array.isArray) || [];
};

export const categorySlug = (c) => (typeof c === 'string' ? c : c?.slug || '');

export function downloadCsv(filename, headers, rows) {
  const esc = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(["\ufeff", text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Modal({ title, onClose, children, size }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${size || ''}`}><div className="modal-head"><div><span>Santo Veste admin</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={20}/></button></div>{children}</div>
  </div>;
}

export function Drawer({ title, sub, onClose, children }) {
  return <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside className="drawer"><div className="modal-head"><div><span>{sub}</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={20}/></button></div><div className="drawer-body">{children}</div></aside>
  </div>;
}

export function PanelHead({ title, sub, children }) {
  return <div className="panel-head"><div><h2>{title}</h2><p>{sub}</p></div>{children}</div>;
}

const STATUS_LABEL = { success: 'Successful', failed: 'Failed', paid: 'Paid', unpaid: 'Unpaid' };
export function Status({ value }) {
  const label = STATUS_LABEL[String(value).toLowerCase()] || String(value).replace(/^./, (c) => c.toUpperCase());
  return <span className={`status ${label.toLowerCase().replace(/\s+/g, '-')}`}><i/>{label}</span>;
}

export function Empty({ text }) { return <div className="empty"><Grid2X2 size={25}/><p>{text}</p></div>; }
export function Loading({ text = 'Loading…' }) { return <div className="empty is-loading"><Loader2 size={25} className="spin"/><p>{text}</p></div>; }
export function ErrorBox({ message, onRetry }) {
  return <div className="empty is-error"><TriangleAlert size={25}/><p>{message || 'Something went wrong.'}</p>{onRetry && <button type="button" className="secondary-btn" onClick={onRetry}>Try again</button>}</div>;
}

/** Shows loading / error / empty states; otherwise renders children (dimmed while refetching). */
export function Gate({ f, isEmpty, empty, children }) {
  if (f.loading && !f.data) return <Loading/>;
  if (f.error && !f.data) return <ErrorBox message={f.error} onRetry={f.reload}/>;
  if (isEmpty) return f.error ? <ErrorBox message={f.error} onRetry={f.reload}/> : <Empty text={empty}/>;
  return <div className={f.loading ? 'is-refreshing' : ''}>{children}</div>;
}

export function Pager({ page, pages, total, count, onPage }) {
  return <div className="table-foot"><span>Showing {count}{total !== undefined ? ` of ${total}` : ''} records</span><div>
    <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></button>
    <button type="button" className="current">{page}</button><small className="page-of">of {Math.max(pages || 1, 1)}</small>
    <button type="button" disabled={page >= (pages || 1)} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16}/></button>
  </div></div>;
}

export function TableFoot({ count }) { return <div className="table-foot"><span>Showing {count} records</span></div>; }
