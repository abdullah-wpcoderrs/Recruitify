import { NextRequest, NextResponse } from 'next/server';
import { connectToExistingSpreadsheet } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, spreadsheetUrl, headers } = await request.json();

    if (!formId || !spreadsheetUrl || !headers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Connect to existing spreadsheet
    const { success, spreadsheet, error } = await connectToExistingSpreadsheet(
      user.id, 
      spreadsheetUrl, 
      headers
    );
    
    if (!success || error) {
      return NextResponse.json({ error: error || 'Failed to connect to spreadsheet' }, { status: 400 });
    }

    // Update form with Google Sheet ID
    const { error: updateError } = await updateForm(formId, {
      google_sheet_id: spreadsheet!.id,
    });

    if (updateError) {
      console.error('Error updating form with sheet ID:', updateError);
      return NextResponse.json({ error: 'Failed to link spreadsheet to form' }, { status: 500 });
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