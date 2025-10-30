-- Add tenant_id to units table to track occupancy directly
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update is_available based on tenant_id
-- Create a trigger to automatically update is_available when tenant_id changes
CREATE OR REPLACE FUNCTION public.update_unit_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.is_available := true;
  ELSE
    NEW.is_available := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER units_availability_trigger
BEFORE INSERT OR UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_unit_availability();

-- Update existing units based on tenant_properties
UPDATE public.units u
SET tenant_id = tp.tenant_id
FROM public.tenant_properties tp
WHERE tp.unit_id = u.id AND tp.status = 'active';

-- Add unit_type column for better categorization
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'standard';

-- Create a view for unit occupancy summary
CREATE OR REPLACE VIEW public.unit_occupancy AS
SELECT 
  u.id,
  u.property_id,
  u.label,
  u.unit_type,
  u.description,
  u.rent_amount,
  u.is_available,
  u.tenant_id,
  u.created_at,
  up.full_name as tenant_name,
  up.phone as tenant_phone,
  tp.status as tenant_status,
  tp.joined_at,
  tp.last_payment_date
FROM public.units u
LEFT JOIN public.tenant_properties tp ON u.id = tp.unit_id AND tp.status = 'active'
LEFT JOIN public.user_profiles up ON tp.tenant_id = up.id;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON public.units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_availability ON public.units(is_available);