import { Link } from 'react-router-dom';

const makes = [
  { title: 'Ready-to-wear', text: 'Modern everyday pieces made with premium fabrics, thoughtful construction and an easy sense of style.' },
  { title: 'Custom-fitted', text: 'Personalised tailoring shaped around your proportions, preferences and the way you want to wear it.' },
  { title: 'Premium basics', text: 'Refined wardrobe staples designed for comfort, repeat wear and effortless pairing.' },
  { title: 'Limited drops', text: 'Small-batch collections and special collaborations released in carefully selected quantities.' },
];

export default function About() {
  return (
    <div>
      <section className="grid lg:grid-cols-2" aria-labelledby="about-title">
        <div className="flex flex-col justify-center px-4 py-14 sm:px-6 lg:px-10 xl:pl-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]">
          <h1 id="about-title" className="display text-3xl sm:text-4xl">Who we are</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed">
            <strong>Santo Veste</strong> is a message-driven streetwear house that enables you to wear what you believe in.
          </p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-charcoal">
            We craft premium, ready-to-wear and custom clothing that carries your message with clarity, style and
            purpose. Every piece is intentionally made to help you express your faith, your values, your heritage, your
            culture, or simply who you are.
          </p>
        </div>
        <div className="min-h-[24rem] bg-chalk">
          <img
            src="/brand/photo/man-looking-up.webp"
            alt="A man in a stone-coloured jacket and white tee looks up, lit by warm sun against curved concrete"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="container-x mt-20 grid gap-10 md:grid-cols-2" aria-label="Mission and vision">
        <div>
          <h2 className="display text-lg">Mission</h2>
          <p className="mt-4 text-xl leading-snug">We exist to help you boldly express what matters.</p>
        </div>
        <div>
          <h2 className="display text-lg">Vision</h2>
          <p className="mt-4 text-xl leading-snug">
            To be a global message-driven brand where every belief finds its voice through what you wear.
          </p>
        </div>
      </section>

      <section className="mt-20 bg-asphalt text-paper" aria-labelledby="idea-title">
        <div className="container-x grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
          <h2 id="idea-title" className="display text-2xl sm:text-3xl">
            Faith. Identity. Heritage.
          </h2>
          <div className="space-y-4 text-lg leading-relaxed text-paper/85">
            <p>Faith gives the brand meaning. Identity gives it expression. Heritage gives it cultural presence.</p>
            <p>Together, they create a distinct and contemporary fashion brand for today and beyond.</p>
            <p>Santo Veste sits where belief, self-expression and African heritage meet.</p>
          </div>
        </div>
      </section>

      <section className="container-x mt-20" aria-labelledby="make-title">
        <h2 id="make-title" className="display text-xl sm:text-2xl">What we create</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {makes.map((m) => (
            <li key={m.title} className="border-t border-asphalt pt-4">
              <h3 className="font-semibold">{m.title}</h3>
              <p className="mt-2 text-muted">{m.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/shop" className="btn-solid">Shop the collection</Link>
          <Link to="/custom" className="btn-outline">Custom and bulk orders</Link>
        </div>
      </section>
    </div>
  );
}
