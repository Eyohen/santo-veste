import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Design from './pages/Design';
import Custom from './pages/Custom';
import About from './pages/About';
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import Admin from './pages/Admin';
import ViewProduct from './pages/ViewProduct';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/view-product" element={<ViewProduct />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:category" element={<Shop />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/design" element={<Design />} />
        <Route path="/custom" element={<Custom />} />
        <Route path="/about" element={<About />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderNumber" element={<OrderStatus />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
