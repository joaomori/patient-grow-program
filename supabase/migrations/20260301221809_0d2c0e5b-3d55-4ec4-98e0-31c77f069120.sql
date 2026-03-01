
-- Auto-create affiliate role + record on signup
CREATE OR REPLACE FUNCTION public.handle_new_affiliate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code TEXT;
BEGIN
  -- Generate unique referral code
  _code := substr(md5(NEW.id::text || now()::text), 1, 8);
  
  -- Create affiliate role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'affiliate')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create affiliate record
  INSERT INTO public.affiliates (user_id, referral_code)
  VALUES (NEW.id, _code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_affiliate
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_affiliate();
