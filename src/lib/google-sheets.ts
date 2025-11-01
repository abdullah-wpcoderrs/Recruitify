import { google } from 'googleapis';
import { supabase } from './supabase';

// Google Sheets API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly' // Add Drive API for listing spreadsheets
];

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  headers: string[];
}

// Create OAuth2 client
export const createOAuth2Client = () => {
  // Use NEXTAUTH_URL if available, otherwise construct from current environment
  const baseUrl = process.env.NEXTAUTH_URL || 
                  (process.env.NODE_ENV === 'production' 
                    ? 'https://your-domain.com' // Replace with your production domain
                    : 'http://localhost:3000');
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/auth/google/callback`
  );
};

// Generate OAuth URL for Google Sheets access
export const getGoogleSheetsAuthUrl = (userId: string, formId?: string, source?: 'builder' | 'analytics') => {
  const oauth2Client = createOAuth2Client();
  
  // Include userId, formId, and source in state for proper redirect
  const state = JSON.stringify({ userId, formId, source });
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state, // Pass user ID, form ID, and source to identify context after OAuth
    prompt: 'consent', // Force consent screen to get refresh token
  });
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (code: string) => {
  const oauth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return { tokens, error: null };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return { tokens: null, error };
  }
};

// Store Google tokens in user profile
export const storeGoogleTokens = async (userId: string, tokens: { access_token?: string | null; refresh_token?: string | null }) => {
  console.log('Storing Google tokens for user:', userId, { 
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token 
  });
  
  // Use service role key for server-side operations to bypass RLS
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
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
    })
    .eq('id', userId);

  if (error) {
    console.error('Error storing Google tokens:', error);
  } else {
    console.log('Google tokens stored successfully for user:', userId);
  }

  return { error };
};

// Get authenticated Google Sheets client
export const getAuthenticatedSheetsClient = async (userId: string) => {
  // Use service role key to bypass RLS for reading tokens
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

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .limit(1);

  const profile = profiles?.[0];

  if (error || !profile?.google_access_token) {
    return { client: null, error: 'No Google authentication found' };
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await storeGoogleTokens(userId, tokens);
    }
  });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  return { client: sheets, error: null };
};

// Create a new spreadsheet
export const createSpreadsheet = async (userId: string, title: string, headers: string[]) => {
  const { client, error } = await getAuthenticatedSheetsClient(userId);
  
  if (error || !client) {
    return { spreadsheet: null, error: error || 'Failed to get authenticated client' };
  }

  try {
    // Create spreadsheet
    const response = await client.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [{
          properties: {
            title: 'Responses',
          },
        }],
      },
    });

    const spreadsheetId = response.data.spreadsheetId!;

    // Add headers
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: 'Responses!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Timestamp', ...headers]],
      },
    });

    return { 
      spreadsheet: {
        id: spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        title,
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    return { spreadsheet: null, error };
  }
};

// Append data to spreadsheet
export const appendToSpreadsheet = async (
  userId: string, 
  spreadsheetId: string, 
  data: Record<string, unknown>,
  headers: string[]
) => {
  const { client, error } = await getAuthenticatedSheetsClient(userId);
  
  if (error || !client) {
    return { error: error || 'Failed to get authenticated client' };
  }

  try {
    // Prepare row data in the same order as headers
    const timestamp = new Date().toISOString();
    const rowData = [timestamp, ...headers.map(header => {
      let value = data[header] || '';
      
      // Handle file uploads - convert to download URLs
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Handle file arrays
          value = value.map((item: any) => {
            if (typeof item === 'object' && item.url) {
              return item.url;
            }
            return String(item);
          }).join(', ');
        } else if ((value as any).url) {
          // Handle single file object
          value = (value as any).url;
        } else {
          value = JSON.stringify(value);
        }
      }
      
      return String(value);
    })];

    await client.spreadsheets.values.append({
      spreadsheetId,
      range: 'Responses!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return { error: null };
  } catch (error) {
    console.error('Error appending to spreadsheet:', error);
    return { error };
  }
};

// Get spreadsheet info
export const getSpreadsheetInfo = async (userId: string, spreadsheetId: string) => {
  const { client, error } = await getAuthenticatedSheetsClient(userId);
  
  if (error || !client) {
    return { info: null, error: error || 'Failed to get authenticated client' };
  }

  try {
    const response = await client.spreadsheets.get({
      spreadsheetId,
    });

    const values = await client.spreadsheets.values.get({
      spreadsheetId,
      range: 'Responses!A:Z',
    });

    return {
      info: {
        title: response.data.properties?.title,
        url: response.data.spreadsheetUrl,
        rowCount: values.data.values?.length || 0,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    return { info: null, error };
  }
};

// Extract spreadsheet ID from Google Sheets URL
export const extractSpreadsheetId = (url: string): string | null => {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/ // Direct ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

// Connect to existing spreadsheet
export const connectToExistingSpreadsheet = async (
  userId: string, 
  spreadsheetUrl: string,
  formHeaders: string[]
) => {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
  
  if (!spreadsheetId) {
    return { success: false, error: 'Invalid Google Sheets URL or ID' };
  }

  const { client, error } = await getAuthenticatedSheetsClient(userId);
  
  if (error || !client) {
    return { success: false, error: error || 'Failed to get authenticated client' };
  }

  try {
    // Check if spreadsheet exists and user has access
    const response = await client.spreadsheets.get({
      spreadsheetId,
    });

    if (!response.data) {
      return { success: false, error: 'Spreadsheet not found or access denied' };
    }

    // Get existing headers from the first row
    let existingHeaders: string[] = [];
    try {
      const valuesResponse = await client.spreadsheets.values.get({
        spreadsheetId,
        range: 'A1:Z1',
      });
      
      existingHeaders = valuesResponse.data.values?.[0] || [];
    } catch {
      // Sheet might be empty, that's okay
    }

    // If sheet is empty or doesn't have proper headers, add them
    if (existingHeaders.length === 0 || !existingHeaders.includes('Timestamp')) {
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Timestamp', ...formHeaders]],
        },
      });
    }

    return {
      success: true,
      spreadsheet: {
        id: spreadsheetId,
        url: response.data.spreadsheetUrl || spreadsheetUrl,
        title: response.data.properties?.title || 'Connected Sheet',
      },
      error: null,
    };
  } catch (error: unknown) {
    console.error('Error connecting to existing spreadsheet:', error);
    
    const err = error as { code?: number };
    if (err.code === 404) {
      return { success: false, error: 'Spreadsheet not found. Please check the URL and permissions.' };
    } else if (err.code === 403) {
      return { success: false, error: 'Access denied. Please make sure you have edit permissions for this spreadsheet.' };
    }
    
    return { success: false, error: 'Failed to connect to spreadsheet. Please try again.' };
  }
};

// List user's spreadsheets using Google Drive API
export const listUserSpreadsheets = async (userId: string) => {
  // Use service role key to bypass RLS for reading tokens
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

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .limit(1);

  const profile = profiles?.[0];

  if (error || !profile?.google_access_token) {
    return { spreadsheets: [], error: 'No Google authentication found' };
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
  });

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // List Google Sheets files
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id,name,webViewLink,modifiedTime,createdTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50, // Limit to 50 most recent spreadsheets
    });

    const spreadsheets = response.data.files?.map(file => ({
      id: file.id!,
      name: file.name!,
      url: file.webViewLink!,
      modifiedTime: file.modifiedTime!,
      createdTime: file.createdTime!,
    })) || [];

    return { spreadsheets, error: null };
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    return { spreadsheets: [], error };
  }
};

// Check if user has Google Sheets access
export const hasGoogleSheetsAccess = async (userId: string) => {
  // Use service role key to bypass RLS for reading tokens
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

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('google_access_token')
    .eq('id', userId)
    .limit(1);

  const profile = profiles?.[0];

  console.log('Checking Google access for user:', userId, { 
    hasProfile: !!profile, 
    hasToken: !!profile?.google_access_token,
    profilesCount: profiles?.length || 0,
    error: error?.message 
  });

  return !error && !!profile?.google_access_token;
};