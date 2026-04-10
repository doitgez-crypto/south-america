-- ============================================================
-- Migration 00003: Add is_visible column to trip_categories
-- ============================================================
-- The trip_categories table already exists with UNIQUE(trip_id, name).
-- This migration safely adds the is_visible column if it doesn't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'trip_categories'
      AND column_name  = 'is_visible'
  ) THEN
    ALTER TABLE trip_categories ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END
$$;

-- ── Ensure trip_id helper function exists ─────────────────
-- Can't create in auth schema via SQL Editor, so we use public schema.
CREATE OR REPLACE FUNCTION public.get_my_trip_id() RETURNS TEXT AS $$
  SELECT trip_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE trip_categories ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS policies for trip_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_categories' AND policyname = 'Select categories in trip'
  ) THEN
    CREATE POLICY "Select categories in trip" ON trip_categories
      FOR SELECT USING (trip_id = public.get_my_trip_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_categories' AND policyname = 'Insert categories in trip'
  ) THEN
    CREATE POLICY "Insert categories in trip" ON trip_categories
      FOR INSERT WITH CHECK (trip_id = public.get_my_trip_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_categories' AND policyname = 'Update categories in trip'
  ) THEN
    CREATE POLICY "Update categories in trip" ON trip_categories
      FOR UPDATE USING (trip_id = public.get_my_trip_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_categories' AND policyname = 'Delete categories in trip'
  ) THEN
    CREATE POLICY "Delete categories in trip" ON trip_categories
      FOR DELETE USING (trip_id = public.get_my_trip_id());
  END IF;
END
$$;
