CREATE OR REPLACE FUNCTION public.get_affiliate_by_code(code text)
RETURNS TABLE(id uuid, referral_code text, is_active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT a.id, a.referral_code, a.is_active FROM public.affiliates a WHERE a.referral_code = code AND a.is_active = true LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.get_affiliate_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_by_code(text) TO anon, authenticated;