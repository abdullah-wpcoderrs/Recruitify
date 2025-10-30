import { google } from 'googleapis';
import { supabase } from './supabase';

// Google Sheets API configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  headers: string[];
}

// Create OAuth2 client
export const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  );
};

// Generate OAuth URL for Google Sheets access
export const getGoogleSheetsAuthUrl = (userId: string) => {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass user ID to identify the user after OAuth
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token,
    })
    .eq('id', userId);

  return { error };
};

// Get authenticated Google Sheets client
export const getAuthenticatedSheetsClient = async (userId: string) => {
  // Get user's Google tokens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('google_access_token, google_refresh_token')
    .eq('id', userId)
    .single();

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
    const rowData = [timestamp, ...headers.map(header => data[header] || '')];

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

// List user's spreadsheets (optional feature)
export const listUserSpreadsheets = async (userId: string) => {
  const { client, error } = await getAuthenticatedSheetsClient(userId);
  
  if (error || !client) {
    return { spreadsheets: [], error: error || 'Failed to get authenticated client' };
  }

  try {
    // Note: Google Sheets API doesn't have a direct "list spreadsheets" endpoint
    // This would require Google Drive API to list files with mimeType application/vnd.google-apps.spreadsheet
    // For now, we'll return empty array and rely on URL input
    return { spreadsheets: [], error: null };
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    return { spreadsheets: [], error };
  }
};

// Check if user has Google Sheets access
export const hasGoogleSheetsAccess = async (userId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .select('google_access_token')
    .eq('id', userId)
    .single();

  return !error && !!profile?.google_access_token;
};