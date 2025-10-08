import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
  try {
    const { user } = await locals.supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

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
