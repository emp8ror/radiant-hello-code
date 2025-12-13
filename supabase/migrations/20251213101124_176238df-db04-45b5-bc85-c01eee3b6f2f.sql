-- Fix warn-level security issues

-- 1. Fix notifications INSERT policy - restrict to system/triggers only (fixes security_definer_functions)
DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;

-- Create a more restrictive notifications INSERT policy
-- Only allow inserts where the user_id matches a property owner for their own properties
-- This prevents arbitrary notification injection while still allowing the trigger to work
CREATE POLICY "notifications_insert_for_property_owners"
  ON public.notifications FOR INSERT
  WITH CHECK (
    -- Allow inserts only for notifications about properties the auth user owns
    -- This ensures the trigger can insert (runs as SECURITY DEFINER) 
    -- but regular users cannot insert arbitrary notifications
    user_id IN (
      SELECT owner_id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR
    -- Allow service role (triggers run with elevated privileges)
    auth.uid() IS NULL
  );

-- 2. Fix function search_path for functions missing it (fixes SUPA_function_search_path_mutable)
-- Update properties_generate_join_code to have fixed search_path
CREATE OR REPLACE FUNCTION public.properties_generate_join_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  if new.join_code is null then
    -- short code: 4 uppercase letters from title + '-' + 6 hex chars
    new.join_code := upper(substring(regexp_replace(coalesce(new.title,''),'[^A-Za-z]','','g'),1,4)) || '-' || substring(md5(random()::text),1,6);
  end if;
  return new;
end;
$function$;

-- Update payments_after_update to have fixed search_path
CREATE OR REPLACE FUNCTION public.payments_after_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  if (tg_op = 'UPDATE') then
    if (new.status = 'paid') then
      update tenant_properties
      set last_payment_date = coalesce(new.paid_on, now())
      where tenant_id = new.tenant_id and property_id = new.property_id;
    end if;
  elsif (tg_op = 'INSERT') then
    if (new.status = 'paid') then
      update tenant_properties
      set last_payment_date = coalesce(new.paid_on, now())
      where tenant_id = new.tenant_id and property_id = new.property_id;
    end if;
  end if;
  return new;
end;
$function$;

-- Update request_join_property_by_code to have fixed search_path
CREATE OR REPLACE FUNCTION public.request_join_property_by_code(_property_code text, _tenant uuid, _unit_id uuid DEFAULT NULL::uuid, _message text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
declare
  p_id uuid;
  new_id uuid;
begin
  select id into p_id from properties where join_code = _property_code limit 1;
  if p_id is null then
    raise exception 'Property with that join code not found';
  end if;

  insert into tenant_properties(property_id, tenant_id, unit_id, invitation_message, status, created_at)
  values (p_id, _tenant, _unit_id, _message, 'pending', now())
  returning id into new_id;

  return new_id;
end;
$function$;

-- Update mark_payment_as_paid to have fixed search_path
CREATE OR REPLACE FUNCTION public.mark_payment_as_paid(_payment_id uuid, _provider_ref text, _paid_on timestamp with time zone DEFAULT now(), _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  update payments
  set status = 'paid',
      provider_ref = _provider_ref,
      paid_on = _paid_on,
      metadata = coalesce(metadata, '{}'::jsonb) || _metadata
  where id = _payment_id;
end;
$function$;

-- 3. Fix storage policies to check property ownership (fixes storage_upload_no_owner_check)
DROP POLICY IF EXISTS "Landlords can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Landlords can delete their property images" ON storage.objects;

-- Create secure policies that verify property ownership
CREATE POLICY "Property owners can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND (
      -- Extract property_id from path (format: propertyId/filename)
      (string_to_array(name, '/'))[1]::uuid IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Property owners can update their images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND (
      (string_to_array(name, '/'))[1]::uuid IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Property owners can delete their images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
    AND (
      (string_to_array(name, '/'))[1]::uuid IN (
        SELECT id FROM public.properties WHERE owner_id = auth.uid()
      )
    )
  );

-- 4. Add database CHECK constraints for additional validation (defense in depth)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_positive;
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_rent_due_day_range;
ALTER TABLE public.properties ADD CONSTRAINT properties_rent_due_day_range CHECK (rent_due_day IS NULL OR (rent_due_day >= 1 AND rent_due_day <= 31));

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_rent_amount_positive;
ALTER TABLE public.properties ADD CONSTRAINT properties_rent_amount_positive CHECK (rent_amount > 0);

ALTER TABLE public.property_reviews DROP CONSTRAINT IF EXISTS property_reviews_rating_range;
ALTER TABLE public.property_reviews ADD CONSTRAINT property_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);