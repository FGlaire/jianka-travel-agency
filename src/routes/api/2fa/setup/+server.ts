import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { user } = await locals.supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

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
