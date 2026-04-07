-- ============================================================
-- Migration 00002: Add expenses table + expand category enum
-- ============================================================

-- 1. Expand attraction_category enum with new values
ALTER TYPE attraction_category ADD VALUE IF NOT EXISTS 'Lodging';
ALTER TYPE attraction_category ADD VALUE IF NOT EXISTS 'Transport';
ALTER TYPE attraction_category ADD VALUE IF NOT EXISTS 'Viewpoint';
ALTER TYPE attraction_category ADD VALUE IF NOT EXISTS 'Border';

-- 2. Create expense_category enum
CREATE TYPE expense_category AS ENUM (
  'Food',
  'Transport',
  'Lodging',
  'Activities',
  'Shopping',
  'Health',
  'Other'
);

-- 3. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id       UUID NOT NULL,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_local  NUMERIC(12, 2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  amount_usd    NUMERIC(12, 4),
  amount_ils    NUMERIC(12, 4),
  description   TEXT NOT NULL DEFAULT '',
  category      expense_category NOT NULL DEFAULT 'Other',
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Auto-update updated_at on expenses
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_cat     ON expenses(category);

-- 6. RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select active expenses in trip" ON expenses
  FOR SELECT USING (trip_id = auth.trip_id() AND is_deleted = FALSE);

CREATE POLICY "Insert expenses in trip" ON expenses
  FOR INSERT WITH CHECK (trip_id = auth.trip_id());

CREATE POLICY "Update expenses in trip" ON expenses
  FOR UPDATE USING (trip_id = auth.trip_id());
