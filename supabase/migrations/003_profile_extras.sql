-- File: supabase/migrations/003_profile_extras.sql

-- Helper to get profile with hostel details
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (
  email       TEXT,
  hostel_name TEXT,
  role        TEXT,
  created_at  TIMESTAMPTZ
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    u.email::TEXT,
    COALESCE(h.name, 'Demo Hostel A')::TEXT AS hostel_name,
    p.role::TEXT,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN hostels h ON h.id = p.hostel_id
  WHERE p.id = auth.uid();
$$;

-- Leave hostel (reset hostel_id to null)
CREATE OR REPLACE FUNCTION leave_hostel()
RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET hostel_id = NULL WHERE id = auth.uid();
END;
$$;
