-- ============================================================
-- Migration 00004: Add extra_categories column to attractions
-- ============================================================
-- Allows an attraction to be tagged with multiple categories
-- in addition to its primary `category` enum value.
-- Stores category names as TEXT[] (both built-in and custom).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'attractions'
      AND column_name  = 'extra_categories'
  ) THEN
    ALTER TABLE attractions
      ADD COLUMN extra_categories TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;
