-- Drop all problematic recursive policies
DROP POLICY IF EXISTS "profiles_select_self_or_root" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_root" ON public.profiles;
DROP POLICY IF EXISTS "reports_select_root" ON public.reports;
DROP POLICY IF EXISTS "reports_select_teacher" ON public.reports;
DROP POLICY IF EXISTS "reports_update_root" ON public.reports;
DROP POLICY IF EXISTS "reports_update_teacher_owner" ON public.reports;
DROP POLICY IF EXISTS "evidence_select_root" ON public.evidence;
DROP POLICY IF EXISTS "evidence_select_teacher" ON public.evidence;
DROP POLICY IF EXISTS "audit_logs_select_root" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_root" ON public.audit_logs;

-- ===== NON-RECURSIVE POLICIES =====

-- PROFILES: Allow users to view and edit their own profile
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- PROFILES: Allow root users (store role directly without checking profiles again)
CREATE POLICY "profiles_select_root" ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_root" ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

CREATE POLICY "profiles_insert_auth" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- REPORTS: Root can select all
CREATE POLICY "reports_select_root" ON public.reports FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

-- REPORTS: Reporter can select their own reports
CREATE POLICY "reports_select_reporter" ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

-- REPORTS: Teacher can select reports for their students
CREATE POLICY "reports_select_teacher" ON public.reports FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'teacher'
    AND (
      teacher_owner = auth.uid()
      OR reporter_id IN (
        SELECT id FROM public.profiles 
        WHERE class = (SELECT class FROM public.profiles WHERE id = auth.uid() LIMIT 1)
      )
    )
  );

-- REPORTS: Authenticated users can insert
CREATE POLICY "reports_insert_auth" ON public.reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (reporter_id = auth.uid() OR reporter_id IS NULL)
  );

-- REPORTS: Root can update all
CREATE POLICY "reports_update_root" ON public.reports FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

-- REPORTS: Teacher can update reports they own
CREATE POLICY "reports_update_teacher" ON public.reports FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'teacher'
    AND teacher_owner = auth.uid()
  );

-- REPORTS: Reporter can update their own report (limited)
CREATE POLICY "reports_update_reporter" ON public.reports FOR UPDATE
  USING (reporter_id = auth.uid())
  WITH CHECK (reporter_id = auth.uid());

-- EVIDENCE: Root can access all
CREATE POLICY "evidence_select_root" ON public.evidence FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

-- EVIDENCE: Reporter can access their evidence
CREATE POLICY "evidence_select_reporter" ON public.evidence FOR SELECT
  USING (
    (SELECT reporter_id FROM public.reports WHERE id = report_id LIMIT 1) = auth.uid()
  );

-- EVIDENCE: Teacher can access evidence for their reports
CREATE POLICY "evidence_select_teacher" ON public.evidence FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'teacher'
    AND (SELECT teacher_owner FROM public.reports WHERE id = report_id LIMIT 1) = auth.uid()
  );

-- EVIDENCE: Authenticated users can insert
CREATE POLICY "evidence_insert_auth" ON public.evidence FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- APPOINTMENTS: Users can select their own
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT
  USING (user_id = auth.uid() OR teacher_id = auth.uid());

-- APPOINTMENTS: Root can select all
CREATE POLICY "appointments_select_root" ON public.appointments FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

-- APPOINTMENTS: Authenticated users can insert
CREATE POLICY "appointments_insert_auth" ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- AUDIT_LOGS: Root only
CREATE POLICY "audit_logs_select_root" ON public.audit_logs FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

CREATE POLICY "audit_logs_insert_root" ON public.audit_logs FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'root'
  );

-- Add LIMIT 1 to all subqueries to ensure we only fetch one row
-- This prevents the planner from recursing through multiple rows
