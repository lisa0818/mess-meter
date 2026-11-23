-- File: supabase/migrations/007_rating_photos_rpc.sql

-- Update RPC for admin dashboard to return recent meal comments and photos
CREATE OR REPLACE FUNCTION get_recent_meal_comments(limit_count INT DEFAULT 20)
RETURNS TABLE (
  rating_id UUID,
  meal_id UUID,
  meal_date DATE,
  meal_type TEXT,
  rating NUMERIC,
  comment TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    r.id AS rating_id,
    r.meal_id,
    m.meal_date,
    m.meal_type,
    r.stars AS rating,
    r.comment,
    r.photo_url,
    r.created_at
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  WHERE ((r.comment IS NOT NULL AND LENGTH(TRIM(r.comment)) > 0)
     OR (r.photo_url IS NOT NULL AND LENGTH(TRIM(r.photo_url)) > 0))
    AND m.hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
  ORDER BY r.created_at DESC
  LIMIT limit_count;
$$;
