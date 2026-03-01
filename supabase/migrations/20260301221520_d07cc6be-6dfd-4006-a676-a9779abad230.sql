
-- Fix: restrict public referral submissions to valid active affiliates
DROP POLICY "Public can submit referrals" ON public.referrals;

CREATE POLICY "Public can submit referrals" ON public.referrals
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE id = affiliate_id AND is_active = true
    )
  );
