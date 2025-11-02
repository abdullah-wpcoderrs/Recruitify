# Troubleshooting Guide

## Common Issues and Solutions

### 0. Chrome Extension Errors in Console

**Symptoms:**
- Console errors: "No tab with id: [number]"
- "A listener indicated an asynchronous response by returning true, but the message channel closed"
- Multiple repeated errors in console

**Cause:**
These errors are caused by browser extensions (React DevTools, ad blockers, etc.) trying to communicate with the page. They don't affect your application functionality.

**Solution:**
These errors are now automatically suppressed by the global error handler. If you still see them:

1. Try disabling browser extensions one by one to identify the culprit
2. The errors are harmless and can be ignored
3. They typically come from:
   - React DevTools
   - Redux DevTools
   - Ad blockers
   - Password managers
   - Other Chrome extensions

**Note:** The application includes an `ErrorBoundaryHandler` component that automatically suppresses these extension-related errors to keep your console clean.

---

### 1. Forms Not Loading - 406 Not Acceptable Error

**Symptoms:**
- Dashboard shows "No forms yet" even though you have forms
- Console shows 406 (Not Acceptable) errors
- Error message: `column forms.custom_slug does not exist` or `column forms.google_sheet_last_sync does not exist`

**Cause:**
The application code references database columns that don't exist in your database schema yet.

**Solution:**
Apply the missing columns migration:

1. Go to your Supabase dashboard → SQL Editor
2. Run the migration file: `supabase/migration-add-missing-columns.sql`
3. Verify columns were added
4. Refresh your application

See detailed instructions in: `supabase/APPLY_MISSING_COLUMNS_MIGRATION.md`

---

### 2. Hydration Errors in Console

**Symptoms:**
- Error: "In HTML, `<div>` cannot be a descendant of `<p>`"
- React hydration mismatch warnings

**Cause:**
Invalid HTML nesting where block elements are inside inline elements.

**Solution:**
This has been fixed in the codebase. Make sure you're using the latest version.

See: `docs/HYDRATION_GUIDELINES.md` for prevention tips.

---

### 3. Sensitive Data in Console Logs

**Symptoms:**
- Form field IDs visible in browser console
- User submission data logged
- Internal database keys exposed

**Cause:**
Debug console.log statements exposing sensitive information.

**Solution:**
This has been fixed. The application now uses a secure logger that:
- Sanitizes sensitive data
- Only logs in development mode
- Follows security best practices

See: `docs/SECURITY_GUIDELINES.md` for logging best practices.

---

### 4. Google Sheets Integration Not Working

**Symptoms:**
- Can't connect Google account
- Sheets not syncing
- 401 or 403 errors

**Possible Causes & Solutions:**

**A. Missing Google OAuth Credentials**
1. Check `.env` file has:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
2. Verify credentials in Google Cloud Console
3. Ensure redirect URI matches exactly

**B. Missing Database Columns**
1. Apply the missing columns migration (see issue #1 above)
2. Ensure `google_sheet_id` and `google_sheet_url` columns exist

**C. Insufficient Permissions**
1. Check Google OAuth scopes include:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`

---

### 5. Form Submissions Not Saving

**Symptoms:**
- Form submits but data doesn't appear in dashboard
- 500 Internal Server Error
- "Failed to save submission" message

**Possible Causes & Solutions:**

**A. RLS (Row Level Security) Issues**
1. Check Supabase RLS policies on `form_submissions` table
2. Ensure anonymous users can insert submissions
3. Apply RLS fix migration if needed

**B. Missing Form Fields**
1. Verify form has fields defined
2. Check field IDs match submission data
3. Ensure required fields are filled

---

### 6. Analytics Not Showing Data

**Symptoms:**
- Total Views shows 0
- Drop-off Analysis empty
- No submission trends

**Possible Causes & Solutions:**

**A. Missing form_views Table**
1. Check if `form_views` table exists
2. Apply analytics migration: `supabase/migration-analytics-fields.sql`

**B. View Tracking Not Working**
1. Verify `trackFormView()` is called when form loads
2. Check browser console for tracking errors
3. Ensure `form_views` table has RLS policies

**C. Missing Increment Function**
1. Apply the increment views function: `supabase/increment-views-function.sql`
2. Verify function exists in Supabase dashboard

---

## Database Migrations

If you're experiencing database-related issues, you may need to apply migrations:

### Required Migrations (in order):

1. **Schema Setup** - `supabase/schema.sql`
   - Creates all base tables
   - Sets up RLS policies

2. **Analytics Fields** - `supabase/migration-analytics-fields.sql`
   - Adds `total_views` column
   - Creates `form_views` table

3. **Missing Columns** - `supabase/migration-add-missing-columns.sql`
   - Adds `custom_slug` column
   - Adds `google_sheet_last_sync` column

4. **Increment Function** - `supabase/increment-views-function.sql`
   - Creates function to increment view counter

### How to Check Which Migrations You Need:

```sql
-- Check if custom_slug exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'forms' AND column_name = 'custom_slug';

-- Check if form_views table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'form_views';

-- Check if increment function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_form_views';
```

---

## Getting Help

If you're still experiencing issues:

1. Check the browser console for error messages
2. Check the Supabase logs in your dashboard
3. Verify all environment variables are set correctly
4. Ensure all migrations have been applied
5. Check that RLS policies are configured correctly

### Useful SQL Queries for Debugging:

```sql
-- Check all forms for current user
SELECT id, title, created_at, is_published 
FROM forms 
WHERE user_id = 'your-user-id';

-- Check form submissions
SELECT form_id, COUNT(*) as submission_count 
FROM form_submissions 
GROUP BY form_id;

-- Check form views
SELECT form_id, COUNT(*) as view_count 
FROM form_views 
GROUP BY form_id;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('forms', 'form_submissions', 'form_views');
```