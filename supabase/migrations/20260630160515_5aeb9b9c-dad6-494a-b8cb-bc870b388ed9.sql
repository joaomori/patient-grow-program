GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliates TO anon;
GRANT ALL ON public.affiliates TO service_role;