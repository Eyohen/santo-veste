import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { categories, getProducts } from '../api/catalogue';
import useAsync from '../lib/useAsync';
import ProductCard from '../components/product/ProductCard';
import { BRAND } from '../lib/brand';

// The one orchestrated moment on the site: the tagline rises line by line
// while the hero photographs fade in and begin to cycle.
const rise = {
  hidden: { y: '110%' },
  show: (i) => ({ y: 0, transition: { duration: 0.8, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
};

function Hero() {
  return (
    <HeroSlideshow>
      <div className="container-x relative z-10 w-full pb-24 pt-14 lg:pb-20">
        <div className="max-w-xl text-paper">
          <h1 id="hero-title" className="display text-[clamp(1.9rem,4.3vw,3.9rem)]">
            {['Driven', 'by', 'belief.'].map((word, i) => (
              <span key={word} className="block overflow-hidden pb-[0.12em]">
                <motion.span className="block" variants={rise} custom={i} initial="hidden" animate="show">
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/90">
            Santo Veste is a message-driven streetwear house. Every piece is made to help you express your faith, your
            values, your heritage, your culture, or simply who you are.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-light">
              Shop the collection
            </Link>
            <Link to="/custom" className="btn border border-paper text-paper hover:bg-paper hover:text-asphalt">
              Custom and bulk orders
            </Link>
          </div>
        </div>
      </div>
    </HeroSlideshow>
  );
}

const heroSlides = [
  {
    src: '/brand/photo/hero-stairs.webp',
    position: 'object-[60%_40%]',
    alt: 'A man in a black corduroy shirt-jacket and cream trousers sits on pale concrete steps under a blue sky',
  },
  {
    src: '/brand/photo/pair-arch.webp',
    position: 'object-[40%_30%]',
    alt: 'A man and a woman in stone-coloured tees stand in front of an arched wall',
  },
  {
    src: '/brand/photo/man-looking-up.webp',
    position: 'object-[50%_30%]',
    alt: 'A man in a stone-coloured jacket and white tee looks up, lit by warm sun against curved concrete',
  },
  {
    src: '/brand/photo/pink-corduroy.webp',
    position: 'object-[50%_25%]',
    alt: 'A man in a pink corduroy jacket and cream trousers looks down at the camera',
  },
  {
    src: '/brand/photo/woman-black-tee.webp',
    position: 'object-[50%_25%]',
    alt: 'A woman in sunglasses and a black tee, lit by warm sun',
  },
];

const SLIDE_MS = 2500;

// Crossfades through the brand photographs. Autoplay pauses while the pointer
// or keyboard focus is on the panel, and is off for visitors who prefer
// reduced motion (they can still step through with the dots).
function HeroSlideshow({ children }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % heroSlides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion, index]);

  return (
    <motion.section
      className="relative flex min-h-[34rem] flex-col justify-end overflow-hidden bg-asphalt lg:min-h-[calc(100svh-6.5rem)]"
      aria-labelledby="hero-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {heroSlides.map((slide, i) => {
        const active = i === index;
        return (
          <img
            key={slide.src}
            src={slide.src}
            alt={active ? slide.alt : ''}
            aria-hidden={!active}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out motion-reduce:transition-none ${slide.position} ${
              active ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
            }`}
          />
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-t from-asphalt/80 via-asphalt/35 to-asphalt/10" aria-hidden />

      {children}

      <div className="absolute bottom-4 right-4 z-20 flex bg-paper/90 px-1 py-0.5" role="group" aria-label="Hero photographs">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show photograph ${i + 1} of ${heroSlides.length}`}
            aria-current={i === index}
            className="grid h-8 w-8 place-items-center"
          >
            <span className={`block h-0.5 w-5 transition-colors ${i === index ? 'bg-asphalt' : 'bg-asphalt/30'}`} />
          </button>
        ))}
      </div>
    </motion.section>
  );
}

const pillars = [
  {
    title: 'Faith',
    keywords: 'Belief. Conviction. Purpose.',
    line: 'Faith gives the brand meaning.',
    image: '/brand/photo/pillar-faith.webp',
    alt: 'A man with his eyes closed and face lifted to the sun, in a cream knit tee',
  },
  {
    title: 'Identity',
    keywords: 'Individuality. Confidence. Self-expression.',
    line: 'Identity gives it expression.',
    image: '/brand/photo/pillar-identity.webp',
    alt: 'A man in sunglasses and a black jacket looking to one side against warm concrete',
  },
  {
    title: 'Heritage',
    keywords: 'African culture. Origin. Perspective.',
    line: 'Heritage gives it cultural presence.',
    image: '/brand/photo/pillar-heritage.webp',
    alt: 'A man in a black and gold patterned shirt looking into the distance',
  },
];

function Pillars() {
  return (
    <section className="container-x mt-20" aria-labelledby="pillars-title">
      <h2 id="pillars-title" className="display max-w-3xl text-2xl sm:text-3xl">
        Faith. Identity. Heritage.
      </h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <li key={p.title}>
            <div className="aspect-[4/5] overflow-hidden bg-chalk">
              <img src={p.image} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <h3 className="display mt-4 text-lg">{p.title}</h3>
            <p className="mt-1 text-charcoal">{p.line}</p>
            <p className="mt-1 text-sm text-muted">{p.keywords}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryTiles() {
  return (
    <section className="container-x mt-24" aria-labelledby="cats-title">
      <h2 id="cats-title" className="display mb-8 text-2xl sm:text-3xl">
        Shop by family
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link to={`/shop/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-chalk">
              <img
                src={c.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="display absolute bottom-0 left-0 bg-paper px-4 py-2.5 text-sm sm:text-base">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Rail() {
  const { data, loading } = useAsync(() => getProducts(), []);
  const items = data?.slice(0, 8) ?? [];

  return (
    <section className="mt-24" aria-labelledby="rail-title">
      <div className="container-x mb-8 flex items-end justify-between gap-4">
        <h2 id="rail-title" className="display text-2xl sm:text-3xl">
          The collection
        </h2>
        <Link to="/shop" className="shrink-0 text-sm font-semibold link-underline">
          View all products
        </Link>
      </div>
      <ul className="scrollbar-hide flex snap-x scroll-pl-4 gap-3 overflow-x-auto px-4 sm:scroll-pl-6 sm:px-6 lg:scroll-pl-10 lg:px-10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="w-[68%] shrink-0 sm:w-[34%] lg:w-[23%]">
                <div className="aspect-[4/5] animate-pulse bg-chalk" />
              </li>
            ))
          : items.map((p) => (
              <li key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[34%] lg:w-[23%]">
                <ProductCard product={p} />
              </li>
            ))}
      </ul>
    </section>
  );
}

function Lookbook() {
  return (
    <section className="container-x mt-24" aria-labelledby="look-title">
      <h2 id="look-title" className="display text-2xl sm:text-3xl">
        Wear what you believe in
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <img src="/brand/photo/woman-black-tee.webp" alt="A woman in sunglasses and a black tee, lit by warm sun" loading="lazy" className="aspect-[3/4] h-full w-full object-cover md:row-span-2 md:aspect-auto" />
        <img src="/brand/photo/pink-corduroy.webp" alt="A man in a pink corduroy jacket looking down at the camera" loading="lazy" className="aspect-[3/4] h-full w-full object-cover md:row-span-2 md:aspect-auto" />
        <img src="/brand/photo/pair-arch.webp" alt="A man and a woman in stone-coloured tees in front of an arched wall" loading="lazy" className="col-span-2 aspect-[16/9] h-full w-full object-cover" />
        <img src="/brand/photo/rack.webp" alt="Tees on a black rail in black, taupe, white and grey" loading="lazy" className="aspect-square h-full w-full object-cover" />
        <img src="/brand/photo/label-detail.webp" alt="A woven Santo Veste monogram label on black fabric" loading="lazy" className="aspect-square h-full w-full object-cover" />
      </div>
    </section>
  );
}

function CustomBand() {
  return (
    <section className="mt-24 bg-asphalt text-paper" aria-labelledby="custom-title">
      <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 id="custom-title" className="display text-2xl sm:text-3xl">
            Dressing a team, a school or an event?
          </h2>
          <p className="mt-5 max-w-xl text-lg text-paper/80">
            We make polos, tees, jerseys, uniforms and more with your logo, name or message. Printing, embroidery and
            custom packaging, in runs from {BRAND.moq} pieces.
          </p>
          <Link to="/custom" className="btn-light mt-8">
            Request a quote
          </Link>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {['henley-polo-navy', 'band-collar-shirt-green', 'henley-sweatshirt-navy'].map((n) => (
            <li key={n} className="aspect-[3/4] overflow-hidden bg-charcoal">
              <img src={`/products/${n}.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Pillars />
      <CategoryTiles />
      <Rail />
      <Lookbook />
      <CustomBand />
    </>
  );
}
