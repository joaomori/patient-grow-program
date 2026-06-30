DROP POLICY IF EXISTS "Public can submit referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "anon can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public referrals insert" ON public.referrals;
DROP POLICY IF EXISTS "Allow anonymous referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public referrals can be created" ON public.referrals;
DROP POLICY IF EXISTS "Public referrals insert policy" ON public.referrals;
REVOKE INSERT ON public.referrals FROM anon;