import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const { data: { user } } = await locals.supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's CSV files
    const { data: csvFiles, error } = await locals.supabase
      .from('csv_files')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });

    if (error) {
      console.error('Error fetching CSV files:', error);
      return json({ error: 'Failed to fetch CSV files' }, { status: 500 });
    }

    return json({ csvFiles });
  } catch (error) {
    console.error('Error in GET /api/csv-files:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { user } } = await locals.supabase.auth.getUser();
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileSize, fileData, columns, columnValidation, extractionResults } = body;

    if (!fileName || !fileData || !columns) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert CSV file into database
    const { data: csvFile, error } = await locals.supabase
      .from('csv_files')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize || 0,
        file_data: fileData,
        columns: columns,
        column_validation: columnValidation,
        extraction_results: extractionResults
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving CSV file:', error);
      return json({ error: 'Failed to save CSV file' }, { status: 500 });
    }

    return json({ csvFile });
  } catch (error) {
    console.error('Error in POST /api/csv-files:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: { user } } = await locals.supabase.auth.getUser();
    
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
