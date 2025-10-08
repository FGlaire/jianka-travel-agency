import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
  try {
    // Try multiple methods to get the user
    let user = null;
    
    // Method 1: Try getSession
    const { data: { session }, error: sessionError } = await locals.supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
    }
    
    // Method 2: Try getUser if session failed
    if (!user) {
      const { data: { user: authUser }, error: userError } = await locals.supabase.auth.getUser();
      if (authUser) {
        user = authUser;
      }
    }
    
    if (!user) {
      console.error('No user found. Session error:', sessionError);
      console.error('Available cookies:', cookies.getAll());
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('User found:', user.email);

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: 'JIANKA Travel Agency',
      length: 32
    });

    // Generate QR code
    let qrCodeDataURL = '';
    if (secret.otpauth_url) {
      qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
    }

    return json({
      secret: secret.base32,
      qrCode: qrCodeDataURL
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return json({ error: 'Failed to generate 2FA setup' }, { status: 500 });
  }
};
