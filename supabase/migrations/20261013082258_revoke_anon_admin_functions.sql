-- Revoke anon execute from admin-only functions
REVOKE EXECUTE ON FUNCTION public.get_all_bookings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_cancel_booking(uuid) FROM anon;
