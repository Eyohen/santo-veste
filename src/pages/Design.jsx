import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Minus, Plus, RotateCw, Trash2, Type } from 'lucide-react';
import { saveDesign } from '../api/shop';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../lib/format';

const PRICE = 5000; // display only: the server prices custom t-shirts itself
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PHOTO = { w: 1080, h: 1350 };
// The chest print area, as fractions of the 1080x1350 photo.
const MODELS = {
  man: { label: 'Men', src: '/BG man stone wash.jpg', area: { x: 0.3, y: 0.4, w: 0.4, h: 0.36 } },
  woman: { label: 'Women', src: '/BG wMAN.jpg', area: { x: 0.3, y: 0.42, w: 0.4, h: 0.36 } },
};
const FONTS = [
  { label: 'Bold', family: 'Anton' },
  { label: 'Clean', family: 'Montserrat' },
  { label: 'Script', family: 'Pacifico' },
  { label: 'Serif', family: 'Playfair Display' },
  { label: 'Marker', family: 'Permanent Marker' },
];
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@700&family=Pacifico&family=Playfair+Display:wght@700&family=Permanent+Marker&display=swap';
const LINE = 1.15;
// Ready-made graphics from /public/custom. Add a file there and list it here to offer it.
const GRAPHICS = [
  { file: '2B8D83B9-2A6E-44F7-854D-3AF26B06FA96.svg', name: 'Omo Mehn!' },
  { file: '5D7C55E2-4B00-4576-BAF3-8B55EA02CE5F.svg', name: 'Omooo… Things Dey Occur!' },
  { file: 'Group 10840.svg', name: 'God Abeg' },
  { file: 'Group 10843.svg', name: 'No Put Me For…' },
  { file: 'Group 10847.svg', name: 'Santo Veste' },
  { file: 'Group 10850.svg', name: 'Soro Soke Generation' },
  { file: 'Group 10859.svg', name: 'No Worry Body Go…' },
  { file: 'Group 10865.svg', name: 'Naija All The Way' },
  { file: 'Group 10914.svg', name: 'Made in Nigeria' },
].map((g) => ({ ...g, src: `/custom/${encodeURIComponent(g.file)}` }));
const MAX_IMG = 5 * 1024 * 1024;

let nextId = 1;

/** Draws every layer into a W x H box. Geometry is stored as fractions of the box width, so any output size matches the preview. */
function drawLayers(ctx, layers, W, H, images) {
  layers.forEach((l) => {
    ctx.save();
    ctx.translate(l.cx * W, l.cy * H);
    ctx.rotate((l.rot * Math.PI) / 180);
    if (l.type === 'image') {
      const img = images.get(l.id);
      const w = l.size * W;
      ctx.drawImage(img, -w / 2, -(w * (img.naturalHeight / img.naturalWidth)) / 2, w, w * (img.naturalHeight / img.naturalWidth));
    } else {
      const fs = l.size * W;
      ctx.font = `${l.family === 'Montserrat' || l.family === 'Playfair Display' ? '700 ' : ''}${fs}px "${l.family}"`;
      ctx.fillStyle = l.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = l.text.split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * LINE));
    }
    ctx.restore();
  });
}

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});
const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

