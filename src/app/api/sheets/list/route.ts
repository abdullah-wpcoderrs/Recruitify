import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's Google tokens using service role
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_access_token, google_refresh_token')
      .eq('id', userId)
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

    // Get list of spreadsheets from Google Drive
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name, webViewLink, modifiedTime, createdTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50,
    });

    const spreadsheets = response.data.files?.map(file => ({
      id: file.id!,
      name: file.name!,
      url: file.webViewLink!,
      modifiedTime: file.modifiedTime!,
      createdTime: file.createdTime!,
    })) || [];

    return NextResponse.json({ spreadsheets });
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    return NextResponse.json({ error: 'Failed to list spreadsheets' }, { status: 500 });
  }
}
