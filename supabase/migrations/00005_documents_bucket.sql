-- ============================================================
-- Migration 00005: Create trip-documents storage bucket + RLS
-- ============================================================
-- The trip-documents bucket is used by useDocuments.js to store
-- PDFs and images. This migration creates it and sets policies
-- matching the pattern used by trip-media in migration 00001.

INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-documents', 'trip-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Documents are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trip-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'trip-documents' AND auth.role() = 'authenticated');
