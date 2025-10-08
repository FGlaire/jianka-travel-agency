import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  // Fallback values for build time
  const supabaseUrl = PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key: string) => event.cookies.get(key),
      set: (key: string, value: string, options) => event.cookies.set(key, value, { path: '/', ...options }),
      remove: (key: string, options) => event.cookies.delete(key, { path: '/', ...options })
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });

  return resolve(event);
};


