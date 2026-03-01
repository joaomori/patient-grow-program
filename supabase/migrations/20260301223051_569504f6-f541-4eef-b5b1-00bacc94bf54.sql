
-- Fix: Recreate all policies as PERMISSIVE

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- affiliates
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own record" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;

CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view own record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own record" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- referrals
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Affiliates can insert own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public can submit referrals" ON public.referrals;

CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

CREATE POLICY "Affiliates can insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

CREATE POLICY "Public can submit referrals" ON public.referrals
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND is_active = true));

-- reward_rules
DROP POLICY IF EXISTS "Admins can manage reward rules" ON public.reward_rules;
DROP POLICY IF EXISTS "Authenticated can view active rules" ON public.reward_rules;

CREATE POLICY "Admins can manage reward rules" ON public.reward_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can view active rules" ON public.reward_rules
  FOR SELECT TO authenticated
  USING (is_active = true);

-- rewards
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Affiliates can view own rewards" ON public.rewards;

CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Affiliates can view own rewards" ON public.rewards
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));
