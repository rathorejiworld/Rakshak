-- ============================================================================
-- Rakshak Complete Database Schema
-- ============================================================================
-- This migration creates all tables, indexes, RLS policies, functions, views,
-- and storage buckets needed for the Rakshak application.
-- 
-- SAFE TO RUN MULTIPLE TIMES - Uses DROP IF EXISTS and CREATE OR REPLACE
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. DROP EXISTING TRIGGERS (to allow clean recreation)
-- ============================================================================

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS report_comments_updated_at ON public.report_comments;
DROP TRIGGER IF EXISTS reports_audit_log ON public.reports;
DROP TRIGGER IF EXISTS evidence_audit_log ON public.evidence;
DROP TRIGGER IF EXISTS profiles_audit_log ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- 3. DROP EXISTING POLICIES (to allow clean recreation)
-- ============================================================================

-- Drop all policies on profiles
DROP POLICY IF EXISTS "profiles_select_self_or_root" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_root" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_root_only" ON public.profiles;

-- Drop all policies on reports
DROP POLICY IF EXISTS "reports_select_root" ON public.reports;
DROP POLICY IF EXISTS "reports_select_teacher" ON public.reports;
DROP POLICY IF EXISTS "reports_select_reporter" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_auth" ON public.reports;
DROP POLICY IF EXISTS "reports_update_root" ON public.reports;
DROP POLICY IF EXISTS "reports_update_teacher_owner" ON public.reports;
DROP POLICY IF EXISTS "reports_update_reporter" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_root" ON public.reports;

-- Drop all policies on evidence
DROP POLICY IF EXISTS "evidence_select_root" ON public.evidence;
DROP POLICY IF EXISTS "evidence_select_teacher" ON public.evidence;
DROP POLICY IF EXISTS "evidence_select_reporter" ON public.evidence;
DROP POLICY IF EXISTS "evidence_insert_auth" ON public.evidence;
DROP POLICY IF EXISTS "evidence_delete_root" ON public.evidence;

-- Drop all policies on appointments
DROP POLICY IF EXISTS "appointments_select_involved" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_auth" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_involved" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_involved" ON public.appointments;

-- Drop all policies on audit_logs
DROP POLICY IF EXISTS "audit_logs_select_root" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON public.audit_logs;

-- Drop all policies on chat_messages
DROP POLICY IF EXISTS "chat_messages_select_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_own" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_root" ON public.chat_messages;

-- Drop all policies on report_comments
DROP POLICY IF EXISTS "report_comments_select_root" ON public.report_comments;
DROP POLICY IF EXISTS "report_comments_select_teacher" ON public.report_comments;
DROP POLICY IF EXISTS "report_comments_select_reporter" ON public.report_comments;
DROP POLICY IF EXISTS "report_comments_insert_staff" ON public.report_comments;
DROP POLICY IF EXISTS "report_comments_update_author" ON public.report_comments;
DROP POLICY IF EXISTS "report_comments_delete_root" ON public.report_comments;

-- Drop all policies on notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- ============================================================================
-- 4. TABLES AND INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Table
-- ----------------------------------------------------------------------------
-- Linked to auth.users, stores user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('root', 'teacher', 'student')),
  org TEXT,
  class TEXT,
  phone TEXT, -- Store encrypted or use Supabase Vault for sensitive data
  emergency_contacts JSONB, -- Format: [{"name": "...", "phone": "...", "email": "..."}]
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_class ON public.profiles(org, class);

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users with role-based information';
COMMENT ON COLUMN public.profiles.role IS 'User role: root (admin), teacher, or student';
COMMENT ON COLUMN public.profiles.emergency_contacts IS 'JSON array of emergency contact objects';

-- ----------------------------------------------------------------------------
-- Reports Table
-- ----------------------------------------------------------------------------
-- Main table for student reports (legal, emotional, medical, other)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL for anonymous
  reporter_secret TEXT, -- Hashed token for anonymous report editing
  is_anonymous BOOLEAN DEFAULT TRUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('legal', 'emotional', 'medical', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  teacher_owner UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location JSONB, -- Format: {"city": "...", "coordinates": {"lat": ..., "lng": ...}}
  metadata JSONB, -- Additional metadata, consent timestamps, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON public.reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_status_priority ON public.reports(status, priority);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_teacher_owner ON public.reports(teacher_owner);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON public.reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

COMMENT ON TABLE public.reports IS 'Student reports for legal, emotional, medical, or other support';
COMMENT ON COLUMN public.reports.reporter_id IS 'User who created the report; NULL for anonymous reports';
COMMENT ON COLUMN public.reports.reporter_secret IS 'Hashed token allowing anonymous users to edit their reports';

-- ----------------------------------------------------------------------------
-- Evidence Table
-- ----------------------------------------------------------------------------
-- Stores metadata for evidence files uploaded to Supabase Storage
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_meta JSONB, -- Stores encryption key metadata if using client-side encryption
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_report_id ON public.evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_by ON public.evidence(uploaded_by);

COMMENT ON TABLE public.evidence IS 'Metadata for evidence files stored in Supabase Storage';
COMMENT ON COLUMN public.evidence.encryption_meta IS 'Stores encryption key and IV if file is encrypted client-side';

-- ----------------------------------------------------------------------------
-- Appointments Table
-- ----------------------------------------------------------------------------
-- Scheduled appointments between students and teachers/counselors
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'canceled', 'no_show')),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_teacher_id ON public.appointments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

