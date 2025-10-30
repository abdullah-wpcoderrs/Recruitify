-- Add total_views column to forms table
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- Create form_views table for detailed view tracking
CREATE TABLE IF NOT EXISTS public.form_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT
);

-- Create form_files table for file upload tracking
CREATE TABLE IF NOT EXISTS public.form_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_views_form_id ON public.form_views(form_id);
CREATE INDEX IF NOT EXISTS idx_form_views_viewed_at ON public.form_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_form_files_form_id ON public.form_files(form_id);
CREATE INDEX IF NOT EXISTS idx_form_files_submission_id ON public.form_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_forms_total_views ON public.forms(total_views);

-- Enable RLS for new tables
ALTER TABLE public.form_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_files ENABLE ROW LEVEL SECURITY;

-- Policies for form_views
CREATE POLICY "Users can view views for their forms" ON public.form_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_views.form_id 
      AND forms.user_id = auth.uid()
    )
  );

-- Policies for form_files
CREATE POLICY "Users can view files for their forms" ON public.form_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_files.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files they uploaded" ON public.form_files
  FOR DELETE USING (uploaded_by = auth.uid());

-- Function to increment form view count
CREATE OR REPLACE FUNCTION increment_form_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forms 
  SET total_views = total_views + 1 
  WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to increment form view count on new view
CREATE OR REPLACE TRIGGER increment_form_view_count_trigger
  AFTER INSERT ON public.form_views
  FOR EACH ROW EXECUTE FUNCTION increment_form_view_count();