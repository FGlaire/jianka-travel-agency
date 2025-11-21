import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, request }) => {
  try {
    console.log('GET /api/csv-files - Starting request v2');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try multiple authentication methods
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('Session data:', sessionData);
    console.log('Session error:', sessionError);
    
    // Also try getUser as fallback
    const { data: userData, error: userError } = await locals.supabase.auth.getUser();
    console.log('User data:', userData);
    console.log('User error:', userError);
    
    // Try to get user from session token directly
    let user = sessionData?.session?.user || userData?.user;
    
    // If user is still null, try to refresh the session
    if (!user && sessionData?.session) {
      console.log('User is null, trying to refresh session...');
      const { data: refreshData, error: refreshError } = await locals.supabase.auth.refreshSession();
      console.log('Refresh data:', refreshData);
      console.log('Refresh error:', refreshError);
      user = refreshData?.session?.user || user;
    }
    
    // If still no user, try using admin client to verify the session
    if (!user && sessionData?.session?.access_token && locals.supabaseAdmin) {
      console.log('Still no user, trying admin client verification...');
      try {
        const { data: adminUser, error: adminError } = await locals.supabaseAdmin.auth.getUser(sessionData.session.access_token);
        console.log('Admin user:', adminUser);
        console.log('Admin error:', adminError);
        if (adminUser?.user) {
          user = adminUser.user;
          console.log('Got user from admin client:', user);
        }
      } catch (adminErr) {
        console.log('Admin client error:', adminErr);
      }
    }
    
    console.log('Selected user:', user ? 'Found' : 'Not found');
    console.log('Session user:', sessionData?.session?.user);
    console.log('GetUser user:', userData?.user);
    console.log('Final user object:', user);
    
    if (!user) {
      console.log('No user found, returning 401');
      return json({ 
        error: 'Unauthorized', 
        debug: {
          sessionData: !!sessionData,
          sessionError,
          userData: !!userData,
          userError,
          sessionUser: sessionData?.session?.user,
          getUserUser: userData?.user,
          finalUser: user
        }
      }, { status: 401 });
    }

    console.log('Fetching CSV files for user:', user.id);
    
    // First check if the table exists
    const { data: tableCheck, error: tableError } = await locals.supabase
      .from('csv_files')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table check error:', tableError);
      if (tableError.code === 'PGRST116') {
        return json({ error: 'Database table not found. Please run the database schema setup.', details: tableError }, { status: 500 });
      }
      return json({ error: 'Database error', details: tableError }, { status: 500 });
    }
    
    // Get user's CSV files
    const { data: csvFiles, error } = await locals.supabase
      .from('csv_files')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching CSV files:', error);
      return json({ error: 'Failed to fetch CSV files', details: error }, { status: 500 });
    }

    console.log('Found CSV files:', csvFiles?.length || 0);
    return json({ csvFiles });
  } catch (error) {
    console.error('Error in GET /api/csv-files:', error);
    return json({ error: 'Internal server error', details: error }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    console.log('POST /api/csv-files - Starting request v2');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try multiple authentication methods
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('Session data:', sessionData);
    console.log('Session error:', sessionError);
    
    // Also try getUser as fallback
    const { data: userData, error: userError } = await locals.supabase.auth.getUser();
    console.log('User data:', userData);
    console.log('User error:', userError);
    
    // Try to get user from session token directly
    let user = sessionData?.session?.user || userData?.user;
    
    // If user is still null, try to refresh the session
    if (!user && sessionData?.session) {
      console.log('User is null, trying to refresh session...');
      const { data: refreshData, error: refreshError } = await locals.supabase.auth.refreshSession();
      console.log('Refresh data:', refreshData);
      console.log('Refresh error:', refreshError);
      user = refreshData?.session?.user || user;
    }
    
    // If still no user, try using admin client to verify the session
    if (!user && sessionData?.session?.access_token && locals.supabaseAdmin) {
      console.log('Still no user, trying admin client verification...');
      try {
        const { data: adminUser, error: adminError } = await locals.supabaseAdmin.auth.getUser(sessionData.session.access_token);
        console.log('Admin user:', adminUser);
        console.log('Admin error:', adminError);
        if (adminUser?.user) {
          user = adminUser.user;
          console.log('Got user from admin client:', user);
        }
      } catch (adminErr) {
        console.log('Admin client error:', adminErr);
      }
    }
    
    console.log('Selected user:', user ? 'Found' : 'Not found');
    console.log('Session user:', sessionData?.session?.user);
    console.log('GetUser user:', userData?.user);
    console.log('Final user object:', user);
    
    if (!user) {
      console.log('No user found, returning 401');
      return json({ 
        error: 'Unauthorized', 
        debug: {
          sessionData: !!sessionData,
          sessionError,
          userData: !!userData,
          userError,
          sessionUser: sessionData?.session?.user,
          getUserUser: userData?.user,
          finalUser: user
        }
      }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, fileData, columns, templateId, columnValidation, extractionResults } = body;
    console.log('Received CSV file data:', { fileName, fileSize, columns: columns?.length, templateId });

    if (!fileName || !fileData || !columns) {
      console.log('Missing required fields');
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First check if the table exists
    const { data: tableCheck, error: tableError } = await locals.supabase
      .from('csv_files')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('Table check error:', tableError);
      if (tableError.code === 'PGRST116') {
        return json({ error: 'Database table not found. Please run the database schema setup.', details: tableError }, { status: 500 });
      }
      return json({ error: 'Database error', details: tableError }, { status: 500 });
    }

    // Build insert object (templateId will be ignored if column doesn't exist)
    const insertData: any = {
      user_id: user.id,
      file_name: fileName,
      file_size: fileSize || 0,
      file_data: fileData,
      columns: columns,
      column_validation: columnValidation,
      extraction_results: extractionResults
    };
    
    // Add templateId if provided (will be ignored if column doesn't exist in DB)
    if (templateId) {
      insertData.template_id = templateId;
    }

    // Insert CSV file into database
    const { data: csvFile, error } = await locals.supabase
      .from('csv_files')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving CSV file:', error);
      return json({ error: 'Failed to save CSV file', details: error }, { status: 500 });
    }

    console.log('CSV file saved successfully:', csvFile.id);
    return json({ csvFile });
  } catch (error) {
    console.error('Error in POST /api/csv-files:', error);
    return json({ error: 'Internal server error', details: error }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return json({ error: 'File ID is required' }, { status: 400 });
    }

    // Delete CSV file from database
    const { error } = await locals.supabase
      .from('csv_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', user.id); // Ensure user can only delete their own files

    if (error) {
      console.error('Error deleting CSV file:', error);
      return json({ error: 'Failed to delete CSV file' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/csv-files:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
