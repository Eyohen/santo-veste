import { useState } from 'react';
import { ImagePlus, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { upload } from '../../api/client';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, Status, imgSrc, listOf } from './ui';

export default function HeroImages() {
  const f = useFetch('/admin/hero-slides');
  const [mutate, saving] = useMutation();
  const [editing, setEditing] = useState(null);
  const rows = listOf(f.data, 'slides');

  const remove = async (r) => {
    if (!window.confirm('Remove this hero image? It will no longer show on the landing page.')) return;
    const res = await mutate(`/admin/hero-slides/${r.id}`, { method: 'DELETE' }, 'Hero image removed');
    if (res) f.reload();
  };

  return <>
    <div className="delivery-note"><div><Images size={22}/></div><p><b>Landing page hero</b><span>These photographs cycle in the hero section at the top of the home page, in the order shown (lowest order number first). If every image is removed or paused, the original photos are shown instead.</span></p><strong>{rows.filter((r) => r.isActive).length} live</strong></div>
    <article className="panel table-panel">
      <div className="filterbar"><div/><button className="primary-btn" onClick={() => setEditing({})}><Plus size={16}/> Add hero image</button></div>
      <Gate f={f} isEmpty={rows.length === 0} empty="No hero images yet. The original photos are showing.">
        <div className="table-scroll"><table><thead><tr><th>Image</th><th>Description</th><th>Order</th><th>Status</th><th/></tr></thead><tbody>
          {rows.map((r) => <tr key={r.id}>
            <td><div className="product-cell"><img src={imgSrc(r.imageUrl)} alt="" style={{ width: 96, height: 60, objectFit: 'cover', objectPosition: `${r.focusX}% ${r.focusY}%` }}/></div></td>
            <td>{r.alt || <small>No description</small>}</td><td>{r.sortOrder}</td><td><Status value={r.isActive ? 'Active' : 'Paused'}/></td>
            <td><div className="row-actions"><button aria-label="Edit hero image" onClick={() => setEditing(r)}><Pencil size={15}/></button><button className="danger" aria-label="Remove hero image" disabled={saving} onClick={() => remove(r)}><Trash2 size={15}/></button></div></td></tr>)}
        </tbody></table></div>
      </Gate>
    </article>
    {editing && <SlideModal slide={editing} nextOrder={rows.length} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); f.reload(); }}/>}
  </>;
}

function SlideModal({ slide, nextOrder, onClose, onSaved }) {
  const [form, setForm] = useState({
    imageUrl: slide.imageUrl || '', alt: slide.alt || '', focusX: slide.focusX ?? 50, focusY: slide.focusY ?? 30,
    sortOrder: slide.sortOrder ?? nextOrder, isActive: slide.isActive !== false,
  });
  const [uploading, setUploading] = useState(false);
  const [mutate, saving] = useMutation();
  const set = (p) => setForm((s) => ({ ...s, ...p }));

  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('That image is larger than 5 MB.'); return; }
    setUploading(true);
    try { const { url } = await upload('/admin/uploads', file); set({ imageUrl: url }); } catch (err) { toast.error(err.message); }
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) { toast.error('Upload an image first.'); return; }
    const body = { ...form, focusX: Number(form.focusX), focusY: Number(form.focusY), sortOrder: Number(form.sortOrder || 0) };
    const res = await mutate(slide.id ? `/admin/hero-slides/${slide.id}` : '/admin/hero-slides', { method: slide.id ? 'PUT' : 'POST', body }, `Hero image ${slide.id ? 'updated' : 'added'}`);
    if (res) onSaved();
  };

  return <Modal title={slide.id ? 'Edit hero image' : 'Add hero image'} onClose={onClose} size="xl">
    <form onSubmit={submit} className="admin-form">
      <div className="field-group"><span className="group-label">Image <small>· wide, landscape photos work best (at least 1600px across)</small></span>
        <div className="img-grid">
          {form.imageUrl && <div className="img-tile" style={{ width: 260, height: 150 }}><img src={imgSrc(form.imageUrl)} alt="" style={{ objectFit: 'cover', objectPosition: `${form.focusX}% ${form.focusY}%` }}/></div>}
          <label className="img-add">{uploading ? <span>Uploading…</span> : <><ImagePlus size={22}/><span>{form.imageUrl ? 'Replace image' : 'Upload image'}</span></>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} disabled={uploading}/></label>
        </div>
        <p className="form-hint">PNG, JPG or WEBP, up to 5 MB. The preview shows the crop at a typical wide screen.</p></div>
      <label>Description (for screen readers)<input value={form.alt} maxLength={300} onChange={(e) => set({ alt: e.target.value })} placeholder="e.g. A man in a black tee on pale concrete steps"/></label>
      <div className="form-row">
        <label>Horizontal focus ({form.focusX}%)<input type="range" min="0" max="100" value={form.focusX} onChange={(e) => set({ focusX: e.target.value })}/></label>
        <label>Vertical focus ({form.focusY}%)<input type="range" min="0" max="100" value={form.focusY} onChange={(e) => set({ focusY: e.target.value })}/></label>
      </div>
      <p className="form-hint">Focus picks which part of the photo stays in view when it is cropped to fit different screens.</p>
      <div className="form-row">
        <label>Order (lowest shows first)<input type="number" min="0" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })}/></label>
        <div className="check-row"><label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })}/> Active (visible on the landing page)</label></div>
      </div>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save'}</button></div>
    </form>
  </Modal>;
}
