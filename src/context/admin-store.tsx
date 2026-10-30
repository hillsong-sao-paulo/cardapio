import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const STORAGE_KEY = 'canteen-admin-store-id';

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  campus_id: string;
  is_active: boolean;
}

interface AdminStoreValue {
  stores: AdminStore[];
  storeId: string | null;
  store: AdminStore | null;
  setStoreId: (id: string) => void;
  loading: boolean;
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setStoreIdState] = useState<string | null>(() => {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(STORAGE_KEY);
  });

  const storesQuery = useQuery({
    queryKey: ['admin-stores'],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('stores')
        .select('id, name, slug, campus_id, is_active')
        .order('name');
      if (error) throw error;
      return (data ?? []) as AdminStore[];
    },
  });

  const stores = storesQuery.data ?? [];

  useEffect(() => {
    if (!isSupabaseConfigured || storesQuery.isLoading) return;
    if (storeId && stores.some((store) => store.id === storeId)) return;
    const nextId = stores[0]?.id ?? null;
    setStoreIdState(nextId);
    if (nextId) {
      sessionStorage.setItem(STORAGE_KEY, nextId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [storeId, stores, storesQuery.isLoading]);

  const setStoreId = (id: string) => {
    setStoreIdState(id);
    sessionStorage.setItem(STORAGE_KEY, id);
  };

  const value = useMemo<AdminStoreValue>(() => {
    const store = stores.find((item) => item.id === storeId) ?? null;
    return {
      stores,
      storeId: store?.id ?? null,
      store,
      setStoreId,
      loading: storesQuery.isLoading,
    };
  }, [stores, storeId, storesQuery.isLoading]);

  return (
    <AdminStoreContext.Provider value={value}>
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStoreValue {
  const value = useContext(AdminStoreContext);
  if (!value) {
    throw new Error('Admin store is only available inside the admin layout');
  }
  return value;
}

export function useOptionalAdminStore(): AdminStoreValue | null {
  return useContext(AdminStoreContext);
}
