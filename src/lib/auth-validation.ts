import { supabase } from './supabase';

export const validateUserExists = async (userId: string): Promise<boolean> => {
  try {
    // Check if profile exists (profiles are automatically created/deleted with auth users via triggers)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !profileError && !!profile;
  } catch {
    return false;
  }
};

export const forceSignOut = async () => {
  // Clear all auth data
  await supabase.auth.signOut();
  
  // Clear localStorage manually (in case of stale data)
  if (typeof window !== 'undefined') {
    // Clear all possible Supabase storage keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }
};