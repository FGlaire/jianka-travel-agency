import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
  try {
    // Get the session from cookies
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = session.user;

    // Update user metadata to disable 2FA
    const { error } = await locals.supabase.auth.updateUser({
      data: { 
        two_factor_enabled: false, 
        two_factor_secret: null 
      }
    });

    if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('2FA disable error:', error);
    return json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
};
