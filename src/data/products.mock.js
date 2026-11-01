// Catalogue built from the Santo Veste products catalogue (photos and base
// prices are real; stock levels are mock). Shapes mirror the planned backend
// (Product + ProductVariant), so only src/api/catalogue.js changes when the
// real API is ready.
//
// Prices are the catalogue's "base price" per piece. The catalogue quotes them
// for orders of 30+, so retail pricing still needs the client's confirmation.

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const img = (name) => `/products/${name}.webp`;

// Deterministic stock so the demo behaves the same on every load.
function stockFor(seed, index) {
  const n = (seed * 7 + index * 13) % 11;
  if (n === 0) return 0;
  if (n < 3) return n;
  return n * 2;
}

function build({ id, slug, name, price, category, description, fabrics, features, colors, seed }) {
  const variants = [];
  const imagesByColor = {};
  colors.forEach((c, ci) => {
    imagesByColor[c.name] = c.images.map(img);
    SIZES.forEach((size, si) => {
      variants.push({
        sku: `SV-${id.toUpperCase()}-${c.name.replace(/\s+/g, '').toUpperCase()}-${size}`,
        color: c.name,
        colorHex: c.hex,
        size,
        stock: stockFor(seed, ci * 6 + si),
      });
    });
  });
  return {
    id,
    slug,
    name,
    price,
    compareAtPrice: null,
    category,
    description,
    fabrics,
    features,
    isNew: false,
    images: imagesByColor[colors[0].name],
    imagesByColor,
    variants,
  };
}

