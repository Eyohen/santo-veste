import { useEffect, useState } from 'react';
import { CreditCard, Download, Search } from 'lucide-react';
import { useFetch } from './useAdminData';
import { Gate, Pager, Status, downloadCsv, fmtDate, listOf, money } from './ui';

const LABEL = { success: 'Successful', failed: 'Failed', abandoned: 'Abandoned', refunded: 'Refunded', pending: 'Pending' };
const labelOf = (k) => LABEL[k] || k.replace(/^./, (c) => c.toUpperCase());
// The API doesn't document the transaction row shape; read it defensively.
const ref = (t) => t.reference || t.paymentReference || t.ref || '';
const orderNo = (t) => t.orderNumber || t.order?.orderNumber || '';
const customer = (t) => t.customerName || t.order?.customerName || t.email || t.order?.email || '';
const when = (t) => t.paidAt || t.createdAt || t.date;

export default function Transactions() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [keys, setKeys] = useState([]);
  useEffect(() => setPage(1), [status]);
  const f = useFetch('/admin/transactions', { status, page });
  const summary = f.data?.summary;
  useEffect(() => { if (summary) setKeys((k) => [...new Set([...k, ...Object.keys(summary)])]); }, [summary]);
  const rows = listOf(f.data, 'transactions');
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((t) => `${ref(t)} ${orderNo(t)} ${customer(t)}`.toLowerCase().includes(q)) : rows;
  const tiles = summary ? Object.entries(summary) : [];

  const exportCsv = () => downloadCsv('transactions.csv', ['Reference', 'Order', 'Customer', 'Channel', 'Date', 'Amount', 'Status'],
    shown.map((t) => [ref(t), orderNo(t), customer(t), t.channel, when(t), t.amount, t.status]));

  return <>
    {tiles.length > 0 && <div className="mini-stats auto">{tiles.map(([k, v]) => <div key={k}><span>{labelOf(k)}</span><b>{money(v?.amount)}</b><small>{v?.count || 0} {v?.count === 1 ? 'transaction' : 'transactions'}</small></div>)}</div>}
    <article className="panel table-panel">
      <div className="filterbar"><div className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference or customer (this page)…"/></div>
        {keys.length > 0 && <div className="tabs"><button className={status === '' ? 'active' : ''} onClick={() => setStatus('')}>All</button>{keys.map((k) => <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>{labelOf(k)}</button>)}</div>}
        <button className="secondary-btn" onClick={exportCsv} disabled={!shown.length}><Download size={16}/> Download CSV</button></div>
      <Gate f={f} isEmpty={shown.length === 0} empty={q ? 'No transactions match your search.' : 'No transactions yet.'}>
        <div className="table-scroll"><table><thead><tr><th>Reference</th><th>Order</th><th>Customer</th><th>Channel</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {shown.map((t, i) => <tr key={ref(t) || i}><td><b>{ref(t) || '—'}</b></td><td>{orderNo(t) || '—'}</td><td>{customer(t) || '—'}</td><td><span className="channel"><CreditCard size={14}/>{t.channel || '—'}</span></td><td>{fmtDate(when(t))}</td><td><b>{money(t.amount)}</b></td><td><Status value={t.status || '—'}/></td></tr>)}
        </tbody></table></div>
        <Pager page={f.data?.page || page} pages={f.data?.pages} total={f.data?.total} count={shown.length} onPage={setPage}/>
      </Gate>
    </article>
  </>;
}
