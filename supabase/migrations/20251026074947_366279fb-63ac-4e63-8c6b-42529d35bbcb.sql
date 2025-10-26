-- First, drop the existing foreign key constraint if it exists
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Add a new foreign key constraint that references user_profiles instead of auth.users
-- This ensures the owner_id exists in our public schema
ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;