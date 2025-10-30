-- =====================================================
-- DATABASE SCHEMA UPDATES FOR ANALYTICS TRACKING
-- =====================================================

-- 1. Add total_views column to forms table
ALTER TABLE forms 
ADD COLUMN total_views INTEGER DEFAULT 0 NOT NULL;

-- 2. Add completion_time_seconds to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN completion_time_seconds INTEGER;

-- 3. Create a form_views table to track individual views
CREATE TABLE form_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT
);

-- 4. Create indexes for better performance
CREATE INDEX idx_form_views_form_id ON form_views(form_id);
CREATE INDEX idx_form_views_viewed_at ON form_views(viewed_at);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at);

-- 5. Create a function to update total_views when a view is recorded
CREATE OR REPLACE FUNCTION update_form_total_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forms 
    SET total_views = (
        SELECT COUNT(*) 
        FROM form_views 
        WHERE form_id = NEW.form_id
    )
    WHERE id = NEW.form_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update total_views
CREATE TRIGGER trigger_update_form_total_views
    AFTER INSERT ON form_views
    FOR EACH ROW
    EXECUTE FUNCTION update_form_total_views();

-- 7. RLS Policies for form_views table
ALTER TABLE form_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for public forms)
CREATE POLICY "Anyone can record form views" ON form_views
    FOR INSERT 
    WITH CHECK (true);

-- Only form owners can read their form views
CREATE POLICY "Users can read their form views" ON form_views
    FOR SELECT 
    USING (
        form_id IN (
            SELECT id FROM forms WHERE user_id = auth.uid()
        )
    );

-- 8. Update existing forms to have correct view counts (if any views exist)
-- This is a one-time update for existing data
UPDATE forms 
SET total_views = COALESCE((
    SELECT COUNT(*) 
    FROM form_views 
    WHERE form_views.form_id = forms.id
), 0);

-- =====================================================
-- OPTIONAL: Sample data for testing
-- =====================================================

-- Uncomment these lines if you want to add some sample view data for testing
-- INSERT INTO form_views (form_id, ip_address, user_agent) 
-- SELECT id, '127.0.0.1'::inet, 'Test Browser'
-- FROM forms 
-- LIMIT 5;