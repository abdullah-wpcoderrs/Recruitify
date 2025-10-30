-- Migration script to fix existing users without profiles
-- Run this AFTER applying the main schema with triggers

-- Create profiles for existing auth users who don't have profiles
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.raw_user_meta_data->>'name', 
    split_part(au.email, '@', 1)
  ) as full_name,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.email IS NOT NULL;

-- Add Google OAuth columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- Verify the migration
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.profiles) as missing_profiles
FROM auth.users;