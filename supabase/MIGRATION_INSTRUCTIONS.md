# Database Migration Instructions

## Analytics Fields Migration

This migration adds analytics tracking capabilities to your Recruitify application.

### What's Added:

1. **Forms Table Updates:**
   - `total_views` - Tracks total number of form views
   - `google_sheet_last_sync` - Timestamp of last Google Sheets sync

2. **New Table: form_views**
   - Tracks individual form views with IP, user agent, and referrer
   - Automatically updates `total_views` count on forms table

3. **Form Submissions Table Updates:**
   - `completion_time_seconds` - Time taken to complete the form
   - `created_at` - When the submission was started

### How to Apply:

Run the migration file in your Supabase SQL Editor:

```bash
# Copy the contents of migration-analytics-fields.sql
# Paste into Supabase Dashboard > SQL Editor > New Query
# Click "Run" to execute
```

Or using Supabase CLI:

```bash
supabase db push
```

### After Migration:

The application will now:
- Track form views automatically
- Calculate real conversion rates (submissions / views)
- Show accurate analytics data instead of mock data
- Track completion times for submissions
- Support Google Sheets sync timestamps

### Note:

Existing forms will have `total_views = 0` until new views are recorded. The system will start tracking views from the moment this migration is applied.
