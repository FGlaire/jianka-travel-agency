import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

export const handle: Handle = async ({ event, resolve }) => {
  // Get environment variables with fallbacks
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Create regular client for user operations
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

  // Create admin client for admin operations if service role key is available
  if (supabaseServiceRoleKey) {
    event.locals.supabaseAdmin = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        get: (key: string) => event.cookies.get(key),
        set: (key: string, value: string, options) => event.cookies.set(key, value, { path: '/', ...options }),
        remove: (key: string, options) => event.cookies.delete(key, { path: '/', ...options })
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  return resolve(event);
};


