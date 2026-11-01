import { useState } from 'react';
import { Copy, Gift, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, fmtDay, listOf, money } from './ui';

const blank = { name: '', code: '', type: 'percentage', value: '', minSubtotal: '', usageLimit: '', expiresAt: '', isActive: true };
const toBody = (p, over = {}) => ({
  code: p.code, name: p.name, type: p.type, value: Number(p.value), isActive: p.isActive,
  ...(p.minSubtotal !== '' && p.minSubtotal != null && { minSubtotal: Number(p.minSubtotal) }),
  ...(p.usageLimit !== '' && p.usageLimit != null && { usageLimit: Number(p.usageLimit) }),
  ...(p.expiresAt && { expiresAt: p.expiresAt.length === 10 ? `${p.expiresAt}T23:59:59.000Z` : p.expiresAt }),
  ...over,
});

export default function Discounts() {
  const f = useFetch('/admin/discounts');
  const [mutate, saving] = useMutation();
  const [form, setForm] = useState(null); // null = closed; object = open (id present when editing)
  const promos = listOf(f.data, 'discounts');
  const set = (patch) => setForm((s) => ({ ...s, ...patch }));
  const generate = () => set({ code: `SANTO${Math.random().toString(36).slice(2, 6).toUpperCase()}` });

  const submit = async (e) => {
    e.preventDefault();
    const body = toBody(form);
    if (form.type === 'percentage' && (body.value < 1 || body.value > 100)) { toast.error('A percentage discount must be between 1 and 100.'); return; }
    const res = await mutate(form.id ? `/admin/discounts/${form.id}` : '/admin/discounts', { method: form.id ? 'PUT' : 'POST', body }, form.id ? 'Promo code updated' : 'Promo code created');
    if (res) { setForm(null); f.reload(); }
  };
  const toggle = async (p) => { const res = await mutate(`/admin/discounts/${p.id}`, { method: 'PUT', body: toBody({ ...p, expiresAt: p.expiresAt || '' }, { isActive: !p.isActive }) }, `${p.code} ${p.isActive ? 'paused' : 'activated'}`); if (res) f.reload(); };
  const remove = async (p) => { if (!window.confirm(`Delete promo code ${p.code}?`)) return; const res = await mutate(`/admin/discounts/${p.id}`, { method: 'DELETE' }, 'Promo code deleted'); if (res) f.reload(); };
  const edit = (p) => setForm({ ...blank, ...p, minSubtotal: p.minSubtotal ?? '', usageLimit: p.usageLimit ?? '', expiresAt: p.expiresAt ? String(p.expiresAt).slice(0, 10) : '' });

  return <>
    <article className="panel table-panel page-panel">
      <div className="filterbar"><div className="summary-inline"><div><Gift size={20}/></div><span><b>{promos.filter((p) => p.isActive).length} active promotions</b><small>{promos.reduce((n, p) => n + (p.usedCount || 0), 0)} total redemptions</small></span></div>
        <button className="primary-btn" onClick={() => setForm({ ...blank })}><Plus size={16}/> Create promo code</button></div>
      <Gate f={f} isEmpty={promos.length === 0} empty="No promo codes yet.">
        <div className="table-scroll"><table><thead><tr><th>Promotion</th><th>Code</th><th>Discount</th><th>Usage</th><th>Expiry</th><th>Status</th><th/></tr></thead><tbody>
          {promos.map((p) => <tr key={p.id}>
            <td><b>{p.name}</b>{p.minSubtotal > 0 && <small className="sub">Min. spend {money(p.minSubtotal)}</small>}</td>
            <td><button className="code-pill" onClick={() => { navigator.clipboard?.writeText(p.code); toast.success('Code copied'); }}>{p.code}<Copy size={13}/></button></td>
            <td>{p.type === 'percentage' ? `${p.value}% off` : `${money(p.value)} off`}</td>
            <td><div className="usage">{p.usageLimit ? <span><i style={{ width: `${Math.min(100, ((p.usedCount || 0) / p.usageLimit) * 100)}%` }}/></span> : null}<small>{p.usedCount || 0} / {p.usageLimit || '∞'}</small></div></td>
            <td>{p.expiresAt ? fmtDay(p.expiresAt) : 'No expiry'}</td>
            <td><button className={`toggle ${p.isActive ? 'on' : ''}`} aria-label={`Toggle ${p.code}`} disabled={saving} onClick={() => toggle(p)}><i/></button></td>
            <td><div className="row-actions"><button aria-label="Edit" onClick={() => edit(p)}><Pencil size={15}/></button><button className="danger" aria-label="Delete" disabled={saving} onClick={() => remove(p)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
      </Gate>
    </article>
    {form && <Modal title={form.id ? 'Edit promo code' : 'Create promo code'} onClose={() => setForm(null)}><form onSubmit={submit} className="admin-form">
      <label>Promotion name<input required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Holiday offer"/></label>
      <label>Promo code<div className="code-input"><input required value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="SANTO20"/><button type="button" onClick={generate}>Generate</button></div></label>
      <div className="form-row"><label>Discount type<select value={form.type} onChange={(e) => set({ type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></label>
        <label>Value<input required min="1" type="number" value={form.value} onChange={(e) => set({ value: e.target.value })} placeholder={form.type === 'percentage' ? '20' : '5000'}/></label></div>
      <div className="form-row"><label>Maximum uses (blank = unlimited)<input min="1" type="number" value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })}/></label>
        <label>Minimum spend (₦, optional)<input min="0" type="number" value={form.minSubtotal} onChange={(e) => set({ minSubtotal: e.target.value })}/></label></div>
      <label>Expires on (optional)<input type="date" value={form.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })}/></label>
      <label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })}/> Active</label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setForm(null)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save changes' : 'Create promotion'}</button></div>
    </form></Modal>}
  </>;
}
