-- Migration: Add missing columns to forms table
-- This adds columns that are referenced in the code but missing from the database

-- Add custom_slug column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'custom_slug'
  ) THEN
    ALTER TABLE public.forms 
    ADD COLUMN custom_slug TEXT UNIQUE;
    
    -- Create index for faster lookups
    CREATE INDEX idx_forms_custom_slug ON public.forms(custom_slug);
    
    -- Add comment
    COMMENT ON COLUMN public.forms.custom_slug IS 'Custom URL slug for the form (optional, must be unique)';
  END IF;
END $$;

-- Add google_sheet_last_sync column (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'forms' AND column_name = 'google_sheet_last_sync'
  ) THEN
    ALTER TABLE public.forms 
    ADD COLUMN google_sheet_last_sync TIMESTAMPTZ;
    
    -- Add comment
    COMMENT ON COLUMN public.forms.google_sheet_last_sync IS 'Timestamp of last Google Sheets sync';
  END IF;
END $$;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'forms' 
  AND column_name IN ('custom_slug', 'google_sheet_last_sync')
ORDER BY column_name;