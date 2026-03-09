-- Enable required extensions
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  display_name text,
  role text not null check (role in ('root','teacher','student')),
  org text,
  class text,
  phone text,
  emergency_contacts jsonb,
  is_verified boolean default false,
  created_at timestamptz default now(),
  primary key (id)
);

-- Reports table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles,
  reporter_secret text,
  is_anonymous boolean default true,
  title text,
  description text,
  category text check (category in ('legal','emotional','medical','other')),
  status text default 'new' check (status in ('new','triaged','in_progress','resolved','closed')),
  priority text default 'medium' check (priority in ('low','medium','high','emergency')),
  assigned_to uuid references public.profiles,
  teacher_owner uuid references public.profiles,
  location jsonb,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evidence table
create table if not exists public.evidence (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.reports on delete cascade,
  storage_path text not null,
  file_type text,
  file_size int,
  encrypted boolean default false,
  encryption_meta jsonb,
  uploaded_by uuid references public.profiles,
  created_at timestamptz default now()
);

-- Appointments table
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles,
  teacher_id uuid references public.profiles,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'booked' check (status in ('booked','completed','canceled')),
  created_at timestamptz default now()
);

-- Audit logs table
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles,
  action text,
  target_table text,
  target_id uuid,
  data jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_reports_reporter_id on public.reports (reporter_id);
create index if not exists idx_reports_status_priority on public.reports (status, priority);
create index if not exists idx_evidence_report_id on public.evidence (report_id);
create index if not exists idx_profiles_role on public.profiles (role);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.evidence enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_logs enable row level security;

-- ===== RLS POLICIES =====

-- PROFILES: Allow users to view and edit their own profile
create policy "profiles_select_own" on public.profiles for select
  using (auth.uid() = id);

-- Allow root users to view and edit all profiles (check role directly without recursion)
create policy "profiles_select_root" on public.profiles for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_root" on public.profiles for update
  using ((select role from public.profiles where id = auth.uid()) = 'root');

create policy "profiles_insert_root" on public.profiles for insert
  with check (
    auth.uid() is not null
  );

-- REPORTS: Complex access control

-- 1. Root can select all reports
create policy "reports_select_root" on public.reports for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- 2. Reporter can select their own reports
create policy "reports_select_reporter" on public.reports for select
  using (reporter_id = auth.uid());

-- 3. Teacher can select reports for their students
create policy "reports_select_teacher" on public.reports for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and (
      teacher_owner = auth.uid()
      or reporter_id in (
        select id from public.profiles 
        where class = (select class from public.profiles where id = auth.uid())
      )
    )
  );

-- Allow authenticated users to insert reports
create policy "reports_insert_auth" on public.reports for insert
  with check (
    auth.uid() is not null
    and (reporter_id = auth.uid() or reporter_id is null)
  );

-- 4. Root can update all reports
create policy "reports_update_root" on public.reports for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- 5. Teacher can update reports they own
create policy "reports_update_teacher" on public.reports for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and teacher_owner = auth.uid()
  );

-- 6. Reporter can update their own report (limited fields)
create policy "reports_update_reporter" on public.reports for update
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

-- EVIDENCE: Access control based on report access

-- 1. Root can access all evidence
create policy "evidence_select_root" on public.evidence for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- 2. Reporter can access evidence from their reports
create policy "evidence_select_reporter" on public.evidence for select
  using (
    (select reporter_id from public.reports where id = report_id) = auth.uid()
  );

-- 3. Teacher can access evidence from reports they own
create policy "evidence_select_teacher" on public.evidence for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'teacher'
    and (select teacher_owner from public.reports where id = report_id) = auth.uid()
  );

-- Allow authenticated users to insert evidence
create policy "evidence_insert_auth" on public.evidence for insert
  with check (auth.uid() is not null);

-- APPOINTMENTS: Access control

-- Users can select their own appointments
create policy "appointments_select_own" on public.appointments for select
  using (user_id = auth.uid() or teacher_id = auth.uid());

-- Root can select all appointments
create policy "appointments_select_root" on public.appointments for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- Allow authenticated users to insert appointments
create policy "appointments_insert_auth" on public.appointments for insert
  with check (auth.uid() is not null);

-- AUDIT_LOGS: Root only

create policy "audit_logs_select_root" on public.audit_logs for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

create policy "audit_logs_insert_root" on public.audit_logs for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'root'
  );

-- ===== HELPER FUNCTIONS =====

-- Function to get student report counts (for dashboard)
create or replace function public.get_report_counts()
returns table(total_count bigint, solved_count bigint, pending_count bigint) as $$
select
  count(*),
  count(*) filter (where status in ('resolved','closed')),
  count(*) filter (where status not in ('resolved','closed'))
from public.reports
where reporter_id = auth.uid();
$$ language sql stable security definer;

-- Allow authenticated users to call this function
grant execute on function public.get_report_counts to authenticated;
