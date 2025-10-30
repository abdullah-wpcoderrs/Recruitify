# Google Sheets API Setup Guide

Follow these steps to set up Google Sheets integration for your Recruitify application.

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## 2. Enable Google Sheets API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in required fields:
     - App name: "Recruitify"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `https://www.googleapis.com/auth/spreadsheets`
   - Add test users (your email) if in testing mode

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Recruitify Web Client"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)

5. Download the JSON file or copy the Client ID and Client Secret

## 4. Update Environment Variables

Add your Google credentials to `.env.local`:

```env
# Google OAuth & Sheets API
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. Go to a form's analytics page
3. Navigate to the "Google Sheets" tab
4. Click "Connect Google Account"
5. Complete the OAuth flow
6. Create a new spreadsheet or connect an existing one

## 6. OAuth Consent Screen (Production)

For production deployment:

1. Go to **OAuth consent screen** in Google Cloud Console
2. Change from "Testing" to "In production"
3. Submit for verification if you have external users
4. Update redirect URIs to use your production domain

## 7. API Quotas and Limits

Google Sheets API has the following limits:
- 300 requests per minute per project
- 100 requests per 100 seconds per user
- 500 requests per 100 seconds

For high-volume applications, consider:
- Implementing request batching
- Adding retry logic with exponential backoff
- Monitoring quota usage

## 8. Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Scopes**: Only request necessary permissions (`spreadsheets` scope)
3. **Token Storage**: Tokens are encrypted in Supabase database
4. **HTTPS**: Always use HTTPS in production
5. **Refresh Tokens**: Implement proper token refresh handling

## 9. Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: 
   - Check that redirect URI in Google Console matches exactly
   - Include protocol (http/https) and port for localhost

2. **"access_denied"**: 
   - User declined permissions
   - Check OAuth consent screen configuration

3. **"invalid_grant"**: 
   - Refresh token expired or invalid
   - User needs to re-authenticate

4. **"insufficient_permissions"**: 
   - Check that Sheets API is enabled
   - Verify OAuth scopes include `spreadsheets`

### Debug Steps:

1. Check browser network tab for API errors
2. Verify environment variables are loaded
3. Check Google Cloud Console logs
4. Test OAuth flow in incognito mode

## 10. Features Implemented

- ✅ OAuth 2.0 authentication flow
- ✅ Automatic spreadsheet creation
- ✅ Connect to existing spreadsheets
- ✅ Real-time data synchronization
- ✅ Token refresh handling
- ✅ Spreadsheet info retrieval
- ✅ Disconnect functionality
- ✅ Error handling and user feedback

## 11. API Endpoints

The following API endpoints are available:

- `GET /api/auth/google` - Get OAuth authorization URL
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/sheets/create` - Create new spreadsheet
- `POST /api/sheets/connect` - Connect to existing spreadsheet
- `POST /api/sheets/sync` - Sync form data to spreadsheet
- `POST /api/sheets/disconnect` - Disconnect spreadsheet from form
- `GET /api/sheets/info/[sheetId]` - Get spreadsheet information

## 12. Data Flow

### Creating New Spreadsheet:
1. User clicks "Connect Google Account"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Tokens stored in user profile
5. User clicks "Create New Sheet"
6. Spreadsheet created with form headers
7. Form submissions automatically sync to connected sheet

### Connecting Existing Spreadsheet:
1. User clicks "Connect Existing"
2. Enters Google Sheets URL or ID
3. System validates access and permissions
4. Headers added to sheet if needed
5. Form connected to existing spreadsheet
6. Form submissions sync to connected sheet

### URL Formats Supported:
- Full URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- Direct ID: `SHEET_ID` (just the spreadsheet ID)