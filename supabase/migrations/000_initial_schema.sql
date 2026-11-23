-- File: supabase/migrations/000_initial_schema.sql
-- Baseline schema: hostels, profiles, meals, ratings, feedback, and core analytics RPCs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Hostels
CREATE TABLE IF NOT EXISTS hostels (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (links to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hostel_id   UUID REFERENCES hostels(id) ON DELETE SET NULL,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  push_token  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Meals
CREATE TABLE IF NOT EXISTS meals (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id   UUID REFERENCES hostels(id) ON DELETE CASCADE,
  meal_date   DATE NOT NULL,
  meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  menu_items  TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (hostel_id, meal_date, meal_type)
);

-- 4. Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id     UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars       INT CHECK (stars >= 1 AND stars <= 5),
  tags        TEXT[] DEFAULT '{}',
  comment     TEXT,
  skipped     BOOLEAN NOT NULL DEFAULT FALSE,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (meal_id, user_id)
);

-- 5. Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL DEFAULT 'idea' CHECK (kind IN ('bug', 'idea', 'other')),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Hostels policies
CREATE POLICY "Public read hostels" ON hostels FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Feedback policies
CREATE POLICY "Authenticated users submit feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins read feedback" ON feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Automatically insert profile when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC: Join Hostel via invite code
CREATE OR REPLACE FUNCTION join_hostel(code TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_hostel_id UUID;
BEGIN
  SELECT id INTO v_hostel_id FROM hostels WHERE UPPER(invite_code) = UPPER(code);
  IF v_hostel_id IS NULL THEN
    RAISE EXCEPTION 'Invalid hostel invite code';
  END IF;
  UPDATE profiles SET hostel_id = v_hostel_id WHERE id = auth.uid();
END;
$$;

-- RPC: Meal scores for Trends & Today screen
CREATE OR REPLACE FUNCTION meal_scores(p_from DATE, p_min INT DEFAULT 3)
RETURNS TABLE (
  meal_id UUID,
  meal_date DATE,
  meal_type TEXT,
  avg_stars NUMERIC,
  n BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    m.id AS meal_id,
    m.meal_date,
    m.meal_type,
    ROUND(AVG(r.stars)::NUMERIC, 1) AS avg_stars,
    COUNT(r.id) AS n
  FROM meals m
  JOIN ratings r ON r.meal_id = m.id
  WHERE m.meal_date >= p_from
    AND r.skipped = FALSE
    AND r.stars IS NOT NULL
    AND (m.hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid()) OR m.hostel_id IS NULL)
  GROUP BY m.id, m.meal_date, m.meal_type
  HAVING COUNT(r.id) >= p_min
  ORDER BY m.meal_date DESC;
$$;

-- RPC: Admin 7-day summary metrics
CREATE OR REPLACE FUNCTION admin_summary(p_days INT DEFAULT 7)
RETURNS TABLE (
  total_ratings BIGINT,
  raters BIGINT,
  members BIGINT,
  avg_stars NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH user_hostel AS (
    SELECT hostel_id FROM profiles WHERE id = auth.uid()
  )
  SELECT
    COUNT(r.id) AS total_ratings,
    COUNT(DISTINCT r.user_id) AS raters,
    (SELECT COUNT(p.id) FROM profiles p WHERE p.hostel_id = (SELECT hostel_id FROM user_hostel)) AS members,
    COALESCE(ROUND(AVG(r.stars)::NUMERIC, 1), 0) AS avg_stars
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  WHERE m.meal_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE
    AND r.skipped = FALSE
    AND (m.hostel_id = (SELECT hostel_id FROM user_hostel) OR m.hostel_id IS NULL);
$$;

-- RPC: Admin tag counts
CREATE OR REPLACE FUNCTION admin_tag_counts(p_days INT DEFAULT 7)
RETURNS TABLE (
  tag TEXT,
  n BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH user_hostel AS (
    SELECT hostel_id FROM profiles WHERE id = auth.uid()
  )
  SELECT
    t.tag,
    COUNT(*) AS n
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  CROSS JOIN UNNEST(r.tags) AS t(tag)
  WHERE m.meal_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE
    AND (m.hostel_id = (SELECT hostel_id FROM user_hostel) OR m.hostel_id IS NULL)
  GROUP BY t.tag
  ORDER BY n DESC;
$$;

-- RPC: Admin meal type average
CREATE OR REPLACE FUNCTION admin_meal_type_avg(p_days INT DEFAULT 7)
RETURNS TABLE (
  meal_type TEXT,
  avg_stars NUMERIC,
  n BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH user_hostel AS (
    SELECT hostel_id FROM profiles WHERE id = auth.uid()
  )
  SELECT
    m.meal_type,
    ROUND(AVG(r.stars)::NUMERIC, 1) AS avg_stars,
    COUNT(r.id) AS n
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  WHERE m.meal_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE
    AND r.skipped = FALSE
    AND r.stars IS NOT NULL
    AND (m.hostel_id = (SELECT hostel_id FROM user_hostel) OR m.hostel_id IS NULL)
  GROUP BY m.meal_type;
$$;

-- RPC: Admin worst meals
CREATE OR REPLACE FUNCTION admin_worst_meals(p_days INT DEFAULT 7)
RETURNS TABLE (
  meal_date DATE,
  meal_type TEXT,
  avg_stars NUMERIC,
  n BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH user_hostel AS (
    SELECT hostel_id FROM profiles WHERE id = auth.uid()
  )
  SELECT
    m.meal_date,
    m.meal_type,
    ROUND(AVG(r.stars)::NUMERIC, 1) AS avg_stars,
    COUNT(r.id) AS n
  FROM ratings r
  JOIN meals m ON m.id = r.meal_id
  WHERE m.meal_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE
    AND r.skipped = FALSE
    AND r.stars IS NOT NULL
    AND (m.hostel_id = (SELECT hostel_id FROM user_hostel) OR m.hostel_id IS NULL)
  GROUP BY m.meal_date, m.meal_type
  HAVING COUNT(r.id) >= 1
  ORDER BY avg_stars ASC
  LIMIT 5;
$$;

-- Seed default hostel
INSERT INTO hostels (id, name, invite_code)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Demo Hostel A', 'MESS01')
ON CONFLICT (invite_code) DO NOTHING;
