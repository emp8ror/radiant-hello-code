-- Ensure current user has a profile before any tenant_properties operations
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user profile if it doesn't exist
  INSERT INTO public.user_profiles (id, role)
  SELECT NEW.tenant_id, 'tenant'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = NEW.tenant_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to ensure profile exists before tenant_properties insert
DROP TRIGGER IF EXISTS ensure_profile_before_tenant_insert ON public.tenant_properties;
CREATE TRIGGER ensure_profile_before_tenant_insert
  BEFORE INSERT ON public.tenant_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_profile();