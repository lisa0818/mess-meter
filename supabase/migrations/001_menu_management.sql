-- File: supabase/migrations/001_menu_management.sql

-- Enable RLS on meals (if not already enabled)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Students can read meals for their hostel
CREATE POLICY "Students read own hostel meals"
  ON meals FOR SELECT
  USING (
    hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
    OR hostel_id IS NULL
  );

-- Admins can CRUD meals for their hostel
CREATE POLICY "Admins manage own hostel meals"
  ON meals FOR ALL
  USING (
    (hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid()) OR hostel_id IS NULL)
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Ensure RLS on ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own ratings"
  ON ratings FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own ratings"
  ON ratings FOR SELECT USING (user_id = auth.uid());

-- Ensure RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
