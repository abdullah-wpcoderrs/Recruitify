import { NextRequest, NextResponse } from 'next/server';
import { connectToExistingSpreadsheet } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { formId, spreadsheetUrl, headers, userId } = await request.json();

    if (!formId || !spreadsheetUrl || !headers || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to existing spreadsheet
    const { success, spreadsheet, error } = await connectToExistingSpreadsheet(
      userId, 
      spreadsheetUrl, 
      headers
    );
    
    if (!success || error) {
      return NextResponse.json({ error: error || 'Failed to connect to spreadsheet' }, { status: 400 });
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
        google_sheet_id: spreadsheet!.id,
        google_sheet_url: spreadsheet!.url,
        google_sheet_name: spreadsheet!.title,
      })
      .eq('id', formId);

    if (updateError) {
      console.error('Error updating form with sheet ID:', updateError);
      return NextResponse.json({
        success: true,
        spreadsheet,
        warning: 'Spreadsheet connected but form link may need to be updated after saving the form',
      });
    }

    return NextResponse.json({
      success: true,
      spreadsheet,
    });
  } catch (error) {
    console.error('Error in sheets connect API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}