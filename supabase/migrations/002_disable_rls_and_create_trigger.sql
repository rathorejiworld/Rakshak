-- ===== STEP 1: DISABLE ALL RLS TEMPORARILY =====
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages DISABLE ROW LEVEL SECURITY;

-- ===== STEP 2: DROP EXISTING TRIGGER AND FUNCTION =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ===== STEP 3: CREATE TRIGGER FUNCTION =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  display_name_val text;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Get display name from metadata - CORRECT EXTRACTION
  display_name_val := COALESCE(
    new.raw_user_meta_data->>'displayName',
    split_part(new.email, '@', 1),
    'User'
  );

  RAISE LOG 'Creating profile for user % with role % and display_name %', new.id, user_role, display_name_val;

  -- Insert into appropriate table based on role
  CASE user_role
    WHEN 'root' THEN
      INSERT INTO public.roots (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created root profile for %', new.id;
      
    WHEN 'teacher' THEN
      INSERT INTO public.teachers (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created teacher profile for %', new.id;
      
    ELSE
      INSERT INTO public.students (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created student profile for %', new.id;
  END CASE;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for user %: % %', new.id, SQLSTATE, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== STEP 4: CREATE TRIGGER =====
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== STEP 5: FIX EXISTING USERS WITHOUT PROFILES =====
INSERT INTO public.students (id, display_name, email, is_verified)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'User'),
  u.email,
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.roots r WHERE r.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ===== STEP 6: VERIFY SETUP =====
SELECT 
  'Trigger Status' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created' 
    AND event_object_table = 'users' 
    AND trigger_schema = 'auth'
  ) THEN '✅ Trigger exists' ELSE '❌ Trigger missing' END as result;

SELECT 
  'Function Status' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user' 
    AND routine_schema = 'public'
  ) THEN '✅ Function exists' ELSE '❌ Function missing' END as result;

SELECT 
  'RLS Status' as check_name,
  'RLS DISABLED (for testing)' as result;

-- ===== FIX EXISTING RECORDS =====
UPDATE public.students 
SET display_name = COALESCE(display_name::jsonb->>'displayName', split_part(email, '@', 1), 'User')
WHERE display_name LIKE '%{%';

UPDATE public.teachers 
SET display_name = COALESCE(display_name::jsonb->>'displayName', split_part(email, '@', 1), 'User')
WHERE display_name LIKE '%{%';

UPDATE public.roots 
SET display_name = COALESCE(display_name::jsonb->>'displayName', split_part(email, '@', 1), 'User')
WHERE display_name LIKE '%{%';
