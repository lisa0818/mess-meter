-- File: supabase/migrations/002_voting.sql

CREATE TABLE IF NOT EXISTS polls (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id   UUID REFERENCES hostels(id),
  title       TEXT NOT NULL,
  meal_date   DATE NOT NULL,
  closes_at   TIMESTAMPTZ NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  is_veg      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id     UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id   UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (poll_id, user_id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Members read polls
CREATE POLICY "Members read polls" ON polls FOR SELECT
  USING (
    hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
    OR hostel_id IS NULL
  );

-- Members read options
CREATE POLICY "Members read options" ON poll_options FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM polls
      WHERE hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
      OR hostel_id IS NULL
    )
  );

-- Admins manage polls
CREATE POLICY "Admins manage polls" ON polls FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins manage options
CREATE POLICY "Admins manage options" ON poll_options FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Members can vote
CREATE POLICY "Members vote" ON poll_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Members read votes (for results calculation)
CREATE POLICY "Members read votes" ON poll_votes FOR SELECT
  USING (
    poll_id IN (
      SELECT id FROM polls
      WHERE hostel_id = (SELECT hostel_id FROM profiles WHERE id = auth.uid())
      OR hostel_id IS NULL
    )
  );

-- RPC: get poll results with vote counts
CREATE OR REPLACE FUNCTION poll_results(p_poll_id UUID)
RETURNS TABLE (
  option_id UUID,
  title     TEXT,
  subtitle  TEXT,
  is_veg    BOOLEAN,
  votes     BIGINT
) LANGUAGE SQL STABLE AS $$
  SELECT
    o.id AS option_id,
    o.title,
    o.subtitle,
    o.is_veg,
    COUNT(v.id) AS votes
  FROM poll_options o
  LEFT JOIN poll_votes v ON v.option_id = o.id
  WHERE o.poll_id = p_poll_id
  GROUP BY o.id, o.title, o.subtitle, o.is_veg, o.sort_order
  ORDER BY o.sort_order;
$$;
