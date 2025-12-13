-- Enable RLS on the units table (policies already exist, just need to enable RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (best practice)
ALTER TABLE public.units FORCE ROW LEVEL SECURITY;