import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

function readPublicEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.[name]?.trim() ?? '';
}

/** Null når prosjektet ikke er koblet til Supabase. Klienten skal aldri få service role. */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = readPublicEnv('VITE_SUPABASE_URL');
  const anonKey = readPublicEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    cached = null;
    return null;
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}

/** Tilbakestiller hurtigbuffer for Supabase-klienten (f.eks. ved testing) */
export function resetSupabaseClient(): void {
  cached = undefined;
}
