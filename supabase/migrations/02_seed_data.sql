-- Note: This seed data assumes users have been created in auth.users
-- In production, create users via Supabase Auth API first, then insert profiles

-- Insert 3 root users (replace UUIDs with actual auth.users IDs)
-- Example only - you'll need to create these users via the Supabase dashboard or API first

-- Example seed structure (adjust IDs based on your actual auth.users)
/*
insert into public.profiles (id, display_name, role, is_verified) values
  ('00000000-0000-0000-0000-000000000001', 'Root Admin 1', 'root', true),
  ('00000000-0000-0000-0000-000000000002', 'Root Admin 2', 'root', true),
  ('00000000-0000-0000-0000-000000000003', 'Root Admin 3', 'root', true);

-- Insert sample teachers
insert into public.profiles (id, display_name, role, org, class, is_verified) values
  ('00000000-0000-0000-0000-000000000011', 'Teacher Alice', 'teacher', 'Central High', 'Class A', true),
  ('00000000-0000-0000-0000-000000000012', 'Teacher Bob', 'teacher', 'Central High', 'Class B', true),
  ('00000000-0000-0000-0000-000000000013', 'Teacher Carol', 'teacher', 'East School', 'Class C', true);

-- Insert sample students
insert into public.profiles (id, display_name, role, org, class, is_verified) values
  ('00000000-0000-0000-0000-000000000021', 'Student John', 'student', 'Central High', 'Class A', true),
  ('00000000-0000-0000-0000-000000000022', 'Student Jane', 'student', 'Central High', 'Class A', true),
  ('00000000-0000-0000-0000-000000000023', 'Student Mike', 'student', 'Central High', 'Class B', true),
  ('00000000-0000-0000-0000-000000000024', 'Student Sarah', 'student', 'East School', 'Class C', true);

-- Insert sample reports
insert into public.reports (reporter_id, title, description, category, status, priority, teacher_owner) values
  ('00000000-0000-0000-0000-000000000021', 'Need Legal Advice', 'I need help with a legal matter regarding housing.', 'legal', 'new', 'high', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000022', 'Feeling Overwhelmed', 'I am struggling with stress and anxiety.', 'emotional', 'in_progress', 'medium', '00000000-0000-0000-0000-000000000011'),
  (null, 'Anonymous Report', 'This is an anonymous submission.', 'other', 'new', 'low', null);
*/

-- Instructions: Replace the UUIDs above with actual user IDs from auth.users table
-- You can get these after creating users through Supabase Auth

comment on table public.profiles is 'User profiles linked to auth.users';
comment on table public.reports is 'Student reports for legal/emotional support';
comment on table public.evidence is 'Evidence files uploaded for reports';
comment on table public.appointments is 'Scheduled appointments between students and teachers';
comment on table public.audit_logs is 'Audit trail for sensitive operations';
comment on table public.chat_messages is 'Chat history with AI assistants';
