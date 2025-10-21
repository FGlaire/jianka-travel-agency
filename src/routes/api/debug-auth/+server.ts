import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, request }) => {
  try {
    console.log('=== DEBUG AUTH ENDPOINT ===');
    
    // Check environment variables
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment variables:');
    console.log('PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'SET' : 'NOT SET');
    
    // Check request headers
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    console.log('Request headers:');
    console.log('Authorization:', authHeader ? 'PRESENT' : 'NOT PRESENT');
    console.log('Cookie:', cookieHeader ? 'PRESENT' : 'NOT PRESENT');
    
    // Try to get session
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('Session data:', sessionData);
    console.log('Session error:', sessionError);
    
    // Try to get user
    const { data: userData, error: userError } = await locals.supabase.auth.getUser();
    console.log('User data:', userData);
    console.log('User error:', userError);
    
    // Check if admin client exists
    const hasAdminClient = !!locals.supabaseAdmin;
    console.log('Admin client available:', hasAdminClient);
    
    return json({
      environment: {
        supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
        supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET',
        supabaseServiceRoleKey: supabaseServiceRoleKey ? 'SET' : 'NOT SET'
      },
      request: {
        hasAuthHeader: !!authHeader,
        hasCookie: !!cookieHeader
      },
      session: {
        hasSession: !!sessionData?.session,
        hasUser: !!sessionData?.session?.user,
        sessionError: sessionError?.message || null
      },
      user: {
        hasUser: !!userData?.user,
        userError: userError?.message || null
      },
      admin: {
        available: hasAdminClient
      }
    });
  } catch (error: any) {
    console.error('Debug auth error:', error);
    return json({ error: 'Debug failed', details: error.message }, { status: 500 });
  }
};
