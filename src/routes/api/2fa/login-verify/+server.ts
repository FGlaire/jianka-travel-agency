import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { email, code } = await request.json();
    
    console.log('2FA login verification request:', { email, code: code ? 'provided' : 'missing' });
    
    if (!email || !code) {
      return json({ error: 'Email and code are required' }, { status: 400 });
    }

    // For now, let's implement a simple solution using environment variables
    // This is a temporary fix until we can properly configure the admin API
    
    // Check if we have a service role key configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('Service role key not configured');
      return json({ 
        error: '2FA verification service not properly configured',
        details: 'Please contact support'
      }, { status: 503 });
    }

    // Try to get user by email using admin API with service role
    if (!locals.supabaseAdmin) {
      console.error('Admin client not available');
      return json({ 
        error: '2FA verification service not properly configured',
        details: 'Admin client not available'
      }, { status: 503 });
    }

    const { data: { users }, error: userError } = await locals.supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      console.error('UserError details:', userError.message, userError.status);
      
      return json({ 
        error: 'Failed to verify user credentials',
        details: 'Please try again or contact support'
      }, { status: 500 });
    }

    console.log('Found users:', users.length);
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found for email:', email);
      return json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.email, 'Metadata:', user.user_metadata);

    // Check if user has 2FA enabled
    const twoFactorEnabled = user.user_metadata?.two_factor_enabled;
    const twoFactorSecret = user.user_metadata?.two_factor_secret;

    console.log('2FA status:', { enabled: twoFactorEnabled, hasSecret: !!twoFactorSecret });

    if (!twoFactorEnabled || !twoFactorSecret) {
      console.log('2FA not properly configured for user');
      return json({ error: '2FA not enabled for this user' }, { status: 400 });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    console.log('Code verification result:', verified);

    if (verified) {
      console.log('2FA verification successful for user:', email);
      
      // Create a session for the user after successful 2FA verification
      const { data: sessionData, error: sessionError } = await locals.supabaseAdmin.auth.admin.createSession({
        user_id: user.id,
        expires_in: 60 * 60 * 24 * 7 // 7 days
      });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return json({ error: 'Failed to create session' }, { status: 500 });
      }

      console.log('Session created successfully');
      return json({ 
        success: true,
        user: sessionData.user,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token
        }
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
