import { useState } from 'react';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, Status, listOf } from './ui';

export default function Announcements() {
  const f = useFetch('/admin/announcements');
  const [mutate, saving] = useMutation();
  const [editing, setEditing] = useState(null);
  const rows = listOf(f.data, 'announcements');

  const save = async (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = { text: d.get('text').trim(), link: d.get('link').trim(), sortOrder: Number(d.get('sortOrder') || 0), isActive: d.get('isActive') === 'on' };
    const res = await mutate(editing.id ? `/admin/announcements/${editing.id}` : '/admin/announcements', { method: editing.id ? 'PUT' : 'POST', body }, `Announcement ${editing.id ? 'updated' : 'added'}`);
    if (res) { setEditing(null); f.reload(); }
  };
  const remove = async (r) => { if (!window.confirm('Remove this announcement?')) return; const res = await mutate(`/admin/announcements/${r.id}`, { method: 'DELETE' }, 'Announcement removed'); if (res) f.reload(); };

  return <>
    <div className="delivery-note"><div><Megaphone size={22}/></div><p><b>Storefront ticker</b><span>Active messages scroll across the black bar at the top of the storefront, in the order shown here (lowest order number first). With no active messages, the default quote message is shown.</span></p><strong>{rows.filter((r) => r.isActive).length} live</strong></div>
    <article className="panel table-panel">
      <div className="filterbar"><div/><button className="primary-btn" onClick={() => setEditing({})}><Plus size={16}/> Add announcement</button></div>
      <Gate f={f} isEmpty={rows.length === 0} empty="No announcements yet. The default quote message is showing.">
        <div className="table-scroll"><table><thead><tr><th>Order</th><th>Message</th><th>Link</th><th>Status</th><th/></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><td>{r.sortOrder}</td><td><b>{r.text}</b></td><td>{r.link || '—'}</td><td><Status value={r.isActive ? 'Active' : 'Paused'}/></td>
            <td><div className="row-actions"><button aria-label="Edit announcement" onClick={() => setEditing(r)}><Pencil size={15}/></button><button className="danger" aria-label="Remove announcement" disabled={saving} onClick={() => remove(r)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
      </Gate>
    </article>
    {editing && <Modal title={editing.id ? 'Edit announcement' : 'Add announcement'} onClose={() => setEditing(null)}><form onSubmit={save} className="admin-form">
      <label>Message<input required name="text" maxLength={200} defaultValue={editing.text} placeholder="Free delivery on orders above ₦50,000"/></label>
      <label>Link (optional)<input name="link" defaultValue={editing.link || ''} placeholder="/custom or https://…"/></label>
      <label>Order<input name="sortOrder" type="number" min="0" defaultValue={editing.sortOrder ?? rows.length}/></label>
      <label className="check"><input type="checkbox" name="isActive" defaultChecked={editing.isActive !== false}/> Active</label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></div>
    </form></Modal>}
  </>;
}
