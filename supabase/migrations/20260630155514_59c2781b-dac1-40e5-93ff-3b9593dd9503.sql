GRANT SELECT ON public.affiliates TO anon;

CREATE POLICY "Public can view active affiliates by referral code" ON public.affiliates
  FOR SELECT TO anon
  USING (is_active = true);