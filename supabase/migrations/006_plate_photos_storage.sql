-- File: supabase/migrations/006_plate_photos_storage.sql
-- Storage bucket and policies for meal plate photos

-- 1. Create the storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('plate-photos', 'plate-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Authenticated users can upload plate photos into their own folder (userId/...)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users upload plate photos'
  ) THEN
    CREATE POLICY "Authenticated users upload plate photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'plate-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- 3. Anyone can view uploaded plate photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can view plate photos'
  ) THEN
    CREATE POLICY "Anyone can view plate photos"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'plate-photos');
  END IF;
END $$;

-- 4. Users can delete their own uploaded photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own plate photos'
  ) THEN
    CREATE POLICY "Users delete own plate photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'plate-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
