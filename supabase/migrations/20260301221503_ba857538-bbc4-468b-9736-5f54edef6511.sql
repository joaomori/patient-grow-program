
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'affiliate');

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- 5. Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 6. Reward rules table
CREATE TABLE public.reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  conversions_required INTEGER NOT NULL DEFAULT 3,
  reward_type TEXT NOT NULL DEFAULT 'procedure' CHECK (reward_type IN ('discount', 'procedure')),
  reward_value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;

-- 7. Rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  reward_rule_id UUID NOT NULL REFERENCES public.reward_rules(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 8. Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_affiliate_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates WHERE user_id = _user_id LIMIT 1
$$;

-- 9. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 11. RLS Policies

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- affiliates
CREATE POLICY "Admins can manage affiliates" ON public.affiliates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own record" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- referrals: admins see all, affiliates see own
CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

CREATE POLICY "Affiliates can insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));

-- Public referral submissions (anon)
CREATE POLICY "Public can submit referrals" ON public.referrals
  FOR INSERT TO anon
  WITH CHECK (true);

-- reward_rules: admins manage, authenticated can read active
CREATE POLICY "Admins can manage reward rules" ON public.reward_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view active rules" ON public.reward_rules
  FOR SELECT TO authenticated
  USING (is_active = true);

-- rewards
CREATE POLICY "Admins can manage rewards" ON public.rewards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view own rewards" ON public.rewards
  FOR SELECT TO authenticated
  USING (affiliate_id = public.get_affiliate_id_for_user(auth.uid()));
