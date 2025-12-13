-- Fix SECURITY DEFINER views by recreating them with SECURITY INVOKER
-- Drop views in correct order using CASCADE for dependencies

DROP VIEW IF EXISTS public.property_summary CASCADE;
DROP VIEW IF EXISTS public.unit_occupancy CASCADE;
DROP VIEW IF EXISTS public.property_ratings CASCADE;

-- Recreate property_ratings view with SECURITY INVOKER
CREATE VIEW public.property_ratings
WITH (security_invoker = true)
AS
SELECT 
  property_id,
  AVG(rating)::numeric AS average_rating,
  COUNT(*)::bigint AS review_count
FROM public.property_reviews
GROUP BY property_id;

-- Recreate property_summary view with SECURITY INVOKER  
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
  p.join_code,
  pr.average_rating,
  pr.review_count,
  (SELECT pi.image_url FROM public.property_images pi WHERE pi.property_id = p.id AND pi.is_cover = true LIMIT 1) AS cover_image
FROM public.properties p
LEFT JOIN public.property_ratings pr ON pr.property_id = p.id;

-- Recreate unit_occupancy view with SECURITY INVOKER
CREATE VIEW public.unit_occupancy
WITH (security_invoker = true)
AS
SELECT 
  u.id,
  u.property_id,
  u.label,
  u.description,
  u.unit_type,
  u.rent_amount,
  u.is_available,
  u.tenant_id,
  u.created_at,
  tp.joined_at,
  tp.last_payment_date,
  tp.status AS tenant_status,
  up.full_name AS tenant_name,
  up.phone AS tenant_phone
FROM public.units u
LEFT JOIN public.tenant_properties tp ON tp.unit_id = u.id AND tp.status = 'active'
LEFT JOIN public.user_profiles up ON up.id = u.tenant_id;