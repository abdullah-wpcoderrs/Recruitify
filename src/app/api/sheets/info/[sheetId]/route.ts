import { NextRequest, NextResponse } from 'next/server';
import { getSpreadsheetInfo } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sheetId: string }> }
) {
  try {
    const { user, error: authError } = await getCurrentUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sheetId } = await params;

    const { info, error } = await getSpreadsheetInfo(user.id, sheetId);
    
    if (error) {
      return NextResponse.json({ error: 'Failed to get spreadsheet info' }, { status: 500 });
    }

    return NextResponse.json({ info });
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}