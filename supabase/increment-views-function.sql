-- Function to increment form views counter
CREATE OR REPLACE FUNCTION increment_form_views(form_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forms 
  SET total_views = COALESCE(total_views, 0) + 1,
      updated_at = NOW()
  WHERE id = form_id;
END;
$$;