COMMENT ON TABLE public.appointments IS 'Scheduled appointments between students and teachers';

-- ----------------------------------------------------------------------------
-- Audit Logs Table
-- ----------------------------------------------------------------------------
-- Tracks all critical actions for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Audit trail for all critical operations';

-- ----------------------------------------------------------------------------
-- Chat Messages Table
-- ----------------------------------------------------------------------------
-- Stores chat history with AI assistants (Emotional and Legal)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('emotional', 'legal')),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  contains_pii BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

COMMENT ON TABLE public.chat_messages IS 'Chat history with AI assistants (Emotional and Legal)';
COMMENT ON COLUMN public.chat_messages.contains_pii IS 'Flag indicating if message contains personally identifiable information';

-- ----------------------------------------------------------------------------
-- Report Comments Table
-- ----------------------------------------------------------------------------
-- Comments on reports from teachers, counselors, and root users
CREATE TABLE IF NOT EXISTS public.report_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal comments visible only to staff
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON public.report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_author_id ON public.report_comments(author_id);

COMMENT ON TABLE public.report_comments IS 'Comments and updates on reports';
COMMENT ON COLUMN public.report_comments.is_internal IS 'Internal staff-only comments not visible to students';

-- ----------------------------------------------------------------------------
-- Notifications Table
-- ----------------------------------------------------------------------------
-- User notifications for report updates, appointments, etc.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

COMMENT ON TABLE public.notifications IS 'User notifications for various events';

-- ============================================================================
-- 3. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER report_comments_updated_at
  BEFORE UPDATE ON public.report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Function: Create audit log entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_id, action, target_table, target_id, old_data, new_data
  ) VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging triggers
CREATE TRIGGER reports_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER evidence_audit_log
  AFTER INSERT OR DELETE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER profiles_audit_log
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_verified IS DISTINCT FROM NEW.is_verified)
  EXECUTE FUNCTION public.create_audit_log();

-- ----------------------------------------------------------------------------
-- Function: Auto-create profile on user signup
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, is_verified)
  VALUES (NEW.id, 'student', FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Function: Generate anonymous reporter secret
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_reporter_secret()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. VIEWS
-- ============================================================================

DROP VIEW IF EXISTS public.student_report_counts_view;
CREATE VIEW public.student_report_counts_view AS
SELECT 
  reporter_id,
  COUNT(*) AS total_reports,
  SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END)::INTEGER AS solved_count,
  SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END)::INTEGER AS pending_count,
  SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END)::INTEGER AS emergency_count
FROM public.reports
WHERE reporter_id IS NOT NULL
GROUP BY reporter_id;

-- Function: Get current user report counts
CREATE OR REPLACE FUNCTION public.get_my_report_counts()
RETURNS TABLE(
  total_reports BIGINT,
  solved_count BIGINT,
  pending_count BIGINT,
  emergency_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END)::BIGINT,
    SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END)::BIGINT,
    SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END)::BIGINT
  FROM public.reports
  WHERE reporter_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

DROP VIEW IF EXISTS public.teacher_dashboard_stats;
CREATE VIEW public.teacher_dashboard_stats AS
SELECT 
  teacher_owner,
  COUNT(*) AS total_reports,
  SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::INTEGER AS new_reports,
  SUM(CASE WHEN status = 'triaged' THEN 1 ELSE 0 END)::INTEGER AS triaged_reports,
  SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::INTEGER AS in_progress_reports,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::INTEGER AS resolved_reports,
  SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END)::INTEGER AS emergency_reports
FROM public.reports
WHERE teacher_owner IS NOT NULL
GROUP BY teacher_owner;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Profiles Policies
-- ----------------------------------------------------------------------------

-- SELECT: Users can view their own profile or root can view all
CREATE POLICY "profiles_select_self_or_root" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- INSERT: Users can create their own profile (handled by trigger typically)
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Users can update their own profile or root can update any
CREATE POLICY "profiles_update_self_or_root" ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- DELETE: Only root can delete profiles
CREATE POLICY "profiles_delete_root_only" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Reports Policies
-- ----------------------------------------------------------------------------

-- SELECT: Root sees all
CREATE POLICY "reports_select_root" ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- SELECT: Teachers see reports they own or from their class
CREATE POLICY "reports_select_teacher" ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles t
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          reports.teacher_owner = t.id
          OR 
          reports.reporter_id IN (
            SELECT id FROM public.profiles 
            WHERE class = t.class AND role = 'student'
          )
        )
    )
  );

-- SELECT: Students see only their own reports
CREATE POLICY "reports_select_reporter" ON public.reports
  FOR SELECT
  USING (reporter_id = auth.uid());

-- INSERT: Authenticated users can create reports
CREATE POLICY "reports_insert_auth" ON public.reports
  FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid() OR reporter_id IS NULL
  );

