import { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { reportApi, accountApi, categoryApi, budgetApi, transactionApi } from '../services/api';

const CACHE_TTL = 60_000;
const DataContext = createContext(null);

export function DataProvider({ children }) {
  const cache = useRef({});
  const inflight = useRef({});

  const getCached = useCallback((key) => {
    const entry = cache.current[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
  }, []);

  const fetchCached = useCallback(async (key, fetcher, force = false) => {
    if (!force) {
      const cached = getCached(key);
      if (cached !== null) return cached;
    }

    if (inflight.current[key]) return inflight.current[key];

    const promise = fetcher()
      .then((data) => {
        cache.current[key] = { data, ts: Date.now() };
        delete inflight.current[key];
        return data;
      })
      .catch((err) => {
        delete inflight.current[key];
        throw err;
      });

    inflight.current[key] = promise;
    return promise;
  }, [getCached]);

  const invalidate = useCallback((key) => {
    if (key) delete cache.current[key];
    else cache.current = {};
  }, []);

  const prefetchDashboard = useCallback(() => {
    fetchCached('dashboard', () => reportApi.getDashboard().then((r) => r.data));
  }, [fetchCached]);

  const value = {
    getCached,
    fetchCached,
    invalidate,
    prefetchDashboard,
    fetchDashboard: (force) => fetchCached('dashboard', () => reportApi.getDashboard().then((r) => r.data), force),
    fetchAccounts: (force) => fetchCached('accounts', () => accountApi.getAll().then((r) => r.data), force),
    fetchCategories: (force) => fetchCached('categories', () => categoryApi.getAll().then((r) => r.data), force),
    fetchBudgets: (force) => fetchCached('budgets', () => budgetApi.getAll().then((r) => r.data), force),
    fetchBudgetSpending: (force) => fetchCached('budgetSpending', () => budgetApi.getAllSpending().then((r) => r.data).catch(() => ({})), force),
    fetchTransactions: (month, year, force) =>
      fetchCached(`transactions-${month}-${year}`, () => transactionApi.getAll(month, year).then((r) => r.data), force),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function useCachedQuery(key, fetcher, deps = []) {
  const { getCached, fetchCached } = useData();
  const cached = getCached(key);

  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(cached === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const existing = getCached(key);
    if (existing !== null) {
      setData(existing);
      setLoading(false);
      setError(false);
    } else {
      setLoading(true);
      setError(false);
    }

    fetchCached(key, fetcher).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
        setError(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError(true);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(
    () => fetchCached(key, fetcher, true)
      .then((result) => { setData(result); setError(false); return result; })
      .catch(() => { setError(true); throw new Error('fetch failed'); }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, ...deps]
  );

  return { data, loading, error, reload };
}
