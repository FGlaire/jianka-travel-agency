import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  console.log('Auth callback received:', { code: code ? 'present' : 'missing', next });

  if (code) {
    const { error: err } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (err) {
      console.error('Auth callback error:', err);
      throw error(400, 'Invalid or expired code');
    }
    console.log('Auth callback successful, redirecting to:', next);
  }

  throw redirect(301, next);
};
