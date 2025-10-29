-- Drop all existing user_profiles SELECT policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_owner_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_by_property_owner" ON public.user_profiles;

-- Create consolidated SELECT policies for user_profiles
-- 1. Users can view their own profile
CREATE POLICY "user_profiles_view_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Users can view property owners' profiles
CREATE POLICY "user_profiles_view_landlords"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT owner_id FROM public.properties WHERE is_active = true
  )
);

-- 3. Property owners can view their tenants' profiles  
CREATE POLICY "user_profiles_view_my_tenants"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tp.tenant_id 
    FROM public.tenant_properties tp
    JOIN public.properties p ON p.id = tp.property_id
    WHERE p.owner_id = auth.uid()
  )
);

-- Add unique constraint to prevent duplicate join requests (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_tenant_per_property'
  ) THEN
    ALTER TABLE public.tenant_properties 
    ADD CONSTRAINT unique_tenant_per_property 
    UNIQUE (tenant_id, property_id);
  END IF;
END $$;