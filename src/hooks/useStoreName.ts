import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicMenu } from '@/lib/canteen-api';
import { isSupabaseConfigured } from '@/lib/supabase';

export const publicMenuQueryKey = (slug: string) => ['public-menu', slug] as const;

export function usePublicMenu(slug: string | undefined) {
  return useQuery({
    queryKey: publicMenuQueryKey(slug ?? ''),
    enabled: isSupabaseConfigured && Boolean(slug),
    queryFn: () => fetchPublicMenu(slug as string),
  });
}

export function useStoreName(): string | undefined {
  const { slug } = useParams();
  const menu = usePublicMenu(slug);
  return menu.data?.store.name;
}
