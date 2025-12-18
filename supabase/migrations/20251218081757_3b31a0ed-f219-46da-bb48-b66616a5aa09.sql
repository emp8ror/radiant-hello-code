-- Fix the handle_new_user function to use public schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, phone, metadata)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'role', 'tenant'),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone);
  RETURN new;
END;
$$;

-- Update existing tenant profiles with data from auth.users metadata
UPDATE public.user_profiles up
SET 
  full_name = COALESCE(up.full_name, (SELECT raw_user_meta_data ->> 'full_name' FROM auth.users WHERE id = up.id)),
  phone = COALESCE(up.phone, (SELECT raw_user_meta_data ->> 'phone' FROM auth.users WHERE id = up.id))
WHERE up.full_name IS NULL OR up.phone IS NULL;