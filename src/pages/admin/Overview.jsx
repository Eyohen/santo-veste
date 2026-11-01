import { AlertTriangle, BarChart3, ChevronRight, CircleDollarSign, MailQuestion, PackageX, ShoppingBag, Users } from 'lucide-react';
import { ErrorBox, Loading, PanelHead, Status, fmtDate, initials, money } from './ui';

const STATUS_COLORS = { delivered: '#d4a84a', processing: '#24231f', shipped: '#46647c', pending: '#c9bda7', cancelled: '#b9594a', refunded: '#8a8378' };

const compact = (n) => {
  if (n >= 1e6) return `₦${+(n / 1e6).toFixed(1)}m`;
  if (n >= 1e3) return `₦${+(n / 1e3).toFixed(1)}k`;
  return `₦${Math.round(n)}`;
};

/** Smallest "nice" step (1/2/5 x 10^k) that is >= raw. */
const niceStep = (raw) => {
  if (raw <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
};

function SalesChart({ months }) {
  if (!months.length) return <div className="chart-empty">No sales recorded yet.</div>;
  const max = Math.max(...months.map((m) => m.revenue), 0);
  const step = niceStep(max / 3);
  const top = step * 3;
  const n = months.length;
  const pts = months.map((m, i) => [n === 1 ? 350 : (i / (n - 1)) * 700, 212 - (m.revenue / top) * 204 + 8]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  if (n === 1) d += ' L700 ' + pts[0][1];
  for (let i = 1; i < n; i++) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; const cx = (x0 + x1) / 2;
    d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  const area = `${d} L${n === 1 ? 700 : 700} 220 L${n === 1 ? 350 : 0} 220Z`;
  return <div className="chart-wrap">
    <div className="y-labels">{[3, 2, 1, 0].map((k) => <span key={k}>{compact(step * k)}</span>)}</div>
    <div className="chart">
      <div className="chart-lines"><i/><i/><i/><i/></div>
      <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label={`Revenue by month, ${months[0].label} to ${months[n - 1].label}`}>
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4a84a" stopOpacity=".28"/><stop offset="100%" stopColor="#d4a84a" stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill="url(#chartFill)"/>
        <path d={d} fill="none" stroke="#bd8b27" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
      </svg>
      <div className="x-labels">{months.map((m, i) => <span key={m.label} title={`${money(m.revenue)} · ${m.orders} orders`} style={{ left: `${n === 1 ? 50 : (i / (n - 1)) * 100}%` }}>{m.label}</span>)}</div>
    </div>
  </div>;
}

function Donut({ entries, total, gross }) {
  let acc = 0;
  const stops = total > 0 ? entries.map(([s, c]) => { const from = acc; acc += (c / total) * 100; return `${STATUS_COLORS[s] || '#999'} ${from}% ${acc}%`; }).join(',') : '#e4e0d6 0 100%';
  return <div className="donut" style={{ background: `conic-gradient(${stops})` }}><div><strong>{compact(gross)}</strong><span>Gross sales</span></div></div>;
}

export default function Overview({ stats, go }) {
  if (stats.loading && !stats.data) return <Loading text="Loading overview…"/>;
  if (!stats.data) return <ErrorBox message={stats.error} onRetry={stats.reload}/>;
  const s = stats.data;
  const cards = [
    { label: 'Gross sales', value: money(s.grossSales), note: 'from paid orders', icon: CircleDollarSign },
    { label: 'Paid orders', value: Number(s.paidOrders || 0).toLocaleString('en-NG'), note: `${s.awaitingFulfilment || 0} awaiting fulfilment`, icon: ShoppingBag },
    { label: 'Customers', value: Number(s.customers || 0).toLocaleString('en-NG'), note: 'registered and guest', icon: Users },
    { label: 'Avg. order value', value: money(Math.round(s.averageOrderValue || 0)), note: 'per paid order', icon: BarChart3 },
  ];
  const raw = s.ordersByStatus || {};
  const entries = (Array.isArray(raw) ? raw.map((r) => [r.status, r.count ?? r.total ?? 0]) : Object.entries(raw)).filter(([, c]) => c > 0);
  const totalOrders = entries.reduce((n, [, c]) => n + c, 0);
  const months = (s.revenueByMonth || []).map((m) => ({ label: m.label, revenue: Number(m.revenue) || 0, orders: m.orders || 0 }));
  const recent = (s.recentOrders || []).slice(0, 5);
  const flagged = Array.isArray(s.flaggedOrders) ? s.flaggedOrders : [];
  const flaggedCount = Array.isArray(s.flaggedOrders) ? s.flaggedOrders.length : Number(s.flaggedOrders || 0);
  const low = s.lowStock || [];
  const newReqs = Number(s.newCustomRequests || 0);

  return <>
    {stats.error && <div className="inline-error">Could not refresh: {stats.error}</div>}
    <div className="metric-grid">{cards.map(({ label, value, note, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><i><Icon size={18}/></i></div><strong>{value}</strong><p><span className="plain">{note}</span></p></article>)}</div>
    <div className="callouts">
      <button type="button" className={`callout ${flaggedCount ? 'warn' : ''}`} onClick={() => go('orders')}><AlertTriangle size={18}/><span><b>{flaggedCount} {flaggedCount === 1 ? 'order needs' : 'orders need'} action</b><small>{flaggedCount ? (flagged[0] ? `${flagged[0].orderNumber || ''} — ${String(flagged[0].adminNote || 'Review the order note').slice(0, 70)}` : 'Paid but short on stock, or amount mismatch') : 'Nothing flagged right now'}</small></span><ChevronRight size={16}/></button>
      <button type="button" className={`callout ${newReqs ? 'info' : ''}`} onClick={() => go('custom')}><MailQuestion size={18}/><span><b>{newReqs} new custom {newReqs === 1 ? 'request' : 'requests'}</b><small>Bulk and custom quote enquiries</small></span><ChevronRight size={16}/></button>
      <div className={`callout static ${low.length ? 'warn' : ''}`}><PackageX size={18}/><span><b>{low.length} low-stock {low.length === 1 ? 'variant' : 'variants'}</b>
        <small>{low.length ? low.slice(0, 3).map((v) => `${v.product} ${v.color}/${v.size} (${v.stock})`).join(' · ') + (low.length > 3 ? ` · +${low.length - 3} more` : '') : 'Stock levels look healthy'}</small></span></div>
    </div>
    <div className="dashboard-grid">
      <article className="panel sales-panel"><PanelHead title="Sales performance" sub={months.length ? `Revenue over the last ${months.length} ${months.length === 1 ? 'month' : 'months'}` : 'Revenue by month'}/><SalesChart months={months}/></article>
      <article className="panel order-summary"><PanelHead title="Order status" sub={`${totalOrders} total orders`}/><Donut entries={entries} total={totalOrders} gross={Number(s.grossSales) || 0}/>
        <div className="donut-legend">{entries.length ? entries.map(([st, c]) => <span key={st}><i style={{ background: STATUS_COLORS[st] || '#999' }}/>{st.replace(/^./, (x) => x.toUpperCase())} <b>{c}</b></span>) : <span>No orders yet</span>}</div></article>
    </div>
    <article className="panel table-panel"><PanelHead title="Recent orders" sub="Latest activity from your store"><button className="text-btn" onClick={() => go('orders')}>View all <ChevronRight size={15}/></button></PanelHead>
      <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{recent.map((o) => <tr key={o.id || o.orderNumber}><td><b>{o.orderNumber}</b></td><td><div className="customer-cell"><i>{initials(o.customerName)}</i><span>{o.customerName || o.email}</span></div></td><td>{fmtDate(o.createdAt)}</td><td><b>{money(o.total)}</b></td><td><Status value={o.status}/></td></tr>)}</tbody></table>
        {recent.length === 0 && <div className="empty"><p>No orders yet.</p></div>}</div></article>
  </>;
}