export const products = [
  build({
    id: 'p01', slug: 'henley-polo', name: 'Henley Polo', price: 20000, category: 'polos', seed: 1,
    description: 'A premium polo with a Henley placket, made for casual or corporate settings.',
    fabrics: 'Cotton, piqué and polyester blends',
    features: 'Henley or flap collar, custom embroidery available',
    colors: [
      { name: 'Cream', hex: '#E9E5D0', images: ['henley-polo-cream', 'henley-polo-cream-2'] },
      { name: 'Forest Green', hex: '#17382A', images: ['henley-polo-green'] },
      { name: 'Navy', hex: '#1B2540', images: ['henley-polo-navy'] },
      { name: 'Red', hex: '#C42A36', images: ['henley-polo-red'] },
      { name: 'Grey', hex: '#A9ABA6', images: ['henley-polo-grey'] },
      { name: 'Maroon', hex: '#6B343C', images: ['henley-polo-maroon'] },
    ],
  }),
  build({
    id: 'p02', slug: 'knit-polo', name: 'Knit Polo', price: 20000, category: 'polos', seed: 2,
    description: 'A textured knit polo with a ribbed hem and cuffs, for casual or corporate wear.',
    fabrics: 'Cotton, piqué and polyester blends',
    features: 'Custom embroidery available',
    colors: [{ name: 'Teal', hex: '#0F6B5C', images: ['knit-polo-teal', 'knit-polo-teal-2'] }],
  }),
  build({
    id: 't01', slug: 'oversized-tee', name: 'Oversized Tee', price: 15000, category: 'tees-shirts', seed: 3,
    description: 'A comfortable round-neck tee with a dropped shoulder, for casual or branded use.',
    fabrics: '100% cotton and blends',
    features: 'Custom printing: DTF, screen print, flex. Embroidery available',
    colors: [{ name: 'Olive', hex: '#7B7A3E', images: ['oversized-tee-olive'] }],
  }),
  build({
    id: 't02', slug: 'band-collar-shirt', name: 'Band Collar Shirt', price: 20000, category: 'tees-shirts', seed: 4,
    description: 'A smart collared shirt that combines style and comfort, for corporate, uniform and casual use.',
    fabrics: 'Cotton and polyester blends',
    features: 'Short or long sleeves, logo embroidery available',
    colors: [
      { name: 'Light Blue', hex: '#A9C3E0', images: ['band-collar-shirt-blue'] },
      { name: 'Deep Green', hex: '#0F3B36', images: ['band-collar-shirt-green'] },
      { name: 'Teal', hex: '#0B5B52', images: ['band-collar-shirt-teal'] },
      { name: 'Rust', hex: '#8A3F2B', images: ['band-collar-shirt-rust'] },
      { name: 'Grey', hex: '#A9ACAF', images: ['band-collar-shirt-grey'] },
    ],
  }),
  build({
    id: 't03', slug: 'printed-shirt', name: 'Printed Shirt', price: 20000, category: 'tees-shirts', seed: 5,
    description: 'A button-up shirt in fine prints, from micro-dot to floral. Smart enough for work, easy enough for the weekend.',
    fabrics: 'Cotton and polyester blends',
    features: 'Short or long sleeves, logo embroidery available',
    colors: [
      { name: 'White Dot', hex: '#EFEFEA', images: ['printed-shirt-white'] },
      { name: 'Teal Floral', hex: '#2A7F86', images: ['printed-shirt-teal'] },
    ],
  }),
  build({
    id: 't04', slug: 'button-down-shirt', name: 'Button-Down Shirt', price: 20000, category: 'tees-shirts', seed: 6,
    description: 'A classic button-down with a chest pocket, made to be worn rolled or buttoned.',
    fabrics: 'Cotton and polyester blends',
    features: 'Short or long sleeves, logo embroidery available',
    colors: [{ name: 'Navy', hex: '#1D2C5C', images: ['oxford-shirt-navy'] }],
  }),
  build({
    id: 's01', slug: 'henley-sweatshirt', name: 'Henley Sweatshirt', price: 20000, category: 'sweats', seed: 7,
    description: 'A comfortable long-sleeve sweatshirt for casual activities, events or work.',
    fabrics: '100% cotton and polyester blends',
    features: 'Henley, button, collar or zip finish. Logo embroidery available',
    colors: [
      { name: 'Navy', hex: '#14214A', images: ['henley-sweatshirt-navy'] },
      { name: 'Black', hex: '#1B1B1B', images: ['henley-sweatshirt-black'] },
    ],
  }),
  build({
    id: 's02', slug: 'quarter-zip-sweatshirt', name: 'Quarter-Zip Sweatshirt', price: 20000, category: 'sweats', seed: 8,
    description: 'A relaxed sweatshirt with a quarter zip and a small chest mark.',
    fabrics: '100% cotton and polyester blends',
    features: 'Zip, button or collar finish. Logo embroidery available',
    colors: [
      { name: 'Black', hex: '#1B1B1B', images: ['quarter-zip-black'] },
      { name: 'Grey', hex: '#B9BBBC', images: ['quarter-zip-grey'] },
    ],
  }),
  build({
    id: 's03', slug: 'fleece-hoodie', name: 'Fleece Hoodie', price: 20000, category: 'sweats', seed: 9,
    description: 'A comfortable hoodie for keeping warm and for morning workout routines.',
    fabrics: '100% cotton and polyester blends',
    features: 'Custom printing: DTF, screen print, flex. Embroidery available',
    colors: [{ name: 'White', hex: '#F1F1EE', images: ['fleece-hoodie-white'] }],
  }),
  build({
    id: 's04', slug: 'jogger', name: 'Jogger', price: 20000, category: 'sweats', seed: 10,
    description: 'Comfortable joggers with a drawcord waist and ribbed cuffs.',
    fabrics: '100% cotton and polyester blends',
    features: 'Custom printing: DTF, screen print, flex. Embroidery available',
    colors: [{ name: 'Sky Blue', hex: '#4F86D4', images: ['jogger-blue'] }],
  }),
  build({
    id: 's05', slug: 'hoodie-jogger-set', name: 'Hoodie and Jogger Set', price: 35000, category: 'sweats', seed: 11,
    description: 'A matching hoodie and jogger set. Warm, comfortable and made for easy everyday wear.',
    fabrics: '100% cotton and polyester blends',
    features: 'Custom printing: DTF, screen print, flex. Embroidery available',
    colors: [{ name: 'White', hex: '#F1F1EE', images: ['hoodie-jogger-set-white'] }],
  }),
  build({
    id: 'c01', slug: 'cargo-overshirt', name: 'Cargo Overshirt', price: 40000, category: 'cargo', seed: 12,
    description: 'A comfortable, premium multipurpose overshirt for casual and work activities.',
    fabrics: 'Chinos, denim and synthetic leather',
    features: 'Zipper, press button or normal button. Printing and embroidery available',
    colors: [
      { name: 'Navy Denim', hex: '#1F2D50', images: ['cargo-overshirt-navy'] },
      { name: 'Black Denim', hex: '#232323', images: ['cargo-overshirt-black'] },
      { name: 'Light Blue', hex: '#A8CCE8', images: ['cargo-overshirt-blue'] },
      { name: 'Olive', hex: '#5C5B3A', images: ['cargo-overshirt-olive'] },
    ],
  }),
  build({
    id: 'c02', slug: 'cargo-pants', name: 'Cargo Pants', price: 40000, category: 'cargo', seed: 13,
    description: 'Premium cargo pants with a drawcord waist and deep pockets, for casual and work activities.',
    fabrics: 'Chinos, denim and synthetic leather',
    features: 'Printing and embroidery available',
    colors: [{ name: 'Black', hex: '#1E1E1E', images: ['cargo-pants-black'] }],
  }),
  build({
    id: 'c03', slug: 'chino-short', name: 'Chino Short', price: 15000, category: 'cargo', seed: 14,
    description: 'Comfortable shorts with a turned-up hem, for casual wear or the beach.',
    fabrics: 'Chinos, cotton and polyester blends',
    features: 'Single or double back pocket',
    colors: [
      { name: 'Grey', hex: '#7C7E80', images: ['chino-short-grey'] },
      { name: 'Rust', hex: '#B5482A', images: ['chino-short-rust'] },
    ],
  }),
];

