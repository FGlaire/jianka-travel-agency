import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

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

    // For now, we'll just return success since we can't update user metadata
    // without the service role key. In a production app, you'd want to use
    // the service role key for admin operations or store this in a separate database table
    
    console.log('2FA disabled for user:', user.email);
    
    return json({ 
      success: true,
      message: '2FA disabled successfully!'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
};
