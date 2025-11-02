import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { formId, userId } = await request.json();

    if (!formId || !userId) {
      return NextResponse.json({ error: 'Form ID and User ID are required' }, { status: 400 });
    }

    // Use service role to update form
    const { createClient } = await import('@supabase/supabase-js');
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

    // Remove Google Sheet info from form
    const { error: updateError } = await supabaseAdmin
      .from('forms')
      .update({
        google_sheet_id: null,
        google_sheet_url: null,
        google_sheet_name: null,
      })
      .eq('id', formId)
      .eq('user_id', userId); // Ensure user owns the form

    if (updateError) {
      console.error('Error disconnecting spreadsheet from form:', updateError);
      return NextResponse.json({ error: 'Failed to disconnect spreadsheet' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet disconnected successfully',
    });
  } catch (error) {
    console.error('Error in sheets disconnect API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}