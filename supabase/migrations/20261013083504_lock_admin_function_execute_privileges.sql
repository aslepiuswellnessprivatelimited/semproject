/*
# Restrict administrative function execution

1. Purpose
- Removes the default PUBLIC execute privilege from administrative functions.
- Keeps admin promotion available to signed-in users so the access-code flow works.
- Keeps booking administration available only to authenticated sessions; each
  function still checks the caller's role before returning or changing data.

2. Modified functions
- `promote_to_admin(text)` remains executable by authenticated users only.
- `get_all_bookings()` is executable by authenticated users only.
- `get_admin_stats()` is executable by authenticated users only.
- `admin_cancel_booking(uuid)` is executable by authenticated users only.

3. Security
- Anonymous callers cannot invoke administrative functions.
- No rows, bookings, seats, or user accounts are deleted or changed.
*/

REVOKE ALL ON FUNCTION public.promote_to_admin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_all_bookings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_cancel_booking(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.promote_to_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_cancel_booking(uuid) TO authenticated;
