import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = typeof window !== 'undefined' 
  ? (window as any).PUBLIC_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  : process.env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

const supabaseAnonKey = typeof window !== 'undefined'
  ? (window as any).PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  : process.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});


