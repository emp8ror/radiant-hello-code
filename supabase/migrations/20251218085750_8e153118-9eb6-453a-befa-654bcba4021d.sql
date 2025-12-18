-- Add duration_months column to payments table for tracking payment periods
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 1;

-- Add payment_expires_at column to track when the payment period ends
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_expires_at timestamp with time zone;

-- Create a function to calculate payment expiry date
CREATE OR REPLACE FUNCTION public.calculate_payment_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.paid_on IS NOT NULL THEN
    NEW.payment_expires_at := NEW.paid_on + (COALESCE(NEW.duration_months, 1) || ' months')::interval;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate payment expiry
DROP TRIGGER IF EXISTS calculate_payment_expiry_trigger ON public.payments;
CREATE TRIGGER calculate_payment_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_payment_expiry();