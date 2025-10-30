# Apply Custom Slug Migration

This migration adds support for custom URL slugs to your forms.

## What This Does

- Adds a `custom_slug` column to the `forms` table
- Creates an index for faster lookups
- Allows users to create branded URLs like `/forms/my-custom-form` instead of `/forms/uuid`

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `migration-custom-slug.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd recruitify

# Run the migration
supabase db push migration-custom-slug.sql
```

## Verify Migration

After applying, you can verify the migration worked by running this query in the SQL Editor:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'forms' AND column_name = 'custom_slug';
```

You should see the `custom_slug` column listed.

## Features Enabled

After this migration, users can:
- Set custom URL slugs in the Form Settings panel
- Access forms via `/forms/custom-slug` or `/forms/form-id`
- Copy the branded URL with a single click (includes toast notification)
