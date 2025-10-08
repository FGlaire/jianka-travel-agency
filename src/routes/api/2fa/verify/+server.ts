import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    let user = null;
    
    // Method 1: Try to get user from session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    
    if (session?.user) {
      user = session.user;
    } else if (authHeader) {
      // Method 2: If no session but we have auth header, try to verify the JWT directly
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: jwtUser }, error: jwtError } = await locals.supabase.auth.getUser(token);
      
      if (jwtUser) {
        user = jwtUser;
      }
    }
    
    if (!user) {
      console.error('No user found after trying all methods');
      return json({ error: 'Not authenticated - please log in again' }, { status: 401 });
    }

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
