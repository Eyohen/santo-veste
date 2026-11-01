import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client';

export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

/** Builds the `call` function the whole admin uses: any 401 drops the session back to the login screen. */
export function useAdminSession(onUnauthorized) {
  const ref = useRef(onUnauthorized);
  useEffect(() => { ref.current = onUnauthorized; });
  return useCallback(async (path, opts) => {
    try { return await api(path, opts); } catch (e) {
      if (e.status === 401) ref.current?.();
      throw e;
    }
  }, []);
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** GET an admin endpoint. Returns { data, loading, error, reload, setData }. Stale responses are ignored. */
export function useFetch(path, query) {
  const { call } = useAdmin();
  const qkey = JSON.stringify(query || {});
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  const seq = useRef(0);
  useEffect(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    call(path, { query: JSON.parse(qkey) }).then(
      (data) => { if (id === seq.current) setState({ data, loading: false, error: '' }); },
      (e) => { if (id === seq.current && e.status !== 401) setState((s) => ({ ...s, loading: false, error: e.message })); },
    );
  }, [call, path, qkey, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((fn) => setState((s) => ({ ...s, data: fn(s.data) })), []);
  return { ...state, reload, setData };
}

/** Wraps a mutation: tracks `saving`, toasts the server's message on failure. Resolves to the result, or undefined on failure. */
export function useMutation() {
  const { call } = useAdmin();
  const [saving, setSaving] = useState(false);
  const run = useCallback(async (path, opts, successMsg) => {
    setSaving(true);
    try {
      const res = await call(path, opts);
      if (successMsg) toast.success(successMsg);
      return res ?? {};
    } catch (e) {
      if (e.status !== 401) toast.error(e.message || 'Something went wrong.');
      return undefined;
    } finally { setSaving(false); }
  }, [call]);
  return [run, saving];
}
