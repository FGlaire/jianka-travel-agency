import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Get user from email
    const { data: { users }, error: userError } = await locals.supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return json({ error: 'Failed to verify user' }, { status: 500 });
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has 2FA enabled
    const twoFactorEnabled = user.user_metadata?.two_factor_enabled;
    const twoFactorSecret = user.user_metadata?.two_factor_secret;

    if (!twoFactorEnabled || !twoFactorSecret) {
      return json({ error: '2FA not enabled for this user' }, { status: 400 });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (verified) {
      console.log('2FA verification successful for user:', email);
      
      // Create a session for the user after successful 2FA verification
      // We'll use the admin API to create a session
      const { data: sessionData, error: sessionError } = await locals.supabase.auth.admin.createSession({
        user_id: user.id,
        expires_in: 60 * 60 * 24 * 7 // 7 days
      });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return json({ error: 'Failed to create session' }, { status: 500 });
      }

      // Set the session in the response
      const { data: setSessionData, error: setSessionError } = await locals.supabase.auth.setSession({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token
      });

      if (setSessionError) {
        console.error('Error setting session:', setSessionError);
        return json({ error: 'Failed to set session' }, { status: 500 });
      }

      return json({ 
        success: true,
        user: sessionData.user
      });
    } else {
      console.log('Invalid 2FA code for user:', email);
      return json({ error: 'Invalid verification code' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA login verification error:', error);
    return json({ error: 'Failed to verify 2FA code' }, { status: 500 });
  }
};
