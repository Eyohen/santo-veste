import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-x py-24">
      <p className="display text-[clamp(3rem,12vw,8rem)] leading-none text-taupe">404</p>
      <h1 className="display mt-6 text-xl sm:text-2xl">This page doesn&rsquo;t exist</h1>
      <p className="mt-3 max-w-md text-muted">The link may be old, or the piece may no longer be available.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/shop" className="btn-solid">Shop all products</Link>
        <Link to="/" className="btn-outline">Back to home</Link>
      </div>
    </div>
  );
}
