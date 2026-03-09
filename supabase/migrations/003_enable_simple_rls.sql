-- Re-enable RLS with SIMPLE policies (no recursion)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES (no recursive checks, no SELECT from same table)

-- Students: see own profile
CREATE POLICY "students_select_own" ON public.students FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "students_insert_own" ON public.students FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "students_update_own" ON public.students FOR UPDATE
  USING (id = auth.uid());

-- Teachers: see own profile
CREATE POLICY "teachers_select_own" ON public.teachers FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "teachers_insert_own" ON public.teachers FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "teachers_update_own" ON public.teachers FOR UPDATE
  USING (id = auth.uid());

-- Roots: see own profile
CREATE POLICY "roots_select_own" ON public.roots FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "roots_insert_own" ON public.roots FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "roots_update_own" ON public.roots FOR UPDATE
  USING (id = auth.uid());

-- Reports: students see their own
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

CREATE POLICY "reports_update_own" ON public.reports FOR UPDATE
  USING (reporter_id = auth.uid());

-- Evidence: students see their own
CREATE POLICY "evidence_select_own" ON public.evidence FOR SELECT
  USING (uploaded_by = auth.uid());

CREATE POLICY "evidence_insert_own" ON public.evidence FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Appointments: students see their own
CREATE POLICY "appointments_select_own" ON public.appointments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "appointments_insert_own" ON public.appointments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Bot messages: students see their own
CREATE POLICY "bot_messages_select_own" ON public.bot_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "bot_messages_insert_own" ON public.bot_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Audit logs: allow insert for authenticated users
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
