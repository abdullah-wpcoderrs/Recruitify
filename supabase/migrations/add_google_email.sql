-- Add google_email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Add google_sheet_name column to forms table for better tracking
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS google_sheet_name TEXT;
