-- Enable required extensions
create extension if not exists pgcrypto;

-- Profiles: linked to auth.users
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

-- Reports
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

-- Evidence
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

-- Appointments
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles,
  teacher_id uuid references public.profiles,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'booked' check (status in ('booked','completed','canceled')),
  created_at timestamptz default now()
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles,
  action text,
  target_table text,
  target_id uuid,
  data jsonb,
  created_at timestamptz default now()
);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles,
  mode text check (mode in ('emotional','legal')),
  role text check (role in ('user','assistant')),
  content text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_reports_reporter_id on public.reports (reporter_id);
create index if not exists idx_reports_status_priority on public.reports (status, priority);
create index if not exists idx_evidence_report_id on public.evidence (report_id);
create index if not exists idx_appointments_user_id on public.appointments (user_id);
create index if not exists idx_appointments_teacher_id on public.appointments (teacher_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages (user_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for reports updated_at
create trigger reports_updated_at
  before update on public.reports
  for each row
  execute function public.handle_updated_at();

-- View for student report counts
create or replace view public.student_report_counts_view as
select 
  reporter_id,
  sum(case when status in ('resolved','closed') then 1 else 0 end)::int as solved_count,
  sum(case when status not in ('resolved','closed') then 1 else 0 end)::int as pending_count
from public.reports
where reporter_id is not null
group by reporter_id;

-- Function for students to get their own counts
create or replace function public.get_my_report_counts()
returns table(solved_count int, pending_count int) as $$
  select
    sum(case when status in ('resolved','closed') then 1 else 0 end)::int,
    sum(case when status not in ('resolved','closed') then 1 else 0 end)::int
  from public.reports 
  where reporter_id = auth.uid();
$$ language sql stable security definer;
