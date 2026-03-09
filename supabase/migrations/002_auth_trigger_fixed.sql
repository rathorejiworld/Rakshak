-- ===== DISABLE ALL RLS TEMPORARILY =====
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages DISABLE ROW LEVEL SECURITY;

-- ===== DROP EXISTING TRIGGER AND FUNCTION =====
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ===== CREATE TRIGGER FUNCTION =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  display_name_val text;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  display_name_val := COALESCE(
    new.raw_user_meta_data->>'displayName',
    split_part(new.email, '@', 1),
    'User'
  );

  RAISE LOG 'Creating profile for user % with role % and display_name %', new.id, user_role, display_name_val;

  CASE user_role
    WHEN 'root' THEN
      INSERT INTO public.roots (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
      
    WHEN 'teacher' THEN
      INSERT INTO public.teachers (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
      
    ELSE
      INSERT INTO public.students (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, new.email, false)
      ON CONFLICT (id) DO NOTHING;
  END CASE;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for user %: % %', new.id, SQLSTATE, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== CREATE TRIGGER =====
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===== FIX EXISTING USERS WITHOUT PROFILES =====
INSERT INTO public.students (id, display_name, email, is_verified)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'displayName', split_part(u.email, '@', 1), 'User'),
  u.email,
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.roots r WHERE r.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ===== VERIFY SETUP =====
SELECT 'Trigger exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created' 
  AND event_object_table = 'users'
);

SELECT 'RLS DISABLED - Ready for testing' as status;
