import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Bell, CreditCard, Eye, LayoutDashboard, Loader2, LogOut, Menu, MessageSquare,
  Megaphone, Package, Plus, Tags, Search, Settings, ShoppingBag, Tag, Truck, Users, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getToken, setToken } from '../api/client';
import { AdminContext, useAdminSession, useFetch } from './admin/useAdminData';
import { initials } from './admin/ui';
import Login from './admin/Login';
import Overview from './admin/Overview';
import Orders from './admin/Orders';
import Products from './admin/Products';
import Discounts from './admin/Discounts';
import Transactions from './admin/Transactions';
import Delivery from './admin/Delivery';
import Announcements from './admin/Announcements';
import Categories from './admin/Categories';
import Customers from './admin/Customers';
import CustomRequests from './admin/CustomRequests';
import './admin.css';
import './admin-product.css';

const nav = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'custom', label: 'Custom orders', icon: MessageSquare },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'discounts', label: 'Discounts', icon: Tag },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'customers', label: 'Customers', icon: Users },
];
const titles = {
  dashboard: ['Overview', 'A clear look at how Santo Veste is performing.'], orders: ['Orders', 'Track and fulfil every customer order.'],
  custom: ['Custom orders', 'Bulk and custom quote requests from the storefront.'], products: ['Products', 'Manage the Santo Veste catalogue and stock.'],
  discounts: ['Discounts', 'Create promo codes and manage ongoing offers.'], transactions: ['Transactions', 'Review payments, transfers, and refunds.'],
  delivery: ['Delivery', 'Set delivery pricing across Nigeria’s 36 states.'], categories: ['Categories', 'Organise your catalogue into collections shoppers can browse.'], announcements: ['Announcements', 'Messages that scroll across the top of the storefront.'], customers: ['Customers', 'Your customers and their order history.'],
};

export default function Admin() {
  // undefined = checking the stored token, null = signed out, object = signed-in admin
  const [user, setUser] = useState(() => (getToken() ? undefined : null));
  const [notice, setNotice] = useState('');

  const signOut = useCallback((message = '') => { setToken(null); setUser(null); setNotice(message); }, []);
  const expire = useCallback(() => signOut('Your session has expired. Please sign in again.'), [signOut]);
  const call = useAdminSession(expire);

  useEffect(() => {
    if (user !== undefined) return;
    let live = true;
    api('/auth/me').then((res) => {
      if (!live) return;
      const u = res.user || res;
      if (u?.role === 'admin') setUser(u); else signOut('This account does not have admin access.');
    }, (e) => { if (live) signOut(e.status === 401 ? '' : e.message); });
    return () => { live = false; };
  }, [user, signOut]);

  const ctx = useMemo(() => ({ call, user, signOut }), [call, user, signOut]);

  if (user === undefined) return <div className="admin-shell admin-login"><div className="login-card center"><Loader2 className="spin" size={26}/><p>Checking your session…</p></div></div>;
  if (user === null) return <Login notice={notice} onLogin={(u) => { setNotice(''); setUser(u); }}/>;
  return <AdminContext.Provider value={ctx}><Shell user={user} onSignOut={() => { signOut(''); toast.success('Signed out'); }}/></AdminContext.Provider>;
}

function Shell({ user, onSignOut }) {
  const [page, setPage] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [orderSeed, setOrderSeed] = useState('');
  const stats = useFetch('/admin/stats');
  const { reload: reloadStats } = stats;
  const go = useCallback((id) => { setPage(id); setMobileNav(false); if (id === 'dashboard') reloadStats(); }, [reloadStats]);
  const counts = { orders: stats.data?.awaitingFulfilment, custom: stats.data?.newCustomRequests };

  const content = {
    dashboard: <Overview stats={stats} go={go}/>,
    orders: <Orders key={orderSeed} initialQuery={orderSeed}/>,
    custom: <CustomRequests/>,
    products: <Products modalOpen={productModalOpen} setModalOpen={setProductModalOpen}/>,
    discounts: <Discounts/>,
    transactions: <Transactions/>,
    delivery: <Delivery/>,
    announcements: <Announcements/>,
    categories: <Categories/>,
    customers: <Customers/>,
  }[page];

  return <div className="admin-shell">
    <aside className={`admin-sidebar ${mobileNav ? 'is-open' : ''}`}>
      <div className="admin-brand">
        <img src="/brand/logo-mark-white.png" alt="Santo Veste" />
        <div><strong>SANTO VESTE</strong><span>ADMINISTRATION</span></div>
        <button className="admin-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20}/></button>
      </div>
      <nav aria-label="Admin navigation">
        <span className="nav-label">Workspace</span>
        {nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => go(id)} className={page === id ? 'active' : ''}>
          <Icon size={18}/><span>{label}</span>{counts[id] > 0 && <em>{counts[id]}</em>}
        </button>)}
        <span className="nav-label lower">Management</span>
        <button onClick={() => toast('Store settings are not available yet.')}><Settings size={18}/><span>Settings</span></button>
      </nav>
      <div className="sidebar-card"><span>Store status</span><strong><i/> Online</strong><p>Storefront is accepting orders.</p></div>
      <a className="store-link" href="/" target="_blank" rel="noreferrer"><Eye size={17}/> View storefront <ArrowUpRight size={15}/></a>
    </aside>
    {mobileNav && <button className="admin-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <main className="admin-main">
      <header className="admin-topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu/></button>
        <form className="global-search" onSubmit={(e) => { e.preventDefault(); setOrderSeed(search.trim()); go('orders'); }}><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders by number, name or email…"/></form>
        <div className="top-actions"><button className="icon-btn" aria-label="Notifications" onClick={() => go('orders')}><Bell size={19}/>{(counts.orders > 0 || counts.custom > 0) && <i/>}</button>
          <div className="admin-user"><span>{initials(user.name || user.email)}</span><div><strong>{user.name || user.email}</strong><small>{user.role === 'admin' ? 'Administrator' : user.role}</small></div></div>
          <button className="secondary-btn signout-btn" onClick={onSignOut}><LogOut size={15}/> <span>Sign out</span></button></div>
      </header>
      <section className="admin-content">
        <div className="page-heading"><div><span>Admin / {titles[page][0]}</span><h1>{titles[page][0]}</h1><p>{titles[page][1]}</p></div><div className="heading-actions">{page === 'dashboard' && <button className="primary-btn" onClick={() => { setPage('products'); setProductModalOpen(true); }}><Plus size={16}/> Add product</button>}</div></div>
        {content}
      </section>
    </main>
  </div>;
}
