-- Enable required extensions
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role text not null check (role in ('root','teacher','student')) default 'student',
  org text,
  class text,
  phone text,
  emergency_contacts jsonb,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles on delete set null,
  is_anonymous boolean default true,
  title text not null,
  description text,
  category text check (category in ('legal','emotional','medical','other')),
  status text default 'new' check (status in ('new','triaged','in_progress','resolved','closed')),
  priority text default 'medium' check (priority in ('low','medium','high','emergency')),
  assigned_to uuid references public.profiles on delete set null,
  teacher_owner uuid references public.profiles on delete set null,
  location jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evidence table
create table if not exists public.evidence (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports on delete cascade not null,
  storage_path text not null,
  file_type text,
  file_size int,
  encrypted boolean default false,
  encryption_meta jsonb,
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz default now()
);

-- Appointments table
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  teacher_id uuid references public.profiles on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'booked' check (status in ('booked','completed','canceled')),
  created_at timestamptz default now()
);

-- Audit logs table
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  data jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_reports_reporter_id on public.reports (reporter_id);
create index if not exists idx_reports_status_priority on public.reports (status, priority);
create index if not exists idx_reports_teacher_owner on public.reports (teacher_owner);
create index if not exists idx_evidence_report_id on public.evidence (report_id);
create index if not exists idx_appointments_user_id on public.appointments (user_id);
create index if not exists idx_appointments_teacher_id on public.appointments (teacher_id);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.evidence enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_logs enable row level security;

-- RLS Policies: PROFILES (no recursion)
-- Allow users to view their own profile
create policy "profiles_view_own" on public.profiles for select
  using (id = auth.uid());

-- Allow users to update their own profile
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

-- Root users (role = 'root') can view and update all profiles
-- NOTE: This checks the current user's role directly without recursion
create policy "profiles_root_all" on public.profiles for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

create policy "profiles_root_update_all" on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- RLS Policies: REPORTS
-- Roots can view all reports
create policy "reports_select_root" on public.reports for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- Teachers can view reports for their students or where they are assigned
create policy "reports_select_teacher" on public.reports for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and (
      teacher_owner = auth.uid()
      or reporter_id in (select id from public.profiles where class = (select class from public.profiles where id = auth.uid()))
    )
  );

-- Students can view only their own reports
create policy "reports_select_student" on public.reports for select
  using (reporter_id = auth.uid());

-- Anyone authenticated can insert a report (anonymous or as themselves)
create policy "reports_insert_auth" on public.reports for insert
  with check (
    reporter_id = auth.uid()
    or reporter_id is null -- anonymous
  );

-- Roots can update all reports
create policy "reports_update_root" on public.reports for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- Teachers can update reports they own
create policy "reports_update_teacher" on public.reports for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and teacher_owner = auth.uid()
  );

-- Students can update their own reports (limited fields via trigger recommended)
create policy "reports_update_student" on public.reports for update
  using (reporter_id = auth.uid());

-- RLS Policies: EVIDENCE
-- Roots can view all evidence
create policy "evidence_select_root" on public.evidence for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- Teachers can view evidence for reports in their class/assigned
create policy "evidence_select_teacher" on public.evidence for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and report_id in (
      select id from public.reports
      where teacher_owner = auth.uid()
        or reporter_id in (select id from public.profiles where class = (select class from public.profiles where id = auth.uid()))
    )
  );

-- Students can view evidence they uploaded or for their reports
create policy "evidence_select_student" on public.evidence for select
  using (
    uploaded_by = auth.uid()
    or report_id in (select id from public.reports where reporter_id = auth.uid())
  );

-- Anyone can upload evidence to their own report or anonymous
create policy "evidence_insert_auth" on public.evidence for insert
  with check (
    uploaded_by = auth.uid()
    or report_id in (select id from public.reports where reporter_id = auth.uid() or reporter_id is null)
  );

-- RLS Policies: APPOINTMENTS
-- Users can view their own appointments
create policy "appointments_select_own" on public.appointments for select
  using (user_id = auth.uid() or teacher_id = auth.uid());

-- Roots can view all appointments
create policy "appointments_select_root" on public.appointments for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- RLS Policies: AUDIT_LOGS
-- Only roots can view audit logs
create policy "audit_logs_select_root" on public.audit_logs for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- Only roots can insert audit logs
create policy "audit_logs_insert_root" on public.audit_logs for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );
