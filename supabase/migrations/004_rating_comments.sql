-- File: supabase/migrations/004_rating_comments.sql

-- Add comment column to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS comment TEXT;

-- Allow hostel admins to read all ratings for meals in their hostel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ratings' AND policyname = 'Admins read hostel meal ratings'
  ) THEN
    CREATE POLICY "Admins read hostel meal ratings"
      ON ratings FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM meals m
          JOIN profiles p ON p.hostel_id = m.hostel_id
          WHERE m.id = ratings.meal_id
            AND p.id = auth.uid()
            AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- RPC for admin dashboard to fetch recent meal comments anonymously
CREATE OR REPLACE FUNCTION get_recent_meal_comments(limit_count INT DEFAULT 20)
RETURNS TABLE (
  rating_id UUID,
  meal_id UUID,
  meal_date DATE,
  meal_type TEXT,
  rating NUMERIC,
  comment TEXT,
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
    r.created_at
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  WHERE r.comment IS NOT NULL 
    AND LENGTH(TRIM(r.comment)) > 0
    AND m.hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
  ORDER BY r.created_at DESC
  LIMIT limit_count;
$$;
