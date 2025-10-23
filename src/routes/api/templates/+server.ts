import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    console.log('🔄 GET /api/templates - Starting request');
    
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    console.log('📡 Session data:', { 
      hasSession: !!sessionData?.session, 
      hasUser: !!sessionData?.session?.user,
      sessionError: sessionError?.message 
    });
    
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.log('❌ No user found, returning 401');
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get user's templates and public templates
    const { data: templates, error } = await locals.supabase
      .from('templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching templates:', error);
      return json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    console.log('✅ Templates fetched:', templates?.length || 0);
    return json({ templates: templates || [] });
  } catch (error) {
    console.error('❌ Error in GET /api/templates:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateName, description, fieldMappings, isPublic } = body;

    if (!templateName || !fieldMappings) {
      return json({ error: 'Template name and field mappings are required' }, { status: 400 });
    }

    // Check if template name already exists for this user
    const { data: existingTemplate } = await locals.supabase
      .from('templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_name', templateName)
      .single();

    if (existingTemplate) {
      return json({ error: 'Template name already exists' }, { status: 400 });
    }

    // Insert template into database
    const { data: template, error } = await locals.supabase
      .from('templates')
      .insert({
        user_id: user.id,
        template_name: templateName,
        description: description || '',
        field_mappings: fieldMappings,
        is_public: isPublic || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving template:', error);
      return json({ error: 'Failed to save template' }, { status: 500 });
    }

    return json({ template });
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, templateName, description, fieldMappings, isPublic } = body;

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Update template
    const { data: template, error } = await locals.supabase
      .from('templates')
      .update({
        template_name: templateName,
        description: description,
        field_mappings: fieldMappings,
        is_public: isPublic
      })
      .eq('id', templateId)
      .eq('user_id', user.id) // Ensure user can only update their own templates
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return json({ error: 'Failed to update template' }, { status: 500 });
    }

    return json({ template });
  } catch (error) {
    console.error('Error in PUT /api/templates:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const { data: sessionData, error: sessionError } = await locals.supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await request.json();

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Delete template from database
    const { error } = await locals.supabase
      .from('templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id) // Ensure user can only delete their own templates
      .neq('is_default', true); // Prevent deletion of default templates

    if (error) {
      console.error('Error deleting template:', error);
      return json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/templates:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
