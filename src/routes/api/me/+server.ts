import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  const { data: { user }, error } = await locals.supabase.auth.getUser();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ user }), { headers: { 'content-type': 'application/json' } });
};


