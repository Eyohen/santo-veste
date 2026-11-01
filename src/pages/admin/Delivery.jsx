import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Truck } from 'lucide-react';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, Status, listOf, money } from './ui';

const DEFAULT_ZONES = ['South-West', 'South-East', 'South-South', 'North-Central', 'North-East', 'North-West'];

export default function Delivery() {
  const f = useFetch('/admin/delivery-fees');
  const [mutate, saving] = useMutation();
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState('All');
  const [editing, setEditing] = useState(null);
  const rows = listOf(f.data, 'deliveryFees', 'fees');
  const zones = [...new Set([...DEFAULT_ZONES, ...rows.map((r) => r.zone).filter(Boolean)])];
  const shown = rows.filter((r) => (zone === 'All' || r.zone === zone) && r.state.toLowerCase().includes(query.toLowerCase()));

  const save = async (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = { state: d.get('state').trim(), zone: d.get('zone'), fee: Number(d.get('fee')), estimate: d.get('estimate').trim(), isActive: d.get('isActive') === 'on' };
    const res = await mutate(editing.id ? `/admin/delivery-fees/${editing.id}` : '/admin/delivery-fees', { method: editing.id ? 'PUT' : 'POST', body }, `Delivery rate ${editing.id ? 'updated' : 'created'}`);
    if (res) { setEditing(null); f.reload(); }
  };
  const remove = async (r) => { if (!window.confirm(`Remove the delivery rate for ${r.state}?`)) return; const res = await mutate(`/admin/delivery-fees/${r.id}`, { method: 'DELETE' }, `${r.state} removed`); if (res) f.reload(); };

  return <>
    <div className="delivery-note"><div><Truck size={22}/></div><p><b>Nationwide delivery</b><span>Update rates here and the storefront will use them at checkout. Paused states cannot be selected at checkout.</span></p><strong>{rows.length} states configured</strong></div>
    <article className="panel table-panel">
      <div className="filterbar"><div className="filter-pair"><div className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search state…"/></div>
        <select value={zone} onChange={(e) => setZone(e.target.value)}><option>All</option>{zones.map((z) => <option key={z}>{z}</option>)}</select></div>
        <button className="primary-btn" onClick={() => setEditing({})}><Plus size={16}/> Add delivery rate</button></div>
      <Gate f={f} isEmpty={shown.length === 0} empty={rows.length ? 'No states match your filters.' : 'No delivery rates yet.'}>
        <div className="table-scroll"><table><thead><tr><th>State</th><th>Region</th><th>Delivery fee</th><th>Est. delivery</th><th>Status</th><th/></tr></thead><tbody>
          {shown.map((r) => <tr key={r.id}><td><b>{r.state}</b></td><td>{r.zone}</td><td><b>{money(r.fee)}</b></td><td>{r.estimate}</td><td><Status value={r.isActive === false ? 'Paused' : 'Active'}/></td>
            <td><div className="row-actions"><button aria-label={`Edit ${r.state}`} onClick={() => setEditing(r)}><Pencil size={15}/></button><button className="danger" aria-label={`Remove ${r.state}`} disabled={saving} onClick={() => remove(r)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
        <div className="table-foot"><span>Showing {shown.length} of {rows.length} records</span></div>
      </Gate>
    </article>
    {editing && <Modal title={editing.id ? 'Edit delivery rate' : 'Add delivery rate'} onClose={() => setEditing(null)}><form onSubmit={save} className="admin-form">
      <label>State<input required name="state" defaultValue={editing.state}/></label>
      <label>Region<select required name="zone" defaultValue={editing.zone || zones[0]}>{zones.map((z) => <option key={z}>{z}</option>)}</select></label>
      <div className="form-row"><label>Delivery fee (₦)<input required name="fee" type="number" min="0" defaultValue={editing.fee}/></label><label>Estimate<input required name="estimate" defaultValue={editing.estimate || '3–5 days'}/></label></div>
      <label className="check"><input type="checkbox" name="isActive" defaultChecked={editing.isActive !== false}/> Active</label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save rate'}</button></div>
    </form></Modal>}
  </>;
}
