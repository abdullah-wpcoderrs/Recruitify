# Google Sheets Integration - New Flow

## Overview
The Google Sheets integration now uses a centralized approach where users connect their Google account once in Settings, then can easily connect any form to Google Sheets.

## User Flow

### 1. Connect Google Account (One-time Setup)
1. User navigates to **Settings** page (`/settings`)
2. Under **Integrations** section, click **Connect Google** button
3. User is redirected to Google OAuth consent screen
4. After authorization, user is redirected back to Settings page
5. Google account is now connected (shows email and "Connected" badge)

### 2. Connect Form to Google Sheets
Once Google account is connected, users can connect any form:

#### From Form Builder (Settings Tab)
1. Open form in builder
2. Go to **Settings** tab
3. Under **Integrations** → **Google Sheets**, click **Connect**
4. Choose one of three options:
   - **Select from My Spreadsheets**: Choose existing spreadsheet (creates new sheet tab)
   - **Create New**: Creates a new spreadsheet
   - **Connect URL**: Paste existing spreadsheet URL

#### From Analytics Page
1. Open form analytics
2. Under **Google Sheets Integration** card, click connect options
3. Same three options as above

### 3. Automatic Sync
Once connected:
- New form submissions automatically sync to the connected Google Sheet
- Manual sync available via "Sync Now" button
- View spreadsheet directly via "Open Sheet" button

## Technical Implementation

### Database Schema
```sql
-- profiles table
ALTER TABLE public.profiles ADD COLUMN google_email TEXT;
ALTER TABLE public.profiles ADD COLUMN google_access_token TEXT;
ALTER TABLE public.profiles ADD COLUMN google_refresh_token TEXT;

-- forms table
ALTER TABLE public.forms ADD COLUMN google_sheet_id TEXT;
ALTER TABLE public.forms ADD COLUMN google_sheet_url TEXT;
ALTER TABLE public.forms ADD COLUMN google_sheet_name TEXT;
```

### API Endpoints

#### User Settings
- `GET /api/user/google-status?userId={userId}` - Check if user has Google connected
- `POST /api/user/disconnect-google` - Disconnect Google account

#### OAuth Flow
- `GET /api/auth/google?userId={userId}&source=settings` - Initiate OAuth (from Settings)
- `GET /api/auth/google?userId={userId}&formId={formId}&source=builder` - Initiate OAuth (from Builder)
- `GET /api/auth/google/callback` - OAuth callback handler

#### Spreadsheet Operations
- `GET /api/sheets/status?formId={formId}&userId={userId}` - Check form's Google Sheets status
- `GET /api/sheets/list?userId={userId}` - List user's Google Spreadsheets
- `POST /api/sheets/create` - Create new spreadsheet
- `POST /api/sheets/connect` - Connect to existing spreadsheet by URL
- `POST /api/sheets/connect-with-sheet` - Create new sheet in existing spreadsheet
- `POST /api/sheets/disconnect` - Disconnect form from spreadsheet
- `POST /api/sheets/sync` - Manually sync form submissions

### Key Features
1. **Centralized Authentication**: Google account connected once in Settings
2. **No Re-authorization**: Forms don't need separate OAuth flows
3. **Better UX**: Clear separation between account connection and form configuration
4. **Spreadsheet Selection**: Easy browsing and selection of existing spreadsheets
5. **Automatic Email Storage**: User's Google email stored for display

### Security
- Uses OAuth 2.0 with offline access for refresh tokens
- Service role key used for server-side operations to bypass RLS
- Tokens stored securely in Supabase profiles table
- Row-level security ensures users can only access their own data

## Migration Notes
- Existing users with Google Sheets connected will continue to work
- New users must connect Google account in Settings first
- Forms without Google connection will show "Go to Settings" prompt
