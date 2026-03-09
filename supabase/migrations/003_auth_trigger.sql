-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Determine role from metadata or default to 'student'
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Insert into appropriate table based on role
  IF user_role = 'root' THEN
    INSERT INTO public.roots (id, display_name, email, is_verified)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      new.email,
      false
    );
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (id, display_name, email, is_verified)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      new.email,
      false
    );
  ELSE
    -- Default to student
    INSERT INTO public.students (id, display_name, email, is_verified)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      new.email,
      false
    );
  END IF;
  
  RETURN new;
EXCEPTION WHEN others THEN
  -- Log error but don't fail signup
  RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
