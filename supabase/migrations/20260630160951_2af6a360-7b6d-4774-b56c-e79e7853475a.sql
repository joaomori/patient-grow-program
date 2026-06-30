CREATE OR REPLACE FUNCTION public.debug_current_role()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$ SELECT current_user::text $$;

GRANT EXECUTE ON FUNCTION public.debug_current_role() TO anon, authenticated;