import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounced, useFetch, useMutation } from './useAdminData';
import { Drawer, Gate, Pager, Status, downloadCsv, fmtDate, imgSrc, initials, money } from './ui';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const TABS = [['All', ''], ...STATUSES.map((s) => [s[0].toUpperCase() + s.slice(1), s]), ['Unpaid', 'unpaid']];
const LIMIT = 15;
const idOf = (o) => o.id ?? o.orderNumber;
const isFlagged = (note) => /^(PAID BUT SHORT|Amount mismatch)/i.test(note || '');
const itemSummary = (o) => {
  if (!o.items?.length) return o.itemCount ? `${o.itemCount} items` : '—';
  const first = o.items[0];
  return `${first.name} × ${first.quantity}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}`;
};

export default function Orders({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const q = useDebounced(query);
  useEffect(() => setPage(1), [q, tab]);
  const f = useFetch('/admin/orders', { q, page, limit: LIMIT, ...(tab === 'unpaid' ? { paymentStatus: 'unpaid' } : { status: tab }) });
  const [mutate] = useMutation();
  const orders = f.data?.orders || [];

  const patchLocal = (order) => f.setData((d) => d && { ...d, orders: d.orders.map((o) => (idOf(o) === idOf(order) ? { ...o, ...order } : o)) });
  const changeStatus = async (o, status) => {
    const res = await mutate(`/admin/orders/${idOf(o)}`, { method: 'PATCH', body: { status } }, `${o.orderNumber} moved to ${status}`);
    if (res?.order) patchLocal(res.order); else f.reload();
  };
  const exportCsv = () => downloadCsv('orders.csv', ['Order', 'Customer', 'Email', 'Phone', 'Date', 'Total', 'Status', 'Payment', 'Tracking'],
    orders.map((o) => [o.orderNumber, o.customerName, o.email, o.phone, o.createdAt, o.total, o.status, o.paymentStatus, o.trackingNumber]));

  return <>
    <article className="panel table-panel page-panel">
      <div className="filterbar"><div className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order number, name or email…"/></div>
        <div className="tabs">{TABS.map(([label, v]) => <button className={tab === v ? 'active' : ''} onClick={() => setTab(v)} key={label}>{label}</button>)}</div>
        <button className="secondary-btn" onClick={exportCsv} disabled={!orders.length}><Download size={16}/> CSV</button></div>
      <Gate f={f} isEmpty={orders.length === 0} empty={q || tab ? 'No orders match your filters.' : 'No orders yet.'}>
        <div className="table-scroll"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th/></tr></thead><tbody>
          {orders.map((o) => <tr key={idOf(o)}>
            <td><b>{o.orderNumber}</b>{isFlagged(o.adminNote) && <span className="flag-dot" title={o.adminNote}><AlertTriangle size={12}/></span>}</td>
            <td><div className="customer-cell"><i>{initials(o.customerName)}</i><span>{o.customerName || o.email}</span></div></td>
            <td>{itemSummary(o)}</td><td>{fmtDate(o.createdAt)}</td><td><b>{money(o.total)}</b></td><td><Status value={o.paymentStatus || '—'}/></td>
            <td><select className={`status ${o.status}`} value={o.status} onChange={(e) => changeStatus(o, e.target.value)} aria-label={`Status of ${o.orderNumber}`}>{STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></td>
            <td><button className="row-menu" aria-label={`View ${o.orderNumber}`} onClick={() => setOpenId(idOf(o))}><Eye size={18}/></button></td></tr>)}
        </tbody></table></div>
        <Pager page={f.data?.page || page} pages={f.data?.pages} total={f.data?.total} count={orders.length} onPage={setPage}/>
      </Gate>
    </article>
    {openId && <OrderDrawer id={openId} onClose={() => setOpenId(null)} onSaved={(order) => { patchLocal(order); }}/>}
  </>;
}

function OrderDrawer({ id, onClose, onSaved }) {
  const f = useFetch(`/admin/orders/${id}`);
  const [tracking, setTracking] = useState('');
  const [loadedFor, setLoadedFor] = useState(null);
  const [mutate, saving] = useMutation();
  const o = f.data?.order;
  if (o && loadedFor !== o.orderNumber) { setLoadedFor(o.orderNumber); setTracking(o.trackingNumber || ''); }

  const save = async () => {
    const res = await mutate(`/admin/orders/${id}`, { method: 'PATCH', body: { trackingNumber: tracking.trim() } }, 'Tracking number saved');
    if (res?.order) { f.setData(() => res); onSaved(res.order); } else if (res) toast('Saved');
  };
  const addr = o?.shipping || {};
  return <Drawer title={o ? o.orderNumber : 'Order'} sub="Order details" onClose={onClose}>
    <Gate f={f} isEmpty={!o} empty="Order not found.">
      {o && <>
        <div className="detail-top"><Status value={o.status}/><Status value={o.paymentStatus || '—'}/><small>{fmtDate(o.createdAt)}</small></div>
        {o.adminNote && <div className={`note-box ${isFlagged(o.adminNote) ? 'warn' : ''}`}>{isFlagged(o.adminNote) && <AlertTriangle size={16}/>}<div><b>{isFlagged(o.adminNote) ? 'Needs your attention' : 'Admin note'}</b><p>{o.adminNote}</p></div></div>}
        <section className="detail-block"><h3>Items</h3>
          {(o.items || []).map((it) => <div className="detail-item" key={it.sku}>
            {it.image ? <img src={imgSrc(it.image)} alt=""/> : <span className="img-ph"/>}
            <div><b>{it.name}</b><small>{it.color} · {it.size} · {it.sku}</small></div><span>{it.quantity} × {money(it.unitPrice)}</span><b>{money(it.lineTotal)}</b></div>)}
          <dl className="totals"><div><dt>Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
            {o.discountAmount > 0 && <div><dt>Discount{o.discountCode ? ` (${o.discountCode})` : ''}</dt><dd>-{money(o.discountAmount)}</dd></div>}
            <div><dt>Shipping</dt><dd>{money(o.shippingFee)}</dd></div><div className="grand"><dt>Total</dt><dd>{money(o.total)}</dd></div></dl></section>
        <section className="detail-block"><h3>Customer</h3><p className="detail-lines"><b>{o.customerName}</b><span>{o.email}</span><span>{o.phone || 'No phone'}</span><span>{[addr.address, addr.city, addr.state].filter(Boolean).join(', ') || 'No address'}</span></p></section>
        <section className="detail-block"><h3>Payment</h3><p className="detail-lines"><span>Reference: <b>{o.paymentReference || '—'}</b></span>{o.paymentChannel && <span>Channel: <b>{o.paymentChannel}</b></span>}<span>Status: <b>{o.paymentStatus || '—'}</b></span></p></section>
        <section className="detail-block"><h3>Shipping</h3>
          <div className="admin-form"><label>Tracking number<input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. DHL-123456789"/></label></div>
          <div className="modal-actions"><button className="primary-btn" onClick={save} disabled={saving || tracking.trim() === (o.trackingNumber || '')}>{saving ? 'Saving…' : 'Save tracking'}</button></div></section>
      </>}
    </Gate>
  </Drawer>;
}
