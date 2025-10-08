import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { data: { user } } = await locals.supabase.auth.getUser();
  
  return {
    user
  };
};
