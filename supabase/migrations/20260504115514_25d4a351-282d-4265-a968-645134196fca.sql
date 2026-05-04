REVOKE ALL ON FUNCTION public.admin_reject_or_blacklist_organization(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_or_blacklist_organization(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_or_blacklist_organization(uuid, text) TO authenticated;