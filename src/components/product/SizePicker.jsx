// `variants` are the variants of the currently selected colour.
export default function SizePicker({ variants, selected, onSelect }) {
  return (
    <div role="radiogroup" aria-label="Size" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {variants.map((v) => {
        const soldOut = v.stock === 0;
        const active = selected === v.size;
        return (
          <button
            key={v.sku}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={soldOut}
            onClick={() => onSelect(v.size)}
            className={`relative py-3 text-sm font-semibold transition-colors ${
              active
                ? 'bg-asphalt text-paper'
                : soldOut
                  ? 'cursor-not-allowed border border-asphalt/10 text-muted/50'
                  : 'border border-asphalt/25 hover:border-asphalt'
            }`}
          >
            <span className={soldOut ? 'line-through' : ''}>{v.size}</span>
            {soldOut && <span className="sr-only"> (sold out)</span>}
          </button>
        );
      })}
    </div>
  );
}
