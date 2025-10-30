-- Create storage bucket for form files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-files', 'form-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for form files
CREATE POLICY "Anyone can view form files" ON storage.objects
FOR SELECT USING (bucket_id = 'form-files');

CREATE POLICY "Authenticated users can upload form files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'form-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own form files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'form-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own form files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'form-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create form_files table to track uploaded files
CREATE TABLE IF NOT EXISTS form_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES form_submissions(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_files_form_id ON form_files(form_id);
CREATE INDEX IF NOT EXISTS idx_form_files_submission_id ON form_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_files_field_id ON form_files(field_id);

-- Enable RLS on form_files table
ALTER TABLE form_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for form_files
CREATE POLICY "Users can view files from their forms" ON form_files
FOR SELECT USING (
  form_id IN (
    SELECT id FROM forms WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view files from published forms" ON form_files
FOR SELECT USING (
  form_id IN (
    SELECT id FROM forms WHERE is_published = true
  )
);

CREATE POLICY "Authenticated users can insert form files" ON form_files
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Form owners can update their form files" ON form_files
FOR UPDATE USING (
  form_id IN (
    SELECT id FROM forms WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Form owners can delete their form files" ON form_files
FOR DELETE USING (
  form_id IN (
    SELECT id FROM forms WHERE user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_form_files_updated_at
  BEFORE UPDATE ON form_files
  FOR EACH ROW
  EXECUTE FUNCTION update_form_files_updated_at();