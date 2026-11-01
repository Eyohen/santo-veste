import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, fmtDate, listOf } from './ui';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'closed'];
const cap = (s) => s.replace(/^./, (c) => c.toUpperCase());
const cls = { new: 'pending', contacted: 'processing', quoted: 'shipped', won: 'delivered', closed: 'cancelled' };

export default function CustomRequests() {
  const f = useFetch('/admin/custom-requests');
  const [mutate, saving] = useMutation();
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const rows = listOf(f.data, 'customRequests', 'requests');

  const patch = async (r, body, msg) => {
    const res = await mutate(`/admin/custom-requests/${r.id}`, { method: 'PATCH', body }, msg);
    if (res) { f.reload(); return true; }
    return false;
  };
  const openRow = (r) => { setOpen(r); setNote(r.adminNote || ''); };

  return <>
    <article className="panel table-panel page-panel">
      <div className="filterbar"><div className="summary-inline"><div><MessageSquare size={20}/></div><span><b>{rows.filter((r) => r.status === 'new').length} new requests</b><small>{rows.length} in total · bulk and custom quote enquiries from the storefront</small></span></div></div>
      <Gate f={f} isEmpty={rows.length === 0} empty="No custom order requests yet.">
        <div className="table-scroll"><table><thead><tr><th>Name</th><th>Contact</th><th>Qty</th><th>Product</th><th>Message</th><th>Received</th><th>Status</th><th/></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}>
            <td><b>{r.name}</b></td><td><div className="stack"><span>{r.email}</span><small>{r.phone}</small></div></td><td>{r.quantity}</td><td>{r.product || '—'}</td>
            <td className="clamp" title={r.message}>{r.message || '—'}</td><td>{fmtDate(r.createdAt)}</td>
            <td><select className={`status ${cls[r.status] || ''}`} value={r.status} disabled={saving} onChange={(e) => patch(r, { status: e.target.value }, `Marked as ${e.target.value}`)} aria-label={`Status for ${r.name}`}>{STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select></td>
            <td><button className="text-btn" onClick={() => openRow(r)}>{r.adminNote ? 'Note' : 'Details'}</button></td></tr>)}
        </tbody></table></div>
      </Gate>
    </article>
    {open && <Modal title={`Request from ${open.name}`} onClose={() => setOpen(null)}><form className="admin-form" onSubmit={async (e) => { e.preventDefault(); if (await patch(open, { adminNote: note }, 'Note saved')) setOpen(null); }}>
      <p className="detail-lines"><span>{open.email} · {open.phone}</span><span>Quantity: <b>{open.quantity}</b>{open.product ? ` · ${open.product}` : ''}</span></p>
      <div className="note-box"><div><b>Message</b><p>{open.message || 'No message provided.'}</p></div></div>
      <label>Internal note<textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Quote sent, follow-up date, etc."/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setOpen(null)}>Close</button><button className="primary-btn" disabled={saving || note === (open.adminNote || '')}>{saving ? 'Saving…' : 'Save note'}</button></div>
    </form></Modal>}
  </>;
}
