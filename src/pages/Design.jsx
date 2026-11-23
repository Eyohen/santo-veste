import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Minus, Plus, RotateCw, Trash2, Type, X } from 'lucide-react';
import { saveDesign } from '../api/shop';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../lib/format';

const PRICE = 5000; // display only: the server prices custom t-shirts itself
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PHOTO = { w: 1080, h: 1350 };
// The chest print area, as fractions of the 1080x1350 photo.
const MODELS = {
  man: { label: 'Men', src: '/BG man stone wash.jpg', top: 0.45 },
  woman: { label: 'Women', src: '/BG wMAN.jpg', top: 0.47 },
};
// Print sizes are real paper sizes (portrait, in cm). On the photos the shirt body is about 10.5 px per cm,
// so each size covers a true-to-scale part of the chest. The area is centred and starts `top` down the photo.
const PRINT_SIZES = { A4: { w: 21, h: 29.7 }, A3: { w: 29.7, h: 42 }, A2: { w: 42, h: 59.4 } };
const PX_PER_CM = 10.5;
const ART_DPI = 150; // resolution of the print-ready artwork
const areaFor = (model, printSize) => {
  const w = (PRINT_SIZES[printSize].w * PX_PER_CM) / PHOTO.w;
  const h = (PRINT_SIZES[printSize].h * PX_PER_CM) / PHOTO.h;
  return { x: 0.5 - w / 2, y: MODELS[model].top, w, h };
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
  { file: 'Group 10840.svg', name: 'God Abeg!' },
  { file: 'Group 10843.svg', name: 'No Put Me For Talk Abeg' },
  { file: 'Group 10847.svg', name: 'Santo Veste' },
  { file: 'Group 10850.svg', name: 'Soro Soke Generation' },
  { file: 'Group 10859.svg', name: 'No Worry Body Go Tell You' },
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
const toBlob = (canvas, type = 'image/png', quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

export default function Design() {
  const { addCustom } = useCart();
  const [model, setModel] = useState('man');
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState('M');
  const [printSize, setPrintSize] = useState('A3');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const images = useRef(new Map()); // layer id -> loaded HTMLImageElement
  const areaRef = useRef(null);
  const [areaW, setAreaW] = useState(300);
  const drag = useRef(null);

  const m = MODELS[model];
  const area = areaFor(model, printSize);
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
      add({ id, type: 'image', label: file.name, src: url, cx: 0.5, cy: 0.5, size: 0.5, rot: 0 });
    } catch { toast.error('We could not read that image.'); }
  };

  const addGraphic = async (g) => {
    try {
      const img = await loadImage(g.src);
      const id = nextId++;
      images.current.set(id, img);
      add({ id, type: 'image', label: g.name, src: g.src, cx: 0.5, cy: 0.5, size: 0.7, rot: 0 });
    } catch { toast.error('We could not load that graphic.'); }
  };

  const removeLayer = useCallback((id) => {
    images.current.delete(id);
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setSelected((cur) => (cur === id ? null : cur));
  }, []);
  const clearAll = () => {
    if (!window.confirm('Remove everything from your design?')) return;
    images.current.clear();
    setLayers([]);
    setSelected(null);
  };

  // Delete / Backspace removes the selected item (unless the customer is typing).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key !== 'Delete' && e.key !== 'Backspace') || selected == null) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      e.preventDefault();
      removeLayer(selected);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, removeLayer]);

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
      const aw = Math.round((PRINT_SIZES[printSize].w / 2.54) * ART_DPI);
      const ah = Math.round((PRINT_SIZES[printSize].h / 2.54) * ART_DPI);
      const art = document.createElement('canvas'); art.width = aw; art.height = ah;
      drawLayers(art.getContext('2d'), layers, aw, ah, images.current);

      // Mockup: the design on the model photo.
      const mock = document.createElement('canvas'); mock.width = PHOTO.w; mock.height = PHOTO.h;
      const mc = mock.getContext('2d');
      mc.drawImage(photo, 0, 0, PHOTO.w, PHOTO.h);
      const bw = area.w * PHOTO.w; const bh = area.h * PHOTO.h;
      mc.save();
      mc.translate(area.x * PHOTO.w, area.y * PHOTO.h);
      mc.beginPath(); mc.rect(0, 0, bw, bh); mc.clip();
      drawLayers(mc, layers, bw, bh, images.current);
      mc.restore();

      const [preview, artwork] = await Promise.all([toBlob(mock, 'image/jpeg', 0.9), toBlob(art)]);
      const design = await saveDesign({ model, printSize, preview, artwork });
      addCustom(design, size, qty, PRICE, printSize);
      toast.success('Added to your bag');
    } catch (err) {
      toast.error(err.message || 'Could not save your design. Please try again.');
    } finally { setBusy(false); }
  }, [layers, m, model, area, printSize, size, qty, addCustom]);

  // Shown under the preview on phones (where the page is one column) and under "Your design" on desktop.
  const settingsPanel = sel && (
      <div className="space-y-4 border border-asphalt/15 p-4">
        <div className="flex items-center justify-between"><p className="text-sm font-semibold">{sel.type === 'text' ? 'Text' : 'Image'}</p>
          <button type="button" onClick={() => removeLayer(sel.id)} className="inline-flex items-center gap-1.5 text-sm text-signal"><Trash2 size={15} /> Remove</button></div>
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
  );

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
              style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.w * 100}%`, height: `${area.h * 100}%` }}
              aria-label="Print area"
            >
              {layers.map((l) => {
                const isSel = l.id === selected;
                const style = { left: `${l.cx * 100}%`, top: `${l.cy * 100}%`, transform: `translate(-50%, -50%) rotate(${l.rot}deg)` };
                const textStyle = { color: l.color, fontFamily: `"${l.family}"`, fontWeight: l.family === 'Montserrat' || l.family === 'Playfair Display' ? 700 : 400, fontSize: l.size * areaW, lineHeight: LINE };
                return (
                  <div key={l.id} className={`absolute cursor-move touch-none ${isSel ? 'outline outline-1 outline-offset-2 outline-white' : ''}`}
                    style={l.type === 'image' ? { ...style, width: `${l.size * 100}%` } : style}
                    onPointerDown={(e) => down(e, l)} onPointerMove={move} onPointerUp={up}>
                    {l.type === 'image'
                      ? <img src={l.src} alt="" draggable={false} className="block w-full" />
                      : <div className="whitespace-pre text-center" style={textStyle}>{l.text}</div>}
                    {isSel && (
                      <button type="button" aria-label="Remove this item" title="Remove (Delete key)"
                        onPointerDown={(e) => e.stopPropagation()} onClick={() => removeLayer(l.id)}
                        className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full bg-signal text-paper shadow">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted">Your design prints inside the dashed area. The dashes won&rsquo;t appear on the shirt.</p>
          {sel && <div className="mt-4 lg:hidden">{settingsPanel}</div>}
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
            <p className="mb-3 text-sm font-semibold">Print size</p>
            <div role="radiogroup" aria-label="Print size" className="flex flex-wrap gap-2">
              {Object.entries(PRINT_SIZES).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={printSize === k} onClick={() => setPrintSize(k)}
                  className={`px-5 py-2.5 text-left text-sm font-semibold ${printSize === k ? 'bg-asphalt text-paper' : 'border border-asphalt/25 hover:border-asphalt'}`}>
                  {k}<span className="block text-xs font-normal opacity-70">{v.w} × {v.h} cm</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">The dashed box shows how big the print will be on the shirt. A4 is a small chest print and A2 is a large full-front print.</p>
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

          {layers.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Your design <span className="font-normal text-muted">({layers.length})</span></p>
                <button type="button" onClick={clearAll} className="text-sm text-signal underline underline-offset-4">Clear all</button>
              </div>
              <ul className="divide-y divide-asphalt/10 border border-asphalt/15">
                {[...layers].reverse().map((l) => (
                  <li key={l.id} className={`flex items-center gap-3 p-2 ${l.id === selected ? 'bg-chalk' : ''}`}>
                    <button type="button" onClick={() => setSelected(l.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Select ${l.type === 'text' ? l.text : l.label}`}>
                      {l.type === 'image'
                        ? <span className="grid h-10 w-10 shrink-0 place-items-center bg-asphalt p-1"><img src={l.src} alt="" className="h-full w-full object-contain" /></span>
                        : <span className="grid h-10 w-10 shrink-0 place-items-center bg-asphalt text-paper"><Type size={16} /></span>}
                      <span className="truncate text-sm">{l.type === 'text' ? l.text.replace(/\n/g, ' ') || 'Text' : l.label}</span>
                    </button>
                    <button type="button" onClick={() => removeLayer(l.id)} aria-label={`Remove ${l.type === 'text' ? l.text : l.label}`}
                      className="grid h-10 w-10 shrink-0 place-items-center text-signal hover:bg-signal/10"><Trash2 size={18} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sel && <div className="hidden lg:block">{settingsPanel}</div>}

          <div>
            <p className="mb-3 text-sm font-semibold">Ready-made graphics</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {GRAPHICS.map((g) => (
                <li key={g.file}>
                  <button type="button" onClick={() => addGraphic(g)} title={g.name} aria-label={`Add graphic: ${g.name}`}
                    className="block aspect-square w-full overflow-hidden bg-asphalt p-2 ring-asphalt hover:ring-2 hover:ring-offset-2">
                    <img src={g.src} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Tap a graphic to add it, then drag, resize or rotate it. Combine as many as you like.</p>
          </div>

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
