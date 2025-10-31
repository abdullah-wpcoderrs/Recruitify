import { NextRequest, NextResponse } from 'next/server';
import { listUserSpreadsheets } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // List user's spreadsheets
    const { spreadsheets, error } = await listUserSpreadsheets(user.id);
    
    if (error) {
      console.error('Error listing spreadsheets:', error);
      return NextResponse.json({ error: 'Failed to list spreadsheets' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      spreadsheets,
    });
  } catch (error) {
    console.error('Error in sheets list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}