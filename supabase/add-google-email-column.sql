-- Run this in your Supabase SQL Editor to add the google_email column
-- This is safe to run multiple times (uses IF NOT EXISTS)

-- Add google_email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Add google_sheet_name column to forms table for better tracking
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS google_sheet_name TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('google_email', 'google_access_token', 'google_refresh_token');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'forms' 
  AND column_name IN ('google_sheet_id', 'google_sheet_url', 'google_sheet_name');
