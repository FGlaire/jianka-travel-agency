import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get the session from cookies
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError);
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = session.user;

    const { secret, code } = await request.json();

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (verified) {
      // Update user metadata to enable 2FA
      const { error } = await locals.supabase.auth.updateUser({
        data: { 
          two_factor_enabled: true, 
          two_factor_secret: secret 
        }
      });

      if (error) {
        return json({ error: error.message }, { status: 500 });
      }

      return json({ success: true });
    } else {
      return json({ error: 'Invalid verification code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    return json({ error: 'Failed to verify 2FA setup' }, { status: 500 });
  }
};
