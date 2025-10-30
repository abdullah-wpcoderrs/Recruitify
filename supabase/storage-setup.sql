-- Storage setup for form builder images and file uploads
-- This script creates storage buckets and policies for handling image uploads

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'form-images', 
    'form-images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  ),
  (
    'form-uploads', 
    'form-uploads', 
    false, -- Private bucket for form submissions
    52428800, -- 50MB limit
    ARRAY[
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for form-images bucket (public bucket for logos, headers, etc.)
CREATE POLICY "Anyone can view form images" ON storage.objects
  FOR SELECT USING (bucket_id = 'form-images');

CREATE POLICY "Authenticated users can upload form images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'form-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own form images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'form-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own form images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'form-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for form-uploads bucket (private bucket for form submissions)
CREATE POLICY "Users can view uploads for their forms" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'form-uploads'
    AND auth.role() = 'authenticated'
    AND (
      -- User owns the file (uploaded by them)
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- User owns a form that this file belongs to
      EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.form_submissions fs ON f.id = fs.form_id
        JOIN public.form_files ff ON fs.id = ff.submission_id
        WHERE f.user_id = auth.uid()
        AND ff.storage_path = (storage.filename(name))
      )
    )
  );

CREATE POLICY "Anyone can upload to form-uploads for submissions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'form-uploads'
    -- Allow uploads during form submission process
  );

CREATE POLICY "Users can delete uploads for their forms" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'form-uploads'
    AND auth.role() = 'authenticated'
    AND (
      -- User owns the file
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- User owns a form that this file belongs to
      EXISTS (
        SELECT 1 FROM public.forms f
        JOIN public.form_submissions fs ON f.id = fs.form_id
        JOIN public.form_files ff ON fs.id = ff.submission_id
        WHERE f.user_id = auth.uid()
        AND ff.storage_path = (storage.filename(name))
      )
    )
  );

-- Create a helper function to generate signed URLs for private files
CREATE OR REPLACE FUNCTION public.get_file_url(file_path text, bucket_name text DEFAULT 'form-uploads')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Check if user has access to this file
  IF bucket_name = 'form-uploads' THEN
    -- Check if user owns a form that this file belongs to
    IF NOT EXISTS (
      SELECT 1 FROM public.forms f
      JOIN public.form_submissions fs ON f.id = fs.form_id
      JOIN public.form_files ff ON fs.id = ff.submission_id
      WHERE f.user_id = auth.uid()
      AND ff.storage_path = file_path
    ) THEN
      RETURN NULL;
    END IF;
  END IF;
  
  -- Generate signed URL (valid for 1 hour)
  SELECT storage.sign(file_path, 3600, bucket_name) INTO signed_url;
  
  RETURN signed_url;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_url TO authenticated;