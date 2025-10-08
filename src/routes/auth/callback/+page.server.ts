import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const type = url.searchParams.get('type');

  console.log('Auth callback received:', { 
    code: code ? 'present' : 'missing', 
    next, 
    type: type || 'unknown',
    allParams: Object.fromEntries(url.searchParams.entries())
  });

  if (code) {
    const { error: err } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (err) {
      console.error('Auth callback error:', err);
      throw error(400, 'Invalid or expired code');
    }
    console.log('Auth callback successful, redirecting to:', next);
  } else {
    console.log('No code provided, redirecting to:', next);
  }

  throw redirect(301, next);
};
