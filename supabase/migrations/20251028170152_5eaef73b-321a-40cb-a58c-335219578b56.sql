-- Fix user_profiles policies
DROP POLICY IF EXISTS "user_profiles_select_owner_or_admin" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_self" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_by_property_owner" ON public.user_profiles;

-- Allow users to view their own profile
CREATE POLICY "user_profiles_select_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow viewing profiles of property owners for properties you're viewing/joined
CREATE POLICY "user_profiles_select_property_owners"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT owner_id FROM public.properties WHERE is_active = true
  )
);

-- Allow property owners to view tenant profiles who requested to join their properties
CREATE POLICY "user_profiles_select_tenants_of_owned_properties"
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

-- Fix tenant_properties foreign key reference to use user_profiles
ALTER TABLE public.tenant_properties 
DROP CONSTRAINT IF EXISTS tenant_properties_tenant_id_fkey;

ALTER TABLE public.tenant_properties 
ADD CONSTRAINT tenant_properties_tenant_id_user_profiles_fkey 
FOREIGN KEY (tenant_id) 
REFERENCES public.user_profiles(id) 
ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate join requests
ALTER TABLE public.tenant_properties 
DROP CONSTRAINT IF EXISTS unique_tenant_per_property;

ALTER TABLE public.tenant_properties 
ADD CONSTRAINT unique_tenant_per_property 
UNIQUE (tenant_id, property_id);