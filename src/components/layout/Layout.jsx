import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import { BRAND } from '../../lib/brand';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-asphalt focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="bg-asphalt py-2 text-center text-xs font-medium text-paper">
        <Link to="/custom" className="hover:underline">
          Custom and bulk orders from {BRAND.moq} pieces. Request a quote
        </Link>
      </div>
      <Header />
      <ScrollToTop />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: '#0B0B0B', color: '#F8F7F2', borderRadius: 0, fontSize: '14px' },
        }}
      />
    </div>
  );
}
