-- Create notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow system to insert notifications (via trigger with security definer)
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Create function to notify landlord on new join request
CREATE OR REPLACE FUNCTION public.notify_landlord_on_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_owner_id UUID;
  property_title TEXT;
  tenant_name TEXT;
BEGIN
  -- Only trigger on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get property owner and title
    SELECT owner_id, title INTO property_owner_id, property_title
    FROM properties WHERE id = NEW.property_id;
    
    -- Get tenant name
    SELECT full_name INTO tenant_name
    FROM user_profiles WHERE id = NEW.tenant_id;
    
    -- Insert notification for landlord
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      property_owner_id,
      'join_request',
      'New Join Request',
      COALESCE(tenant_name, 'A tenant') || ' wants to join ' || COALESCE(property_title, 'your property'),
      jsonb_build_object(
        'tenant_id', NEW.tenant_id,
        'property_id', NEW.property_id,
        'request_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new join requests
CREATE TRIGGER on_join_request_created
  AFTER INSERT ON public.tenant_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_landlord_on_join_request();