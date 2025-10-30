import { NextRequest } from 'next/server';
import { supabase } from './supabase';

export async function validateApiUser(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: 'Invalid token' };
    }

    // Additional validation: check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { user: null, error: 'User profile not found' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('API auth validation error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// Middleware for API routes
export function withAuth(handler: (request: NextRequest, context: Record<string, unknown>) => Promise<Response>) {
  return async (request: NextRequest, context: Record<string, unknown>) => {
    const { user, error } = await validateApiUser(request);
    
    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Add user to request context
    (request as NextRequest & { user?: unknown }).user = user;
    
    return handler(request, context);
  };
}