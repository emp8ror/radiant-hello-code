-- Allow property owners to view profiles of tenants who requested to join their properties
CREATE POLICY "user_profiles_select_by_property_owner"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tenant_properties tp
    JOIN public.properties p ON p.id = tp.property_id
    WHERE tp.tenant_id = user_profiles.id
      AND p.owner_id = auth.uid()
  )
);