-- Insert missing user profile for the current user
-- This handles users who signed up before the trigger was created
INSERT INTO public.user_profiles (id, full_name, role, phone, metadata)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  COALESCE(raw_user_meta_data->>'role', 'tenant'),
  raw_user_meta_data->>'phone',
  raw_user_meta_data
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;