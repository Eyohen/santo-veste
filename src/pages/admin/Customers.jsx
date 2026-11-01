import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useFetch } from './useAdminData';
import { Gate, downloadCsv, fmtMonth, initials, listOf, money } from './ui';

export default function Customers() {
  const f = useFetch('/admin/customers');
  const [query, setQuery] = useState('');
  const list = listOf(f.data, 'customers');
  const q = query.trim().toLowerCase();
  const shown = q ? list.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q)) : list;
  const exportCsv = () => downloadCsv('customers.csv', ['Name', 'Email', 'Phone', 'Orders', 'Total spent', 'Since'], shown.map((c) => [c.name, c.email, c.phone, c.orders, c.spent, c.since]));
  return <article className="panel table-panel page-panel">
    <div className="filterbar"><div className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…"/></div>
      <button className="secondary-btn" onClick={exportCsv} disabled={!shown.length}><Download size={16}/> CSV</button></div>
    <Gate f={f} isEmpty={shown.length === 0} empty={q ? 'No customers match your search.' : 'No customers yet.'}>
      <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total spent</th><th>Since</th></tr></thead><tbody>
        {shown.map((c) => <tr key={c.email}><td><div className="customer-cell"><i>{initials(c.name)}</i><b>{c.name || '—'}</b></div></td><td>{c.email}</td><td>{c.phone || '—'}</td><td>{c.orders}</td><td><b>{money(c.spent)}</b></td><td>{fmtMonth(c.since)}</td></tr>)}
      </tbody></table></div>
      <div className="table-foot"><span>Showing {shown.length} of {list.length} customers</span></div>
    </Gate>
  </article>;
}
