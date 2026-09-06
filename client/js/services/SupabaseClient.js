import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise = null;

/**
 * Get or create the shared Supabase client singleton.
 * Fetches /api/config once at startup to get credentials.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export function getSupabaseClient() {
  if (!clientPromise) {
    clientPromise = fetch('/api/config')
      .then((r) => r.json())
      .then(({ supabaseUrl, supabaseAnonKey }) => {
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('Supabase config missing — sync features disabled.');
          return null;
        }
        return createClient(supabaseUrl, supabaseAnonKey);
      })
      .catch((err) => {
        console.warn('Failed to load Supabase config:', err);
        return null;
      });
  }
  return clientPromise;
}
