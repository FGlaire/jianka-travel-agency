import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const type = url.searchParams.get('type');

  console.log('Auth callback received (server):', { 
    code: code ? 'present' : 'missing', 
    next, 
    type: type || 'unknown',
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  if (code) {
    const { data, error: err } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (err) {
      console.error('Auth callback error (server):', err);
      throw error(400, 'Invalid or expired code');
    }
    
    console.log('Auth callback successful (server):', {
      user: data.user ? 'present' : 'missing',
      session: data.session ? 'present' : 'missing',
      redirectingTo: next
    });
    
    // Set the session in the response headers for client-side access
    if (data.session) {
      locals.supabase.auth.setSession(data.session);
    }
  } else {
    console.log('No code provided (server), redirecting to:', next);
  }

  throw redirect(301, next);
};
