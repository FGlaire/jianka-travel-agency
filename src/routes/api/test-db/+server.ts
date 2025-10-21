import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('Session test:', { sessionData: !!sessionData, sessionError });
    
    // Test 2: Check if csv_files table exists
    const { data: tableCheck, error: tableError } = await locals.supabase
      .from('csv_files')
      .select('count')
      .limit(1);
    
    console.log('Table check:', { tableCheck, tableError });
    
    // Test 3: Check if templates table exists
    const { data: templateCheck, error: templateError } = await locals.supabase
      .from('templates')
      .select('count')
      .limit(1);
    
    console.log('Template check:', { templateCheck, templateError });
    
    return json({
      session: !!sessionData,
      sessionError,
      csvTableExists: !tableError,
      csvTableError: tableError,
      templateTableExists: !templateError,
      templateTableError: templateError
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return json({ error: 'Database test failed', details: error }, { status: 500 });
  }
};
