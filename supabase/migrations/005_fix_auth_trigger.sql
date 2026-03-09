-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
  display_name_val text;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Get display name from metadata or use email prefix
  display_name_val := COALESCE(
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Insert into appropriate table based on role
  IF user_role = 'root' THEN
    INSERT INTO public.roots (id, display_name, email, is_verified)
    VALUES (new.id, display_name_val, new.email, false)
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (id, display_name, email, is_verified)
    VALUES (new.id, display_name_val, new.email, false)
    ON CONFLICT (id) DO NOTHING;
    
  ELSE
    -- Default to student
    INSERT INTO public.students (id, display_name, email, is_verified)
    VALUES (new.id, display_name_val, new.email, false)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the trigger
  RAISE LOG 'handle_new_user error for user %: % %', new.id, SQLSTATE, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user TO postgres;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users without profiles
INSERT INTO public.students (id, display_name, email, is_verified)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'User'),
  email,
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.roots r WHERE r.id = u.id)
ON CONFLICT (id) DO NOTHING;