export const categories = [
  { slug: 'polos', name: 'Polos', image: '/products/henley-polo-green.webp' },
  { slug: 'tees-shirts', name: 'Tees and shirts', image: '/products/oxford-shirt-navy.webp' },
  { slug: 'sweats', name: 'Sweats', image: '/products/henley-sweatshirt-black.webp' },
  { slug: 'cargo', name: 'Cargo and shorts', image: '/products/cargo-overshirt-navy.webp' },
];

// Bulk and custom-order lines from the catalogue (base price per piece, MOQ 30).
export const customLines = [
  { name: 'Polos', price: 20000, note: 'Cotton, piqué and polyester blends. Flap collar or Henley.' },
  { name: 'Collared shirts', price: 20000, note: 'Short or long sleeves. Cotton and polyester blends.' },
  { name: 'Round-neck tees', price: 15000, note: '100% cotton and blends. Printing and embroidery.' },
  { name: 'Sweatshirts', price: 20000, note: 'Zipper, button, collar or Henley finishes.' },
  { name: 'Hoodies', price: 20000, note: '100% cotton and polyester blends.' },
  { name: 'Joggers', price: 20000, note: '100% cotton and polyester blends.' },
  { name: 'Hoodie and jogger set', price: 35000, note: 'Matching set.' },
  { name: 'Shorts', price: 15000, note: 'Chinos, cotton and polyester blends.' },
  { name: 'Cargo jackets and pants', price: 40000, note: 'Chinos, denim and synthetic leather.' },
  { name: 'Jerseys', price: 35000, note: 'Breathable polyester and mesh. Sublimation, names and numbers.' },
  { name: 'Uniforms', price: 50000, note: 'For schools, professional use, corporate teams and events. Negotiable.' },
];

export const customServices = [
  { title: 'Printing', text: 'Screen printing, heat transfer (DTF), DTG and sublimation.' },
  { title: 'Embroidery and monogramming', text: 'High-quality stitching for logos and designs.' },
  { title: 'Branding', text: 'Add your logo, slogans or team names.' },
  { title: 'Buttons and zippers', text: 'Various button and zipper options.' },
  { title: 'Packaging', text: 'Custom branded packaging for bulk orders.' },
];

export const orderSteps = [
  'Contact us with your requirements.',
  'Choose your design, fabric and customization options.',
  'Approve the design and receive a quotation.',
  'We share the production and delivery timeline.',
  'Receive your order.',
];
