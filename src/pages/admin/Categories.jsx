import { useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, listOf } from './ui';

export default function Categories() {
  const f = useFetch('/admin/categories');
  const [mutate, saving] = useMutation();
  const [editing, setEditing] = useState(null);
  const rows = listOf(f.data, 'categories');

  const save = async (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const body = { name: d.get('name').trim(), sortOrder: Number(d.get('sortOrder') || 0) };
    const res = await mutate(editing.id ? `/admin/categories/${editing.id}` : '/admin/categories', { method: editing.id ? 'PUT' : 'POST', body }, `Category ${editing.id ? 'updated' : 'created'}`);
    if (res) { setEditing(null); f.reload(); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete the ${r.name} category?`)) return;
    const res = await mutate(`/admin/categories/${r.id}`, { method: 'DELETE' }, `${r.name} deleted`);
    if (res) f.reload();
  };

  return <>
    <div className="delivery-note"><div><Tags size={22}/></div><p><b>Product categories</b><span>Categories appear in the product form and in the storefront menu, footer and the Shop by family section. A category can only be deleted once it has no products.</span></p><strong>{rows.length} categories</strong></div>
    <article className="panel table-panel">
      <div className="filterbar"><div/><button className="primary-btn" onClick={() => setEditing({})}><Plus size={16}/> Add category</button></div>
      <Gate f={f} isEmpty={rows.length === 0} empty="No categories yet.">
        <div className="table-scroll"><table><thead><tr><th>Name</th><th>Link</th><th>Products</th><th>Order</th><th/></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}><td><b>{r.name}</b></td><td>/shop/{r.slug}</td><td>{r.productCount}</td><td>{r.sortOrder}</td>
            <td><div className="row-actions"><button aria-label={`Edit ${r.name}`} onClick={() => setEditing(r)}><Pencil size={15}/></button><button className="danger" aria-label={`Delete ${r.name}`} disabled={saving} onClick={() => remove(r)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
      </Gate>
    </article>
    {editing && <Modal title={editing.id ? 'Edit category' : 'Add category'} onClose={() => setEditing(null)}><form onSubmit={save} className="admin-form">
      <label>Name<input required name="name" maxLength={60} defaultValue={editing.name} placeholder="e.g. Hoodies" autoFocus/></label>
      <label>Order (lowest shows first)<input name="sortOrder" type="number" min="0" defaultValue={editing.sortOrder ?? rows.length}/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button className="primary-btn" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button></div>
    </form></Modal>}
  </>;
}
