import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use service role to check user's Google connection
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Try to get google_email, but handle if column doesn't exist
    let profile = null;
    let error = null;
    
    try {
      const result = await supabaseAdmin
        .from('profiles')
        .select('google_access_token, google_refresh_token, google_email')
        .eq('id', userId)
        .single();
      profile = result.data;
      error = result.error;
    } catch {
      // If google_email column doesn't exist, try without it
      const result = await supabaseAdmin
        .from('profiles')
        .select('google_access_token, google_refresh_token')
        .eq('id', userId)
        .single();
      profile = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ connected: false, email: null });
    }

    const connected = !!(profile?.google_access_token && profile?.google_refresh_token);

    return NextResponse.json({
      connected,
      email: (profile as { google_email?: string })?.google_email || null,
    });
  } catch (error) {
    console.error('Error checking Google status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
