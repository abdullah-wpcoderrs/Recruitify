import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use service role to update user's profile
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

    // Try to update with google_email, but fall back if column doesn't exist
    let error = null;
    try {
      const result = await supabaseAdmin
        .from('profiles')
        .update({
          google_access_token: null,
          google_refresh_token: null,
          google_email: null,
        })
        .eq('id', userId);
      error = result.error;
    } catch {
      // If google_email column doesn't exist, update without it
      const result = await supabaseAdmin
        .from('profiles')
        .update({
          google_access_token: null,
          google_refresh_token: null,
        })
        .eq('id', userId);
      error = result.error;
    }

    if (error) {
      console.error('Error disconnecting Google:', error);
      return NextResponse.json({ error: 'Failed to disconnect Google account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Google:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
