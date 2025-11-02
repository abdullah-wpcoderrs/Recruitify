import { NextRequest, NextResponse } from 'next/server';
import { updateSpreadsheetHeaders } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { userId, spreadsheetId, fields } = await request.json();

    if (!userId || !spreadsheetId || !fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update spreadsheet headers
    const { error } = await updateSpreadsheetHeaders(userId, spreadsheetId, fields);
    
    if (error) {
      console.error('Error updating spreadsheet headers:', error);
      return NextResponse.json({ error: 'Failed to update headers' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Headers updated successfully',
    });
  } catch (error) {
    console.error('Error in update headers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
