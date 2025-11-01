import { NextRequest, NextResponse } from 'next/server';
import { createSpreadsheet } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { formId, title, headers, userId } = await request.json();

    if (!formId || !title || !headers || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create spreadsheet
    const { spreadsheet, error } = await createSpreadsheet(userId, title, headers);
    
    if (error || !spreadsheet) {
      console.error('Error creating spreadsheet:', error);
      return NextResponse.json({ error: 'Failed to create spreadsheet' }, { status: 500 });
    }

    // Update form with Google Sheet ID using service role
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

    const { error: updateError } = await supabaseAdmin
      .from('forms')
      .update({
        google_sheet_id: spreadsheet.id,
        google_sheet_url: spreadsheet.url,
        google_sheet_name: spreadsheet.title,
      })
      .eq('id', formId);

    if (updateError) {
      console.error('Error updating form with sheet ID:', updateError);
      // Don't fail the request if form update fails - spreadsheet was created successfully
      // Return success with a warning
      return NextResponse.json({
        success: true,
        spreadsheet,
        warning: 'Spreadsheet created but form link may need to be updated after saving the form',
      });
    }

    return NextResponse.json({
      success: true,
      spreadsheet,
    });
  } catch (error) {
    console.error('Error in sheets create API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}