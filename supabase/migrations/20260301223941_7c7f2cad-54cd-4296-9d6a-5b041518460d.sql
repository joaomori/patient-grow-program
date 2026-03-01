
-- Fix: Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- affiliates
DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own record" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can view own record" ON public.affiliates;

CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own record" ON public.affiliates FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own record" ON public.affiliates FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- referrals
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Affiliates can insert own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Public can submit referrals" ON public.referrals;

CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

CREATE POLICY "Affiliates can insert own referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

CREATE POLICY "Public can submit referrals" ON public.referrals FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = referrals.affiliate_id AND affiliates.is_active = true));

-- rewards
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Affiliates can view own rewards" ON public.rewards;

CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own rewards" ON public.rewards FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

-- reward_rules
DROP POLICY IF EXISTS "Admins can manage reward rules" ON public.reward_rules;
DROP POLICY IF EXISTS "Authenticated can view active rules" ON public.reward_rules;

CREATE POLICY "Admins can manage reward rules" ON public.reward_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active rules" ON public.reward_rules FOR SELECT TO authenticated
  USING (is_active = true);

-- profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Add FK from affiliates.user_id to profiles.id for join to work
ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
