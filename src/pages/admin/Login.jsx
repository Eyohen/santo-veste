import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { api, setToken } from '../../api/client';

export default function Login({ onLogin, notice }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await api('/auth/login', { method: 'POST', body: { email: form.email.trim(), password: form.password }, token: null });
      if (res.user?.role !== 'admin') { setError('This account does not have admin access. Please sign in with an administrator account.'); return; }
      setToken(res.token);
      onLogin(res.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return <div className="admin-shell admin-login">
    <form className="login-card" onSubmit={submit}>
      <div className="login-brand"><img src="/brand/logo-mark-white.png" alt="Santo Veste"/><div><strong>SANTO VESTE</strong><span>ADMINISTRATION</span></div></div>
      <h1>Sign in</h1>
      <p>Use your administrator account to manage the store.</p>
      {(error || notice) && <div className={`login-msg ${error ? 'error' : ''}`} role="alert">{error || notice}</div>}
      <div className="admin-form login-fields">
        <label>Email<input required type="email" autoComplete="username" autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
        <label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/></label>
      </div>
      <button className="primary-btn login-submit" disabled={busy}>{busy ? <Loader2 size={16} className="spin"/> : <Lock size={16}/>} {busy ? 'Signing in…' : 'Sign in'}</button>
      <a className="login-back" href="/">← Back to storefront</a>
    </form>
  </div>;
}
