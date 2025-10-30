# Fix Form Submissions RLS Policy

This migration fixes the Row Level Security (RLS) policy that was preventing anonymous users from submitting forms.

## The Problem

The error you encountered:
```
new row violates row-level security policy for table "form_submissions"
```

This happens because the RLS policy was too restrictive and didn't properly allow anonymous (non-authenticated) users to submit forms, even when the form is published.

## What This Migration Does

1. Drops the existing restrictive RLS policy
2. Recreates the policy with proper permissions for anonymous submissions
3. Ensures that:
   - Anonymous users CAN submit to published forms
   - Form owners CAN view submissions for their forms
   - The security check properly validates form publication status

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `migration-fix-form-submissions.sql`
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd recruitify

# Run the migration
supabase db push migration-fix-form-submissions.sql
```

## Verify the Fix

After applying the migration, test by:

1. Publishing a form in your dashboard
2. Opening the public form URL in an incognito/private browser window
3. Filling out and submitting the form
4. You should see a success message instead of an error

## What Changed

**Before:** The RLS policy required authentication to check if a form was published, creating a catch-22 situation.

**After:** The policy now properly allows anonymous users to:
- Check if a form is published
- Submit to published forms
- All while maintaining security (only published forms accept submissions)

## Security Notes

This migration maintains security by:
- Only allowing submissions to published forms
- Form owners still need authentication to view submissions
- No sensitive data is exposed to anonymous users
- The form publication status is the gatekeeper
