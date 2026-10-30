import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type CanteenClient = SupabaseClient<any, any, 'canteen'>;

let client: CanteenClient | null = null;

export function getSupabase(): CanteenClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'canteen' },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
