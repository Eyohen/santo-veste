// Renders a real photo when `src` exists, otherwise an illustrated garment
// silhouette tinted to the colourway. Lets the whole storefront be reviewed
// before photography arrives; drop URLs into product.images to replace it.

const SHAPES = {
  tee: {
    body: 'M60 22 L84 12 Q100 30 116 12 L140 22 L182 58 L160 84 L140 70 L140 214 L60 214 L60 70 L40 84 L18 58 Z',
    detail: ['M84 12 Q100 30 116 12'],
  },
  hoodie: {
    body: 'M62 44 L84 26 Q100 42 116 26 L138 44 L188 156 L164 168 L138 116 L138 214 L62 214 L62 116 L36 168 L12 156 Z',
    detail: ['M78 28 Q100 -2 122 28 Q100 52 78 28 Z', 'M76 148 L124 148 L132 190 L68 190 Z', 'M94 52 L92 84', 'M106 52 L108 84'],
  },
  jacket: {
    body: 'M58 26 L84 14 L100 32 L116 14 L142 26 L188 72 L174 194 L146 194 L146 224 L54 224 L54 194 L26 194 L12 72 Z',
    detail: ['M100 32 L100 224', 'M84 14 L90 40 L100 32', 'M116 14 L110 40 L100 32', 'M54 150 L88 150', 'M112 150 L146 150'],
  },
  pants: {
    body: 'M56 10 L144 10 L154 234 L108 234 L100 92 L92 234 L46 234 Z',
    detail: ['M56 26 L144 26', 'M100 26 L100 92', 'M70 50 L82 50 L82 78', 'M130 50 L118 50 L118 78'],
  },
  cap: {
    body: 'M34 142 Q30 62 100 62 Q170 62 166 142 L204 152 Q206 166 170 164 L34 164 Z',
    detail: ['M100 62 L100 142', 'M66 70 Q60 108 64 142', 'M134 70 Q140 108 136 142'],
  },
  beanie: {
    body: 'M40 150 Q36 54 100 54 Q164 54 160 150 Z',
    detail: ['M38 150 L162 150 L162 176 L38 176 Z', 'M62 66 L62 150', 'M82 58 L82 150', 'M100 55 L100 150', 'M118 58 L118 150', 'M138 66 L138 150'],
  },
  tote: {
    body: 'M40 82 L160 82 L170 224 L30 224 Z',
    detail: ['M68 82 Q68 22 100 22 Q132 22 132 82', 'M44 112 L156 112'],
  },
};

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function ProductImage({ src, alt, shape = 'tee', color = '#25272A', tone = 'light', className = '' }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }

  const def = SHAPES[shape] ?? SHAPES.tee;
  const bare = tone === 'bare';
  const backdrop = bare ? 'transparent' : tone === 'dark' ? '#2E2E2E' : '#E8DCC6';
  const stroke = shade(color, bare ? 40 : -34);

  return (
    <svg
      viewBox="0 0 200 250"
      role="img"
      aria-label={alt}
      className={`h-full w-full ${className}`}
      preserveAspectRatio={bare ? 'xMidYMid meet' : 'xMidYMid slice'}
      style={{ background: backdrop }}
    >
      {!bare && <ellipse cx="100" cy="238" rx="64" ry="5" fill="rgba(0,0,0,0.14)" />}
      <g transform="translate(0 4)">
        <path d={def.body} fill={color} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
        {def.detail.map((d) => (
          <path key={d} d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
        ))}
      </g>
    </svg>
  );
}
