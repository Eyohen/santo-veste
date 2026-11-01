import { formatPrice } from '../../lib/format';

function Group({ title, children }) {
  return (
    <fieldset className="border-t border-asphalt/15 py-5">
      <legend className="float-left mb-3 w-full text-sm font-semibold">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

// `filters` shape: { sizes: string[], colors: string[], maxPrice: number | null }
export default function FilterPanel({ facets, filters, onChange, onClear }) {
  const toggle = (key, value) => {
    const current = filters[key];
    onChange({
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  const price = filters.maxPrice ?? facets.maxPrice;
  const active = filters.sizes.length + filters.colors.length + (filters.maxPrice ? 1 : 0);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filter</h2>
        {active > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-muted link-underline">
            Clear all ({active})
          </button>
        )}
      </div>

      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((size) => {
            const on = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={on}
                onClick={() => toggle('sizes', size)}
                className={`min-w-[2.75rem] px-3 py-2 text-sm font-medium transition-colors ${
                  on ? 'bg-asphalt text-paper' : 'border border-asphalt/25 hover:border-asphalt'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Colour">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
          {facets.colors.map((c) => (
            <li key={c.name}>
              <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={filters.colors.includes(c.name)}
                  onChange={() => toggle('colors', c.name)}
                />
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-asphalt/25 peer-checked:ring-2 peer-checked:ring-asphalt peer-checked:ring-offset-2 peer-checked:ring-offset-paper peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-signal"
                  style={{ background: c.hex }}
                />
                {c.name}
              </label>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Price">
        <input
          type="range"
          min={facets.minPrice}
          max={facets.maxPrice}
          step={1000}
          value={price}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ maxPrice: v >= facets.maxPrice ? null : v });
          }}
          aria-label="Maximum price"
          className="w-full accent-asphalt"
        />
        <p className="mt-2 text-sm text-muted">Up to {formatPrice(price)}</p>
      </Group>
    </div>
  );
}