-- UPDATE: Root can update all
CREATE POLICY "reports_update_root" ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- UPDATE: Teachers can update reports they own
CREATE POLICY "reports_update_teacher_owner" ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
        AND p.role = 'teacher' 
        AND reports.teacher_owner = auth.uid()
    )
  );

-- UPDATE: Reporters can update their own reports (limited fields)
CREATE POLICY "reports_update_reporter" ON public.reports
  FOR UPDATE
  USING (reporter_id = auth.uid());

-- DELETE: Only root can delete reports
CREATE POLICY "reports_delete_root" ON public.reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Evidence Policies
-- ----------------------------------------------------------------------------

-- SELECT: Root can access all evidence
CREATE POLICY "evidence_select_root" ON public.evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- SELECT: Teachers can access evidence for their reports
CREATE POLICY "evidence_select_teacher" ON public.evidence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles t
      JOIN public.reports r ON r.id = public.evidence.report_id
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          r.teacher_owner = t.id
          OR 
          r.reporter_id IN (
            SELECT id FROM public.profiles 
            WHERE class = t.class AND role = 'student'
          )
        )
    )
  );

-- SELECT: Reporters can access evidence they uploaded or for their reports
CREATE POLICY "evidence_select_reporter" ON public.evidence
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = public.evidence.report_id 
        AND r.reporter_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can upload evidence
CREATE POLICY "evidence_insert_auth" ON public.evidence
  FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = report_id 
        AND r.reporter_id = auth.uid()
    )
  );

-- DELETE: Only root can delete evidence
CREATE POLICY "evidence_delete_root" ON public.evidence
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Appointments Policies
-- ----------------------------------------------------------------------------

-- SELECT: Users see appointments they're involved in or root sees all
CREATE POLICY "appointments_select_involved" ON public.appointments
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    teacher_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- INSERT: Authenticated users can create appointments
CREATE POLICY "appointments_insert_auth" ON public.appointments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR teacher_id = auth.uid()
  );

-- UPDATE: Involved parties can update appointments
CREATE POLICY "appointments_update_involved" ON public.appointments
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR 
    teacher_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- DELETE: Only root or involved parties can delete appointments
CREATE POLICY "appointments_delete_involved" ON public.appointments
  FOR DELETE
  USING (
    user_id = auth.uid() 
    OR 
    teacher_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Audit Logs Policies
-- ----------------------------------------------------------------------------

-- SELECT: Only root can view audit logs
CREATE POLICY "audit_logs_select_root" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- INSERT: System can insert audit logs (via trigger)
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ----------------------------------------------------------------------------
-- Chat Messages Policies
-- ----------------------------------------------------------------------------

-- SELECT: Users see their own messages or root/teachers see all
CREATE POLICY "chat_messages_select_own" ON public.chat_messages
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('root', 'teacher')
    )
  );

-- INSERT: Users can create their own messages
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- DELETE: Only root can delete chat messages
CREATE POLICY "chat_messages_delete_root" ON public.chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Report Comments Policies
-- ----------------------------------------------------------------------------

-- SELECT: Root sees all comments
CREATE POLICY "report_comments_select_root" ON public.report_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- SELECT: Teachers see comments on their reports (non-internal or their own)
CREATE POLICY "report_comments_select_teacher" ON public.report_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles t
      JOIN public.reports r ON r.id = public.report_comments.report_id
      WHERE t.id = auth.uid()
        AND t.role = 'teacher'
        AND (
          r.teacher_owner = t.id
          OR 
          NOT public.report_comments.is_internal
        )
    )
  );

-- SELECT: Students see non-internal comments on their reports
CREATE POLICY "report_comments_select_reporter" ON public.report_comments
  FOR SELECT
  USING (
    NOT is_internal
    AND 
    EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = report_id AND r.reporter_id = auth.uid()
    )
  );

-- INSERT: Teachers and root can add comments
CREATE POLICY "report_comments_insert_staff" ON public.report_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('root', 'teacher')
    )
  );

-- UPDATE: Only author or root can update comments
CREATE POLICY "report_comments_update_author" ON public.report_comments
  FOR UPDATE
  USING (
    author_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- DELETE: Only root can delete comments
CREATE POLICY "report_comments_delete_root" ON public.report_comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ----------------------------------------------------------------------------
-- Notifications Policies
-- ----------------------------------------------------------------------------

-- SELECT: Users see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: System or root can create notifications
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- UPDATE: Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own notifications or root can delete any
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'root'
    )
  );

-- ============================================================================
-- 6. STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket for evidence files (run after bucket creation in UI)
-- Note: This must be run separately or via Supabase CLI
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'evidence',
--   'evidence',
--   false,
--   10485760, -- 10MB limit
--   ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf']
-- );

-- Storage policies for evidence bucket
-- These should be created in the Supabase Storage UI or via storage API

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Check if user is root
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_root()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'root'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Check if user is teacher
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Check if user is student
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Function: Get user role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Rakshak database schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket "evidence" in Supabase Storage UI';
  RAISE NOTICE '2. Configure storage policies for evidence bucket';
  RAISE NOTICE '3. Run seed data migration if needed';
END $$;
