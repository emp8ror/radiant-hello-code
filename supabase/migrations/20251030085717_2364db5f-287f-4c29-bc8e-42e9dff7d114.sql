-- Enable RLS on the unit_occupancy view
ALTER VIEW public.unit_occupancy SET (security_invoker = true);

-- Fix the search path for the new trigger function
DROP FUNCTION IF EXISTS public.update_unit_availability() CASCADE;

CREATE OR REPLACE FUNCTION public.update_unit_availability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.is_available := true;
  ELSE
    NEW.is_available := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER units_availability_trigger
BEFORE INSERT OR UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_unit_availability();