import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { formId, spreadsheetId, sheetName, headers } = await request.json();

    if (!formId || !spreadsheetId || !sheetName) {
      return NextResponse.json(
        { error: 'Form ID, spreadsheet ID, and sheet name are required' },
        { status: 400 }
      );
    }

    // Get form to verify it exists and get user ID
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

    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('user_id')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get user's Google tokens
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', form.user_id)
      .single();

    if (profileError || !profile?.google_access_token) {
      return NextResponse.json({ error: 'Google account not connected' }, { status: 401 });
    }

    // Initialize Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: profile.google_access_token,
      refresh_token: profile.google_refresh_token,
    });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Create a new sheet in the existing spreadsheet
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

    // Add headers to the new sheet
    if (headers && headers.length > 0) {
      const headerRow = ['Timestamp', ...headers];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headerRow],
        },
      });

      // Format header row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: newSheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }

    // Get spreadsheet URL
    const spreadsheetResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const spreadsheetUrl = spreadsheetResponse.data.spreadsheetUrl;

    // Update form with Google Sheet info
    const { error: updateError } = await supabaseAdmin
      .from('forms')
      .update({
        google_sheet_id: spreadsheetId,
        google_sheet_url: spreadsheetUrl,
        google_sheet_name: sheetName,
      })
      .eq('id', formId);

    if (updateError) {
      console.error('Error updating form:', updateError);
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      sheetName,
    });
  } catch (error) {
    console.error('Error connecting to spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to connect to spreadsheet' },
      { status: 500 }
    );
  }
}
