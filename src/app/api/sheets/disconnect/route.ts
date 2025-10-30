import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = await request.json();

    if (!formId) {
      return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
    }

    // Remove Google Sheet ID from form
    const { error: updateError } = await updateForm(formId, {
      google_sheet_id: undefined,
    });

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