-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.evidence enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles policies
create policy "profiles_select_self_or_root" on public.profiles for select
  using (
    id = auth.uid() 
    OR 
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root')
  );

create policy "profiles_update_self_or_root" on public.profiles for update
  using (
    id = auth.uid() 
    OR 
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root')
  );

create policy "profiles_insert_self" on public.profiles for insert
  with check (id = auth.uid());

-- Reports policies - SELECT
create policy "reports_select_root" on public.reports for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

create policy "reports_select_teacher" on public.reports for select
  using (
    exists (
      select 1 from public.profiles t
      where t.id = auth.uid()
        and t.role = 'teacher'
        and (
          reports.teacher_owner = t.id
          or reports.reporter_id in (select id from public.profiles where class = t.class)
        )
    )
  );

create policy "reports_select_reporter" on public.reports for select
  using (reporter_id = auth.uid());

-- Reports policies - INSERT
create policy "reports_insert_auth" on public.reports for insert
  with check (
    reporter_id = auth.uid() OR reporter_id IS NULL
  );

-- Reports policies - UPDATE
create policy "reports_update_root" on public.reports for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

create policy "reports_update_teacher_owner" on public.reports for update
  using (
    exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() 
        and p.role = 'teacher' 
        and reports.teacher_owner = auth.uid()
    )
  );

create policy "reports_update_reporter" on public.reports for update
  using (reporter_id = auth.uid());

-- Reports policies - DELETE
create policy "reports_delete_root" on public.reports for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

-- Evidence policies - SELECT
create policy "evidence_select_root" on public.evidence for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

create policy "evidence_select_teacher" on public.evidence for select
  using (
    exists (
      select 1 from public.profiles t
      join public.reports r on r.id = public.evidence.report_id
      where t.id = auth.uid()
        and t.role = 'teacher'
        and (
          r.teacher_owner = t.id
          or r.reporter_id in (select id from public.profiles where class = t.class)
        )
    )
  );

create policy "evidence_select_reporter" on public.evidence for select
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.reports r 
      where r.id = public.evidence.report_id 
        and r.reporter_id = auth.uid()
    )
  );

-- Evidence policies - INSERT
create policy "evidence_insert_auth" on public.evidence for insert
  with check (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.reports r 
      where r.id = report_id 
        and r.reporter_id = auth.uid()
    )
  );

-- Evidence policies - DELETE
create policy "evidence_delete_root" on public.evidence for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

-- Appointments policies
create policy "appointments_select_involved" on public.appointments for select
  using (
    user_id = auth.uid() 
    or teacher_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root')
  );

create policy "appointments_insert_auth" on public.appointments for insert
  with check (user_id = auth.uid() or teacher_id = auth.uid());

create policy "appointments_update_involved" on public.appointments for update
  using (
    user_id = auth.uid() 
    or teacher_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root')
  );

-- Audit logs policies
create policy "audit_logs_select_root" on public.audit_logs for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'root'));

create policy "audit_logs_insert_all" on public.audit_logs for insert
  with check (actor_id = auth.uid());

-- Chat messages policies
create policy "chat_messages_select_own" on public.chat_messages for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('root', 'teacher'))
  );

create policy "chat_messages_insert_own" on public.chat_messages for insert
  with check (user_id = auth.uid());
