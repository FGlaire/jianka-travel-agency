import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

export const handle: Handle = async ({ event, resolve }) => {
  // Get environment variables with fallbacks
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://jddbbnnbcsuktoevxeij.supabase.co';
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZGJibm5iY3N1a3RvZXZ4ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzU5NzQsImV4cCI6MjA3NTMxMTk3NH0.DAwZSEM4746rvDQIk7YJL9b_08qAxITjoqk-j5BGhzE';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Create regular client for user operations
  event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (key: string) => event.cookies.get(key),
      set: (key: string, value: string, options) => {
        event.cookies.set(key, value, { 
          path: '/', 
          httpOnly: false, // Allow client-side access
          secure: true,
          sameSite: 'lax',
          ...options 
        });
      },
      remove: (key: string, options) => {
        event.cookies.delete(key, { 
          path: '/', 
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          ...options 
        });
      }
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
    console.log('Creating admin client with service role key');
    event.locals.supabaseAdmin = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        get: (key: string) => event.cookies.get(key),
        set: (key: string, value: string, options) => {
          event.cookies.set(key, value, { 
            path: '/', 
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            ...options 
          });
        },
        remove: (key: string, options) => {
          event.cookies.delete(key, { 
            path: '/', 
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            ...options 
          });
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    console.log('Admin client created successfully');
  } else {
    console.log('Service role key not available, admin client not created');
  }

  return resolve(event);
};


