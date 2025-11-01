import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSheetsClient } from '@/lib/google-sheets';
import { getCurrentUser } from '@/lib/supabase';
import { updateForm } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId, spreadsheetId, sheetName, headers } = await request.json();

    if (!formId || !spreadsheetId || !sheetName || !headers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get authenticated Google Sheets client
    const { client, error } = await getAuthenticatedSheetsClient(user.id);
    
    if (error || !client) {
      return NextResponse.json({ error: error || 'Failed to get authenticated client' }, { status: 500 });
    }

    try {
      // Create a new sheet in the existing spreadsheet
      const addSheetResponse = await client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          }],
        },
      });

      const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
      
      if (!newSheetId) {
        throw new Error('Failed to create new sheet');
      }

      // Add headers to the new sheet
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Timestamp', ...headers]],
        },
      });

      // Get spreadsheet info
      const spreadsheetInfo = await client.spreadsheets.get({
        spreadsheetId,
      });

      // Update form with Google Sheet ID and URL
      const { error: updateError } = await updateForm(formId, {
        google_sheet_id: spreadsheetId,
        google_sheet_url: spreadsheetInfo.data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      });

      if (updateError) {
        console.error('Error updating form with sheet ID:', updateError);
        return NextResponse.json({ error: 'Failed to link spreadsheet to form' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        spreadsheet: {
          id: spreadsheetId,
          url: spreadsheetInfo.data.spreadsheetUrl,
          title: spreadsheetInfo.data.properties?.title,
          sheetName,
        },
      });
    } catch (error: unknown) {
      console.error('Error creating sheet:', error);
      
      const err = error as { code?: number; message?: string };
      if (err.code === 404) {
        return NextResponse.json({ error: 'Spreadsheet not found. Please check permissions.' }, { status: 404 });
      } else if (err.code === 403) {
        return NextResponse.json({ error: 'Access denied. Please make sure you have edit permissions.' }, { status: 403 });
      }
      
      return NextResponse.json({ error: err.message || 'Failed to create sheet in spreadsheet' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in sheets connect-with-sheet API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}