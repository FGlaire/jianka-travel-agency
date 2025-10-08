import { createClient } from '@supabase/supabase-js';

// Hard-coded values for now to test (replace with your actual values)
const supabaseUrl = 'https://jddbbnnbcsuktoevxeij.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZGJibm5iY3N1a3RvZXZ4ZWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzU5NzQsImV4cCI6MjA3NTMxMTk3NH0.DAwZSEM4746rvDQIk7YJL9b_08qAxITjoqk-j5BGhzE';

// Debug logging removed for security - v2.0

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});


