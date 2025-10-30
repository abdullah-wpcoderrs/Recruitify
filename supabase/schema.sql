-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forms table
CREATE TABLE public.forms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  branding JSONB NOT NULL DEFAULT '{"primary_color": "#16a34a"}',
  is_published BOOLEAN DEFAULT FALSE,
  google_sheet_id TEXT,
  google_sheet_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL
);

-- Form submissions table
CREATE TABLE public.form_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for forms
CREATE POLICY "Users can view own forms" ON public.forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own forms" ON public.forms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own forms" ON public.forms
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view published forms
CREATE POLICY "Anyone can view published forms" ON public.forms
  FOR SELECT USING (is_published = TRUE);

-- Policies for form submissions
CREATE POLICY "Users can view submissions for their forms" ON public.form_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_submissions.form_id 
      AND forms.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit to published forms" ON public.form_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forms 
      WHERE forms.id = form_submissions.form_id 
      AND forms.is_published = TRUE
    )
  );

-- Indexes for better performance
CREATE INDEX idx_forms_user_id ON public.forms(user_id);
CREATE INDEX idx_forms_published ON public.forms(is_published);
CREATE INDEX idx_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically delete profile when user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ language 'plpgsql' security definer;

-- Trigger to automatically delete profile when user is deleted
CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();