-- Fix 1: Update property_summary view to hide join_code from non-owners
DROP VIEW IF EXISTS public.property_summary CASCADE;

CREATE VIEW public.property_summary
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.owner_id,
  p.rent_amount,
  p.rent_due_day,
  p.is_active,
  p.created_at,
  p.updated_at,
  p.rent_due_interval,
  p.rent_currency,
  p.country,
  p.region,
  p.city,
  p.address,
  -- Only show join_code to property owner
  CASE 
    WHEN p.owner_id = auth.uid() THEN p.join_code 
    ELSE NULL 
  END as join_code,
  pr.average_rating,
  pr.review_count,
  (SELECT pi.image_url FROM public.property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) AS cover_image
FROM public.properties p
LEFT JOIN public.property_ratings pr ON pr.property_id = p.id;

-- Fix 2: Update mark_payment_as_paid to verify property ownership
CREATE OR REPLACE FUNCTION public.mark_payment_as_paid(
  _payment_id uuid, 
  _provider_ref text, 
  _paid_on timestamp with time zone DEFAULT now(), 
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  -- Verify caller is the property owner
  IF NOT EXISTS (
    SELECT 1 
    FROM payments p
    JOIN properties pr ON pr.id = p.property_id
    WHERE p.id = _payment_id 
      AND pr.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only property owner can mark payments as paid';
  END IF;

  -- Prevent changing already-paid payments
  IF EXISTS (
    SELECT 1 FROM payments WHERE id = _payment_id AND status = 'paid'
  ) THEN
    RAISE EXCEPTION 'Payment is already marked as paid';
  END IF;

  -- Update payment status
  UPDATE payments
  SET status = 'paid',
      provider_ref = _provider_ref,
      paid_on = _paid_on,
      metadata = coalesce(metadata, '{}'::jsonb) || _metadata
  WHERE id = _payment_id;
end;
$function$;