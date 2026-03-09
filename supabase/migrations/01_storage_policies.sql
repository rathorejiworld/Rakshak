-- ============================================================================
-- Storage Bucket and Policies for Evidence Files
-- ============================================================================
-- This migration creates the evidence storage bucket and sets up policies
-- Run this AFTER the main schema migration
-- ============================================================================

-- Note: The bucket creation should be done via Supabase Dashboard or CLI
-- This file contains the storage policies to be applied

-- Storage policies for evidence bucket
-- Run these policies after creating the 'evidence' bucket in Supabase Storage UI

-- Policy: Allow authenticated users to upload evidence
CREATE POLICY "evidence_upload_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence' 
  AND (storage.foldername(name))[1] = 'reports'
);

-- Policy: Allow authorized users to read evidence (based on report access)
CREATE POLICY "evidence_read_authorized"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (
    -- Root can access all
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'root'
    )
    OR
    -- Teachers can access evidence for their reports
    EXISTS (
      SELECT 1 FROM public.evidence e
      JOIN public.reports r ON r.id = e.report_id
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE e.storage_path = name
        AND p.role = 'teacher'
        AND (
          r.teacher_owner = p.id 
          OR r.reporter_id IN (
            SELECT id FROM public.profiles 
            WHERE class = p.class AND role = 'student'
          )
        )
    )
    OR
    -- Students can access their own evidence
    EXISTS (
      SELECT 1 FROM public.evidence e
      JOIN public.reports r ON r.id = e.report_id
      WHERE e.storage_path = name
        AND (r.reporter_id = auth.uid() OR e.uploaded_by = auth.uid())
    )
  )
);

-- Policy: Only root can delete evidence from storage
CREATE POLICY "evidence_delete_root_only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'root'
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Storage policies created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Create the evidence bucket in Supabase Storage UI:';
  RAISE NOTICE '1. Go to Storage in Supabase Dashboard';
  RAISE NOTICE '2. Click "New Bucket"';
  RAISE NOTICE '3. Name: evidence';
  RAISE NOTICE '4. Public: OFF (private bucket)';
  RAISE NOTICE '5. File size limit: 10485760 (10MB)';
  RAISE NOTICE '6. Allowed MIME types: image/*, video/*, audio/*, application/pdf';
END $$;
