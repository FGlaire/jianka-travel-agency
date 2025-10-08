import { createClient } from '@supabase/supabase-js';

// Get environment variables - try multiple methods for Vercel compatibility
const supabaseUrl = 
  import.meta.env.PUBLIC_SUPABASE_URL || 
  import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  (typeof window !== 'undefined' && (window as any).PUBLIC_SUPABASE_URL) ||
  'https://placeholder.supabase.co';

const supabaseAnonKey = 
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof window !== 'undefined' && (window as any).PUBLIC_SUPABASE_ANON_KEY) ||
  'placeholder-key';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('All env vars:', import.meta.env);
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');
  console.log('Is placeholder URL?', supabaseUrl.includes('placeholder'));
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});


