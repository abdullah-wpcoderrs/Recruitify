-- =====================================================
-- FIXED RLS POLICIES FOR FORM SUBMISSIONS
-- =====================================================

-- First, let's drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can read their own form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Anyone can submit to published forms" ON form_submissions;
DROP POLICY IF EXISTS "temp_allow_all" ON form_submissions;

-- Enable RLS on form_submissions table
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY 1: Allow anyone to submit to ANY form
-- (This is what you need for public forms to work)
-- =====================================================
CREATE POLICY "public_form_submissions" ON form_submissions
    FOR INSERT 
    WITH CHECK (true);  -- Allow all insertions

-- =====================================================
-- POLICY 2: Form owners can read their own submissions
-- =====================================================
CREATE POLICY "owners_read_submissions" ON form_submissions
    FOR SELECT 
    USING (
        form_id IN (
            SELECT id FROM forms 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- POLICY 3: Form owners can update/delete their submissions
-- =====================================================
CREATE POLICY "owners_manage_submissions" ON form_submissions
    FOR ALL 
    USING (
        form_id IN (
            SELECT id FROM forms 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- ALTERNATIVE: More restrictive policy (if you want it)
-- Only allow submissions to published forms
-- =====================================================
-- Uncomment this and comment out "public_form_submissions" above if you want stricter control:

-- CREATE POLICY "published_form_submissions" ON form_submissions
--     FOR INSERT 
--     WITH CHECK (
--         form_id IN (
--             SELECT id FROM forms 
--             WHERE is_published = true
--         )
--     );

-- =====================================================
-- POLICIES FOR OTHER TABLES
-- =====================================================

-- Forms table policies
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own forms" ON forms;
CREATE POLICY "users_manage_forms" ON forms
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow anyone to read published forms (for public access)
DROP POLICY IF EXISTS "Anyone can read published forms" ON forms;
CREATE POLICY "public_read_published_forms" ON forms
    FOR SELECT 
    USING (is_published = true);

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "users_manage_profiles" ON profiles
    FOR ALL 
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =====================================================
-- TEST THE POLICIES
-- =====================================================

-- You can test these policies by running:
-- 1. Try to insert a form submission (should work)
-- 2. Try to read submissions as the form owner (should work)
-- 3. Try to read submissions as a different user (should fail)

-- Example test queries:
-- INSERT INTO form_submissions (form_id, data) VALUES ('your-form-id', '{"test": "data"}');
-- SELECT * FROM form_submissions WHERE form_id = 'your-form-id';