import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
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
