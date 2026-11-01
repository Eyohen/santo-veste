import { useState } from 'react';
import { Eye, ImagePlus, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { upload } from '../../api/client';
import { useFetch, useMutation } from './useAdminData';
import { Gate, Modal, Status, categorySlug, imgSrc, listOf, money } from './ui';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const key = (color, size) => `${color}|${size}`;
const totalStock = (p) => (p.variants || []).reduce((n, v) => n + Number(v.stock || 0), 0);
const cover = (p) => p.images?.[0] || Object.values(p.imagesByColor || {}).flat()[0] || '';

function initForm(p, categories) {
  const variants = p?.variants || [];
  const colours = []; const stock = {}; const skus = {};
  variants.forEach((v) => {
    if (!colours.some((c) => c.name === v.color)) colours.push({ name: v.color, hex: v.colorHex || '#171714' });
    stock[key(v.color, v.size)] = String(v.stock ?? 0);
    if (v.sku) skus[key(v.color, v.size)] = v.sku;
  });
  return {
    name: p?.name || '', category: categorySlug(p?.category) || categories[0]?.slug || '',
    price: p?.price ?? '', compareAtPrice: p?.compareAtPrice ?? '', description: p?.description || '',
    fabrics: p?.fabrics || '', features: p?.features || '', isNew: !!p?.isNew, isActive: p ? p.isActive !== false : true,
    images: [...(p?.images || [])], imagesByColor: { ...(p?.imagesByColor || {}) }, colours, stock, skus,
  };
}

export default function Products({ modalOpen, setModalOpen }) {
  const navigate = useNavigate();
  const f = useFetch('/admin/products');
  const cats = useFetch('/admin/categories');
  const [mutate] = useMutation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const products = listOf(f.data, 'products');
  const categories = listOf(cats.data, 'categories');
  const shown = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const closeModal = () => { setModalOpen(false); setEditing(null); };
  const edit = (p) => { setEditing(p); setMenuOpen(null); setModalOpen(true); };
  const view = (p) => {
    try { sessionStorage.setItem('sv-admin-view-product', JSON.stringify({ ...p, category: categorySlug(p.category), images: p.images?.length ? p.images : [cover(p)].filter(Boolean) })); } catch { /* storage unavailable */ }
    navigate(`/view-product?id=${encodeURIComponent(p.id)}`);
  };
  const remove = async (p) => {
    setMenuOpen(null);
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    const res = await mutate(`/admin/products/${p.id}`, { method: 'DELETE' }, `${p.name} deleted`);
    if (res) f.reload();
  };

  return <>
    <article className="panel table-panel page-panel">
      <div className="filterbar"><div className="search-field"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…"/></div>
        <button className="primary-btn" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16}/> Add product</button></div>
      <Gate f={f} isEmpty={shown.length === 0} empty={query ? 'No products match your search.' : 'No products yet. Add your first product.'}>
        <div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th>Status</th><th/></tr></thead><tbody>
          {shown.map((p) => { const stock = totalStock(p); const status = p.isActive === false ? 'Paused' : stock === 0 ? 'Out of stock' : stock < 20 ? 'Low stock' : 'Active';
            return <tr key={p.id}>
              <td><div className="product-cell">{cover(p) ? <img src={imgSrc(cover(p))} alt=""/> : <span className="img-ph tall"/>}<div><b>{p.name}</b><small>{(p.variants || []).length} variants</small></div></div></td>
              <td className="capitalize">{(typeof p.category === 'object' ? p.category?.name : null) || categories.find((c) => c.slug === p.category)?.name || String(p.category || '').replace('-', ' & ')}</td>
              <td><b>{money(p.price)}</b></td><td>{stock} in stock</td><td><Status value={status}/></td>
              <td className="actions-cell"><button className="row-menu" aria-label={`Actions for ${p.name}`} onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}><MoreHorizontal size={18}/></button>
                {menuOpen === p.id && <div className="product-menu"><button onClick={() => view(p)}><Eye size={15}/>View</button><button onClick={() => edit(p)}><Pencil size={15}/>Edit</button><button className="danger" onClick={() => remove(p)}><Trash2 size={15}/>Delete</button></div>}</td></tr>; })}
        </tbody></table></div>
        <div className="table-foot"><span>Showing {shown.length} of {products.length} products</span></div>
      </Gate>
    </article>
    {modalOpen && <ProductModal key={editing?.id || 'new'} product={editing} categories={categories} onClose={closeModal} onSaved={() => { closeModal(); f.reload(); }}/>}
  </>;
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => initForm(product, categories));
  const [colour, setColour] = useState({ name: '', hex: '#171714' });
  const [uploading, setUploading] = useState(false);
  const [mutate, saving] = useMutation();
  const set = (patch) => setForm((s) => ({ ...s, ...patch }));

  const addColour = () => {
    const name = colour.name.trim();
    if (!name) { toast.error('Give the colour a name.'); return; }
    if (form.colours.some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast.error('That colour is already added.'); return; }
    const stock = { ...form.stock }; SIZES.forEach((s) => { stock[key(name, s)] = '0'; });
    set({ colours: [...form.colours, { name, hex: colour.hex.toUpperCase() }], stock });
    setColour({ name: '', hex: colour.hex });
  };
  const removeColour = (name) => {
    const imagesByColor = { ...form.imagesByColor }; delete imagesByColor[name];
    set({ colours: form.colours.filter((c) => c.name !== name), imagesByColor });
  };
  const onFiles = async (e) => {
    const files = [...(e.target.files || [])]; e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is larger than 5 MB.`); continue; }
      try { const { url } = await upload('/admin/uploads', file); urls.push(url); } catch (err) { toast.error(`${file.name}: ${err.message}`); }
    }
    setForm((s) => ({ ...s, images: [...s.images, ...urls] }));
    setUploading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.colours.length) { toast.error('Add at least one colour.'); return; }
    if (!form.images.length) { toast.error('Upload at least one product image.'); return; }
    const variants = form.colours.flatMap((c) => SIZES.map((size) => ({
      color: c.name, colorHex: c.hex, size, stock: Math.max(0, parseInt(form.stock[key(c.name, size)], 10) || 0),
      ...(form.skus[key(c.name, size)] && { sku: form.skus[key(c.name, size)] }),
    })));
    const body = {
      name: form.name.trim(), category: form.category, price: Number(form.price), description: form.description.trim(),
      fabrics: form.fabrics.trim(), features: form.features.trim(), isNew: form.isNew, isActive: form.isActive,
      images: form.images, imagesByColor: form.imagesByColor, variants,
      ...(form.compareAtPrice !== '' ? { compareAtPrice: Number(form.compareAtPrice) } : product?.compareAtPrice ? { compareAtPrice: null } : {}),
    };
    const res = await mutate(product ? `/admin/products/${product.id}` : '/admin/products', { method: product ? 'PUT' : 'POST', body }, `${body.name} ${product ? 'updated' : 'added to the catalogue'}`);
    if (res) onSaved();
  };

  return <Modal title={product ? 'Edit product' : 'Add product'} onClose={onClose} size="xl">
    <form onSubmit={submit} className="admin-form">
      <label>Product name<input required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Classic Polo" autoFocus/></label>
      <div className="form-row">
        <label>Category<select required value={form.category} onChange={(e) => set({ category: e.target.value })}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
        <label>Price (₦)<input required type="number" min="1" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="20000"/></label>
      </div>
      <div className="form-row">
        <label>Compare-at price (₦, optional)<input type="number" min="0" value={form.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })}/></label>
        <div className="check-row"><label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })}/> Active (visible in store)</label><label className="check"><input type="checkbox" checked={form.isNew} onChange={(e) => set({ isNew: e.target.checked })}/> Mark as new</label></div>
      </div>
      <label>Description<textarea required rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })}/></label>
      <div className="form-row"><label>Fabrics<input value={form.fabrics} onChange={(e) => set({ fabrics: e.target.value })} placeholder="Cotton, piqué…"/></label><label>Features<input value={form.features} onChange={(e) => set({ features: e.target.value })} placeholder="Henley collar, embroidery available"/></label></div>

      <div className="field-group"><span className="group-label">Images <small>· the first image is the cover</small></span>
        <div className="img-grid">{form.images.map((src, i) => <div className="img-tile" key={src + i}><img src={imgSrc(src)} alt=""/>{i === 0 && <em>Cover</em>}<button type="button" aria-label="Remove image" onClick={() => set({ images: form.images.filter((_, j) => j !== i) })}><X size={13}/></button></div>)}
          <label className="img-add">{uploading ? <span>Uploading…</span> : <><ImagePlus size={22}/><span>Add images</span></>}<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={onFiles} disabled={uploading}/></label></div>
        <p className="form-hint">PNG, JPG or WEBP, up to 5 MB each.</p></div>

      <div className="field-group"><span className="group-label">Colours and stock</span>
        <div className="colour-add"><input value={colour.name} onChange={(e) => setColour({ ...colour, name: e.target.value })} placeholder="Colour name, e.g. Onyx" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColour(); } }}/><input type="color" aria-label="Colour swatch" value={colour.hex} onChange={(e) => setColour({ ...colour, hex: e.target.value })}/><button type="button" className="secondary-btn" onClick={addColour}><Plus size={14}/> Add colour</button></div>
        {form.colours.length === 0 ? <p className="form-hint">Add a colour to set stock per size.</p> :
          <div className="table-scroll"><table className="stock-grid"><thead><tr><th>Colour</th>{SIZES.map((s) => <th key={s}>{s}</th>)}<th/></tr></thead><tbody>
            {form.colours.map((c) => <tr key={c.name}><td><span className="swatch" style={{ background: c.hex }}/>{c.name}</td>
              {SIZES.map((s) => { const k = key(c.name, s); return <td key={s}><input type="number" min="0" aria-label={`${c.name} ${s} stock`} value={form.stock[k] ?? '0'} onChange={(e) => set({ stock: { ...form.stock, [k]: e.target.value } })}/></td>; })}
              <td><button type="button" className="row-menu danger" aria-label={`Remove ${c.name}`} onClick={() => removeColour(c.name)}><Trash2 size={15}/></button></td></tr>)}
          </tbody></table></div>}
      </div>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving || uploading}>{saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div>
    </form>
  </Modal>;
}
