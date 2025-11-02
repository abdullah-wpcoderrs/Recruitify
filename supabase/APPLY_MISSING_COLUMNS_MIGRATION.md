# Apply Missing Columns Migration

## Overview
This migration adds columns that are referenced in the application code but are missing from the database schema:
- `custom_slug` - Allows custom URLs for forms
- `google_sheet_last_sync` - Tracks when Google Sheets were last synced

## Why This Is Needed
The application code references these columns, but they don't exist in the current database schema. This causes 406 errors when trying to fetch forms.

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `migration-add-missing-columns.sql`
5. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
6. Verify the output shows the new columns were added

### Option 2: Using Supabase CLI

```bash
# Make sure you're in your project directory
cd your-project-directory

# Apply the migration
supabase db push

# Or run the SQL file directly
psql $DATABASE_URL -f supabase/migration-add-missing-columns.sql
```

## Verification

After applying the migration, verify the columns exist:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'forms' 
  AND column_name IN ('custom_slug', 'google_sheet_last_sync')
ORDER BY column_name;
```

You should see both columns listed.

## What This Enables

### Custom Slug
- Users can create custom URLs like `/forms/my-application-form` instead of `/forms/uuid`
- Makes forms more shareable and memorable
- Optional feature - forms still work with UUID

### Google Sheets Last Sync
- Tracks when form responses were last synced to Google Sheets
- Helps users know if their data is up to date
- Displayed in the analytics dashboard

## Rollback (if needed)

If you need to remove these columns:

```sql
-- Remove custom_slug column
ALTER TABLE public.forms DROP COLUMN IF EXISTS custom_slug;
DROP INDEX IF EXISTS idx_forms_custom_slug;

-- Remove google_sheet_last_sync column
ALTER TABLE public.forms DROP COLUMN IF EXISTS google_sheet_last_sync;
```

## Notes

- The migration uses `DO $$ ... END $$` blocks to check if columns exist before adding them
- This makes the migration idempotent (safe to run multiple times)
- The `custom_slug` column has a UNIQUE constraint to prevent duplicate slugs
- An index is created on `custom_slug` for faster lookups