-- ===== CREATE EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== CREATE THREE SEPARATE TABLES FOR ROLES =====

-- ROOT USERS TABLE
CREATE TABLE public.roots (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  phone text,
  org text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TEACHER USERS TABLE
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  phone text,
  org text,
  school_name text,
  class_id text,
  class_name text,
  grade_level text,
  subjects text[],
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STUDENT USERS TABLE
CREATE TABLE public.students (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  phone text,
  class_id text,
  school_name text,
  grade_level text,
  emergency_contacts jsonb,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- REPORTS TABLE
CREATE TABLE public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid REFERENCES public.students ON DELETE SET NULL,
  reporter_secret text,
  is_anonymous boolean DEFAULT true,
  title text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('legal', 'emotional', 'medical', 'other')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  assigned_to uuid REFERENCES public.teachers ON DELETE SET NULL,
  teacher_owner uuid REFERENCES public.teachers ON DELETE SET NULL,
  location jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- EVIDENCE TABLE
CREATE TABLE public.evidence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_type text,
  file_size integer,
  encrypted boolean DEFAULT false,
  encryption_meta jsonb,
  uploaded_by uuid REFERENCES public.students ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- APPOINTMENTS TABLE
CREATE TABLE public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'canceled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type text CHECK (actor_type IN ('root', 'teacher', 'student')),
  actor_id uuid,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  data jsonb,
  created_at timestamptz DEFAULT now()
);

-- BOT MESSAGES TABLE (for chat history)
CREATE TABLE public.bot_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.students ON DELETE CASCADE,
  message_type text CHECK (message_type IN ('user', 'emotional_bot', 'legal_bot')),
  content text NOT NULL,
  has_pii boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===== CREATE INDEXES =====
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_status_priority ON public.reports(status, priority);
CREATE INDEX idx_reports_teacher_owner ON public.reports(teacher_owner);
CREATE INDEX idx_reports_assigned_to ON public.reports(assigned_to);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_evidence_report_id ON public.evidence(report_id);
CREATE INDEX idx_evidence_uploaded_by ON public.evidence(uploaded_by);
CREATE INDEX idx_appointments_student_id ON public.appointments(student_id);
CREATE INDEX idx_appointments_teacher_id ON public.appointments(teacher_id);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_teachers_class_id ON public.teachers(class_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_bot_messages_user_id ON public.bot_messages(user_id);

-- ===== ENABLE RLS ON ALL TABLES =====
ALTER TABLE public.roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;

-- ===== ROOT POLICIES =====
CREATE POLICY "roots_select_own" ON public.roots FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "roots_select_all_by_root" ON public.roots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "roots_update_own" ON public.roots FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "roots_update_by_root" ON public.roots FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "roots_insert_auth" ON public.roots FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "roots_delete_by_root" ON public.roots FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== TEACHER POLICIES =====
CREATE POLICY "teachers_select_own" ON public.teachers FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "teachers_select_all_by_root" ON public.teachers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "teachers_update_own" ON public.teachers FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "teachers_update_by_root" ON public.teachers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "teachers_insert_auth" ON public.teachers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teachers_delete_by_root" ON public.teachers FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== STUDENT POLICIES =====
CREATE POLICY "students_select_own" ON public.students FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "students_select_by_teacher" ON public.students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = auth.uid()
      AND t.class_id = public.students.class_id
    )
  );

CREATE POLICY "students_select_all_by_root" ON public.students FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "students_update_own" ON public.students FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "students_update_by_teacher" ON public.students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = auth.uid()
      AND t.class_id = public.students.class_id
    )
  );

CREATE POLICY "students_update_by_root" ON public.students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "students_insert_auth" ON public.students FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "students_delete_by_root" ON public.students FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== REPORT POLICIES =====
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "reports_select_by_teacher" ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = auth.uid()
      AND (
        t.id = public.reports.teacher_owner
        OR t.id = public.reports.assigned_to
        OR t.class_id = (SELECT class_id FROM public.students WHERE id = public.reports.reporter_id LIMIT 1)
      )
    )
  );

CREATE POLICY "reports_select_all_by_root" ON public.reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "reports_insert_by_student" ON public.reports FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid()
    OR reporter_id IS NULL
  );

CREATE POLICY "reports_update_by_student" ON public.reports FOR UPDATE
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_by_teacher" ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = auth.uid()
      AND (t.id = public.reports.teacher_owner OR t.id = public.reports.assigned_to)
    )
  );

CREATE POLICY "reports_update_all_by_root" ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "reports_delete_by_root" ON public.reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== EVIDENCE POLICIES =====
CREATE POLICY "evidence_select_by_student" ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = public.evidence.report_id
      AND r.reporter_id = auth.uid()
    )
  );

CREATE POLICY "evidence_select_by_teacher" ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = public.evidence.report_id
      AND (
        r.teacher_owner = auth.uid()
        OR r.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "evidence_select_all_by_root" ON public.evidence FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "evidence_insert_by_student" ON public.evidence FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "evidence_insert_by_teacher" ON public.evidence FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM public.teachers));

CREATE POLICY "evidence_delete_by_root" ON public.evidence FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== APPOINTMENT POLICIES =====
CREATE POLICY "appointments_select_by_student" ON public.appointments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "appointments_select_by_teacher" ON public.appointments FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "appointments_select_all_by_root" ON public.appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "appointments_insert_by_student" ON public.appointments FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "appointments_update_by_teacher" ON public.appointments FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "appointments_update_by_student" ON public.appointments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "appointments_delete_by_root" ON public.appointments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== AUDIT LOG POLICIES =====
CREATE POLICY "audit_logs_select_by_root" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "audit_logs_insert_by_root" ON public.audit_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "audit_logs_delete_by_root" ON public.audit_logs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== BOT MESSAGES POLICIES =====
CREATE POLICY "bot_messages_select_own" ON public.bot_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "bot_messages_select_all_by_root" ON public.bot_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

CREATE POLICY "bot_messages_insert_by_student" ON public.bot_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bot_messages_delete_by_root" ON public.bot_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.roots WHERE id = auth.uid()));

-- ===== HELPER FUNCTIONS =====
CREATE OR REPLACE FUNCTION public.get_report_counts()
RETURNS TABLE(total_count bigint, solved_count bigint, pending_count bigint) AS $$
SELECT
  COUNT(*) FILTER (WHERE reporter_id = auth.uid()),
  COUNT(*) FILTER (WHERE reporter_id = auth.uid() AND status IN ('resolved', 'closed')),
  COUNT(*) FILTER (WHERE reporter_id = auth.uid() AND status NOT IN ('resolved', 'closed'))
FROM public.reports;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_report_counts TO authenticated;

-- Get teacher's students count
CREATE OR REPLACE FUNCTION public.get_teacher_students_count()
RETURNS bigint AS $$
SELECT COUNT(DISTINCT s.id)
FROM public.students s
WHERE s.class_id = (SELECT class_id FROM public.teachers WHERE id = auth.uid() LIMIT 1);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_teacher_students_count TO authenticated;

-- Get teacher's reports count
CREATE OR REPLACE FUNCTION public.get_teacher_reports_count()
RETURNS TABLE(total_count bigint, pending_count bigint, resolved_count bigint) AS $$
SELECT
  COUNT(*),
  COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')),
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))
FROM public.reports r
WHERE r.teacher_owner = auth.uid() OR r.assigned_to = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_teacher_reports_count TO authenticated;
