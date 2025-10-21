import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Use environment variables instead of hard-coded values
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://jddbbnnbcsuktoevxeij.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZGJibm5iY3N1a3RvZXZ4ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzU5NzQsImV4cCI6MjA3NTMxMTk3NH0.DAwZSEM4746rvDQIk7YJL9b_08qAxITjoqk-j5BGhzE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: browser ? window.localStorage : undefined,
    storageKey: 'sb-jddbbnnbcsuktoevxeij-auth-token'
  }
});


