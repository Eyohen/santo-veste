export default function ColorSwatches({ colors, selected, onSelect, size = 'md' }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-8 w-8';
  const interactive = typeof onSelect === 'function';

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Colours">
      {colors.map((c) => {
        const active = selected === c.name;
        const swatch = (
          <span
            className={`block rounded-full border ${dim} ${
              active ? 'border-asphalt ring-2 ring-asphalt ring-offset-2 ring-offset-paper' : 'border-asphalt/25'
            }`}
            style={{ background: c.hex }}
          />
        );
        return (
          <li key={c.name}>
            {interactive ? (
              <button
                type="button"
                onClick={() => onSelect(c.name)}
                aria-label={c.name}
                aria-pressed={active}
                title={c.name}
                className={size === 'sm' ? 'p-1' : ''}
              >
                {swatch}
              </button>
            ) : (
              <span title={c.name}>{swatch}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
