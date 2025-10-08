import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (code) {
    const { error: err } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (err) {
      throw error(400, 'Invalid or expired code');
    }
  }

  throw redirect(301, next);
};
