CREATE OR REPLACE FUNCTION public.get_affiliate_id_by_referral_code(referral_code TEXT)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates WHERE referral_code = $1 AND is_active = true LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_id_by_referral_code(TEXT) TO anon;

DROP POLICY IF EXISTS "Public can view active affiliates by referral code" ON public.affiliates;
REVOKE SELECT ON public.affiliates FROM anon;