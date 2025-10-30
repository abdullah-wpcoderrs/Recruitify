-- Migration: Add custom_slug column to forms table
-- This allows users to create custom URLs for their forms

-- Add custom_slug column
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_forms_custom_slug ON public.forms(custom_slug);

-- Add comment
COMMENT ON COLUMN public.forms.custom_slug IS 'Custom URL slug for the form (optional, must be unique)';