export default function Design() {
  const { addCustom } = useCart();
  const [model, setModel] = useState('man');
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState('M');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const images = useRef(new Map()); // layer id -> loaded HTMLImageElement
  const areaRef = useRef(null);
  const [areaW, setAreaW] = useState(300);
  const drag = useRef(null);

  const m = MODELS[model];
  const sel = layers.find((l) => l.id === selected);

  useEffect(() => {
    if (document.getElementById('design-fonts')) return;
    const link = document.createElement('link');
    link.id = 'design-fonts'; link.rel = 'stylesheet'; link.href = FONT_CSS;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setAreaW(el.clientWidth));
    ro.observe(el);
    setAreaW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const patch = (id, p) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const add = (layer) => { setLayers((ls) => [...ls, layer]); setSelected(layer.id); };

  const addText = () => add({ id: nextId++, type: 'text', text: 'Your text', family: 'Anton', color: '#ffffff', cx: 0.5, cy: 0.5, size: 0.16, rot: 0 });

  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error('Use a PNG, JPG or WEBP image.'); return; }
    if (file.size > MAX_IMG) { toast.error('That image is larger than 5 MB.'); return; }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const id = nextId++;
      images.current.set(id, img);
      add({ id, type: 'image', src: url, cx: 0.5, cy: 0.5, size: 0.5, rot: 0 });
    } catch { toast.error('We could not read that image.'); }
  };

  const addGraphic = async (g) => {
    try {
      const img = await loadImage(g.src);
      const id = nextId++;
      images.current.set(id, img);
      add({ id, type: 'image', src: g.src, cx: 0.5, cy: 0.5, size: 0.7, rot: 0 });
    } catch { toast.error('We could not load that graphic.'); }
  };

  const remove = () => {
    if (!sel) return;
    images.current.delete(sel.id);
    setLayers((ls) => ls.filter((l) => l.id !== sel.id));
    setSelected(null);
  };

  const down = (e, l) => {
    e.stopPropagation();
    setSelected(l.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = areaRef.current.getBoundingClientRect();
    drag.current = { id: l.id, x: e.clientX, y: e.clientY, cx: l.cx, cy: l.cy, w: r.width, h: r.height };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    patch(d.id, { cx: clamp(d.cx + (e.clientX - d.x) / d.w), cy: clamp(d.cy + (e.clientY - d.y) / d.h) });
  };
  const up = () => { drag.current = null; };

  const submit = useCallback(async () => {
    if (!layers.length) { toast.error('Add some text or an image to your design first.'); return; }
    setBusy(true);
    try {
      await Promise.all(FONTS.map((f) => document.fonts.load(`40px "${f.family}"`).catch(() => null)));
      const photo = await loadImage(m.src);

      // Print-ready artwork: just the design, transparent background, high resolution.
      const aw = 1600;
      const ah = Math.round(aw * ((m.area.h * PHOTO.h) / (m.area.w * PHOTO.w)));
      const art = document.createElement('canvas'); art.width = aw; art.height = ah;
      drawLayers(art.getContext('2d'), layers, aw, ah, images.current);

      // Mockup: the design on the model photo.
      const mock = document.createElement('canvas'); mock.width = PHOTO.w; mock.height = PHOTO.h;
      const mc = mock.getContext('2d');
      mc.drawImage(photo, 0, 0, PHOTO.w, PHOTO.h);
      const bw = m.area.w * PHOTO.w; const bh = m.area.h * PHOTO.h;
      mc.save();
      mc.translate(m.area.x * PHOTO.w, m.area.y * PHOTO.h);
      mc.beginPath(); mc.rect(0, 0, bw, bh); mc.clip();
      drawLayers(mc, layers, bw, bh, images.current);
      mc.restore();

      const [preview, artwork] = await Promise.all([toBlob(mock), toBlob(art)]);
      const design = await saveDesign({ model, preview, artwork });
      addCustom(design, size, qty, PRICE);
      toast.success('Added to your bag');
    } catch (err) {
      toast.error(err.message || 'Could not save your design. Please try again.');
    } finally { setBusy(false); }
  }, [layers, m, model, size, qty, addCustom]);

  return (
    <div className="container-x py-10">
      <h1 className="display text-2xl sm:text-3xl">Design your own t-shirt</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">Add text or your own artwork, drag it into place, then order. {formatPrice(PRICE)} per t-shirt, printed to order.</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,34rem)_1fr]">
        <div>
          <div className="relative mx-auto w-full max-w-[34rem] select-none overflow-hidden bg-chalk" style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }} onPointerDown={() => setSelected(null)}>
            <img src={m.src} alt={`${m.label} black t-shirt`} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div
              ref={areaRef}
              className="absolute overflow-hidden border border-dashed border-white/60"
              style={{ left: `${m.area.x * 100}%`, top: `${m.area.y * 100}%`, width: `${m.area.w * 100}%`, height: `${m.area.h * 100}%` }}
              aria-label="Print area"
            >
              {layers.map((l) => {
                const style = { left: `${l.cx * 100}%`, top: `${l.cy * 100}%`, transform: `translate(-50%, -50%) rotate(${l.rot}deg)` };
                const ring = l.id === selected ? 'outline outline-1 outline-offset-2 outline-white' : '';
                return l.type === 'image' ? (
                  <img key={l.id} src={l.src} alt="" draggable={false} className={`absolute cursor-move touch-none ${ring}`} style={{ ...style, width: `${l.size * 100}%` }}
                    onPointerDown={(e) => down(e, l)} onPointerMove={move} onPointerUp={up} />
                ) : (
                  <div key={l.id} className={`absolute cursor-move touch-none whitespace-pre text-center ${ring}`}
                    style={{ ...style, color: l.color, fontFamily: `"${l.family}"`, fontWeight: l.family === 'Montserrat' || l.family === 'Playfair Display' ? 700 : 400, fontSize: l.size * areaW, lineHeight: LINE }}
                    onPointerDown={(e) => down(e, l)} onPointerMove={move} onPointerUp={up}>{l.text}</div>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted">Your design prints inside the dashed area. The dashes won&rsquo;t appear on the shirt.</p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm font-semibold">Model</p>
            <div className="flex gap-2">
              {Object.entries(MODELS).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setModel(k)} aria-pressed={model === k}
                  className={`px-5 py-2.5 text-sm font-semibold ${model === k ? 'bg-asphalt text-paper' : 'border border-asphalt/25 hover:border-asphalt'}`}>{v.label}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Add to your design</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={addText} className="btn-outline"><Type size={16} /> Add text</button>
              <label className="btn-outline cursor-pointer"><ImagePlus size={16} /> Upload image
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onFile} /></label>
            </div>
            <p className="mt-2 text-xs text-muted">PNG, JPG or WEBP, up to 5 MB. Transparent PNGs print best.</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Ready-made graphics</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {GRAPHICS.map((g) => (
                <li key={g.file}>
                  <button type="button" onClick={() => addGraphic(g)} title={g.name} aria-label={`Add graphic: ${g.name}`}
                    className="grid aspect-square w-full place-items-center bg-asphalt p-2 ring-asphalt hover:ring-2 hover:ring-offset-2">
                    <img src={g.src} alt="" loading="lazy" draggable={false} className="max-h-full max-w-full object-contain" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Tap a graphic to add it, then drag, resize or rotate it. Combine as many as you like.</p>
          </div>

          {sel && (
            <div className="space-y-4 border border-asphalt/15 p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">{sel.type === 'text' ? 'Text' : 'Image'}</p>
                <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-signal"><Trash2 size={15} /> Remove</button></div>
              {sel.type === 'text' && (
                <>
                  <textarea rows={2} value={sel.text} onChange={(e) => patch(sel.id, { text: e.target.value.slice(0, 80) })} className="field" aria-label="Text" />
                  <div className="flex flex-wrap items-center gap-3">
                    <select value={sel.family} onChange={(e) => patch(sel.id, { family: e.target.value })} className="field !w-auto" aria-label="Font">
                      {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}</select>
                    <label className="flex items-center gap-2 text-sm">Colour <input type="color" value={sel.color} onChange={(e) => patch(sel.id, { color: e.target.value })} className="h-9 w-12" /></label>
                  </div>
                </>
              )}
              <label className="block text-sm">Size
                <input type="range" min="0.05" max={sel.type === 'image' ? 1 : 0.5} step="0.01" value={sel.size} onChange={(e) => patch(sel.id, { size: Number(e.target.value) })} className="mt-1 w-full" /></label>
              <label className="block text-sm"><span className="inline-flex items-center gap-1.5"><RotateCw size={14} /> Rotate</span>
                <input type="range" min="-180" max="180" step="1" value={sel.rot} onChange={(e) => patch(sel.id, { rot: Number(e.target.value) })} className="mt-1 w-full" /></label>
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-semibold">Size</p>
            <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setSize(s)}
                  className={`min-w-[3.25rem] py-3 text-sm font-semibold ${size === s ? 'bg-asphalt text-paper' : 'border border-asphalt/25 hover:border-asphalt'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-asphalt/25">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center hover:bg-chalk"><Minus size={14} /></button>
              <span className="w-10 text-center text-sm" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(50, q + 1))} className="grid h-12 w-12 place-items-center hover:bg-chalk"><Plus size={14} /></button>
            </div>
            <button type="button" onClick={submit} disabled={busy} className="btn-solid flex-1">{busy ? 'Saving your design…' : `Add to bag · ${formatPrice(PRICE * qty)}`}</button>
          </div>
          <p className="text-xs text-muted">Need 30 or more? <a href="/custom" className="link-underline">Request a bulk quote</a>.</p>
        </div>
      </div>
    </div>
  );
}
