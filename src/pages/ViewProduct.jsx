import { ArrowLeft, Box, Layers3, Pencil, Tag } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { products } from '../data/products.mock';
import './view-product.css';

const money = value => `₦${Number(value).toLocaleString('en-NG')}`;

export default function ViewProduct() {
  const [params] = useSearchParams();
  const id = params.get('id');
  let selected = products.find(product => String(product.id) === id);
  try {
    const saved = JSON.parse(sessionStorage.getItem('sv-admin-view-product'));
    if (saved && String(saved.id) === id) selected = saved;
  } catch { /* Ignore unavailable or invalid demo session data. */ }

  if (!selected) return <main className="product-view missing-product"><Box size={34}/><h1>Product not found</h1><p>This demo product may no longer be available.</p><Link to="/admin">Back to admin</Link></main>;

  const stock = selected.variants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
  const colours = [...new Set(selected.variants.map(variant => variant.color).filter(Boolean))];
  const sizes = [...new Set(selected.variants.map(variant => variant.size).filter(Boolean))];

  return <main className="product-view">
    <header className="product-view-bar"><Link to="/admin"><ArrowLeft size={17}/> Back to products</Link><img src="/brand/wordmark.png" alt="Santo Veste"/><Link className="edit-link" to="/admin"><Pencil size={15}/> Edit in admin</Link></header>
    <section className="product-view-content">
      <div className="product-view-breadcrumb">Admin / Products / <span>{selected.name}</span></div>
      <div className="product-view-grid">
        <div className="product-view-image"><img src={selected.images?.[0]} alt={selected.name}/><span>{stock > 0 ? 'In stock' : 'Sold out'}</span></div>
        <article className="product-view-details"><span className="eyebrow">Santo Veste collection</span><h1>{selected.name}</h1><strong className="view-price">{money(selected.price)}</strong><p>{selected.description || 'A premium Santo Veste piece created for comfort, polish, and everyday versatility.'}</p>
          <div className="view-meta"><div><Tag size={17}/><span>Category</span><b>{selected.category.replace('-', ' & ')}</b></div><div><Box size={17}/><span>Inventory</span><b>{stock} units</b></div><div><Layers3 size={17}/><span>Variants</span><b>{selected.variants.length}</b></div></div>
          <div className="view-options"><div><span>Available colours</span><p>{colours.join(' · ') || 'Not specified'}</p></div><div><span>Available sizes</span><p>{sizes.join(' · ') || 'Not specified'}</p></div></div>
          {selected.fabrics && <div className="view-description"><span>Fabric</span><p>{selected.fabrics}</p></div>}
          {selected.features && <div className="view-description"><span>Details</span><p>{selected.features}</p></div>}
        </article>
      </div>
    </section>
  </main>;
}
