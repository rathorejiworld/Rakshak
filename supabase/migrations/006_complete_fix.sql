-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Verify tables exist with correct schema
-- If they don't exist, create them
CREATE TABLE IF NOT EXISTS public.students (
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

CREATE TABLE IF NOT EXISTS public.teachers (
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

CREATE TABLE IF NOT EXISTS public.roots (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  phone text,
  org text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create the trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  display_name_val text;
  user_email text;
BEGIN
  -- Extract values
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  user_email := new.email;
  display_name_val := COALESCE(
    new.raw_user_meta_data->>'display_name',
    split_part(user_email, '@', 1),
    'User'
  );

  -- Log the trigger execution for debugging
  RAISE LOG 'Creating profile for user % with role % and display_name %', new.id, user_role, display_name_val;

  -- Insert into appropriate table based on role
  CASE user_role
    WHEN 'root' THEN
      INSERT INTO public.roots (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, user_email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created root profile for %', new.id;
      
    WHEN 'teacher' THEN
      INSERT INTO public.teachers (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, user_email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created teacher profile for %', new.id;
      
    ELSE
      INSERT INTO public.students (id, display_name, email, is_verified)
      VALUES (new.id, display_name_val, user_email, false)
      ON CONFLICT (id) DO NOTHING;
      RAISE LOG 'Created student profile for %', new.id;
  END CASE;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for user %: % %', new.id, SQLSTATE, SQLERRM;
  -- Don't fail the trigger - still return new so auth.users row is created
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Fix any existing auth.users without profiles
INSERT INTO public.students (id, display_name, email, is_verified)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'User'),
  u.email,
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.roots r WHERE r.id = u.id);

-- Step 6: Verify trigger is created
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';
