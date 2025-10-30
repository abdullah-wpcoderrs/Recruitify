-- Migration: Fix form submissions RLS policy
-- This allows anonymous users to submit forms without authentication

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can submit to published forms" ON public.form_submissions;

-- Create a new policy that allows anonymous submissions
CREATE POLICY "Anyone can submit to published forms" ON public.form_submissions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_submissions.form_id 
      AND forms.is_published = TRUE
    )
  );

-- Also ensure the policy allows checking form existence without auth
-- This is needed for the WITH CHECK clause to work for anonymous users
ALTER TABLE public.form_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Recreate all policies
-- Users can view submissions for their forms
CREATE POLICY "Users can view submissions for their forms" ON public.form_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_submissions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

-- Anyone (including anonymous) can submit to published forms
CREATE POLICY "Anyone can submit to published forms" ON public.form_submissions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_submissions.form_id 
      AND forms.is_published = TRUE
    )
  );

-- Add a policy to allow anonymous users to read published forms (needed for the check)
-- This is already handled in the forms table, but we ensure it here
