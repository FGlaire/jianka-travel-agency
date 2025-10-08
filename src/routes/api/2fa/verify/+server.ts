import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader);
    
    let user = null;
    
    // Method 1: Try to get user from session
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('Session:', session ? 'exists' : 'null');
    console.log('Session error:', sessionError);
    
    if (session?.user) {
      user = session.user;
    } else if (authHeader) {
      // Method 2: If no session but we have auth header, try to verify the JWT directly
      const token = authHeader.replace('Bearer ', '');
      console.log('Trying to verify JWT directly...');
      
      const { data: { user: jwtUser }, error: jwtError } = await locals.supabase.auth.getUser(token);
      console.log('JWT verification result:', jwtUser ? 'success' : 'failed');
      console.log('JWT error:', jwtError);
      
      if (jwtUser) {
        user = jwtUser;
      }
    }
    
    if (!user) {
      console.error('No user found after trying all methods');
      return json({ error: 'Not authenticated - please log in again' }, { status: 401 });
    }

    console.log('User found:', user.email);

    const { secret, code } = await request.json();
    console.log('Secret received:', secret ? 'yes' : 'no');
    console.log('Code received:', code);

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    console.log('Verification result:', verified);

    if (verified) {
      // Update user metadata to enable 2FA
      const { error } = await locals.supabase.auth.updateUser({
        data: { 
          two_factor_enabled: true, 
          two_factor_secret: secret 
        }
      });

      if (error) {
        console.error('Error updating user:', error);
        return json({ error: error.message }, { status: 500 });
      }

      console.log('2FA enabled successfully for user:', user.email);
      return json({ success: true });
    } else {
      console.log('Invalid verification code provided');
      return json({ error: 'Invalid verification code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    return json({ error: 'Failed to verify 2FA setup' }, { status: 500 });
  }
};
