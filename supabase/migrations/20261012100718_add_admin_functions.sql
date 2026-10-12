/*
# Add admin management functions

Adds SECURITY DEFINER functions for admin operations:
1. promote_to_admin — verifies an admin access code and promotes the caller to admin role
2. get_all_bookings — returns all bookings with trip and route details (admin only)
3. admin_cancel_booking — cancels any booking regardless of owner (admin only)
4. get_admin_stats — returns booking counts and revenue totals (admin only)

## Security
- promote_to_admin checks a hardcoded admin code before updating the role column
  (which is normally revoked from authenticated)
- get_all_bookings, admin_cancel_booking, and get_admin_stats verify the caller
  has role='admin' before operating, preventing non-admin access
- All functions are SECURITY DEFINER with search_path = public
*/

CREATE OR REPLACE FUNCTION public.promote_to_admin(p_admin_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_admin_code IS NULL OR p_admin_code <> 'TICTIC-ADMIN-2026' THEN
    RAISE EXCEPTION 'Invalid admin access code';
  END IF;

  UPDATE public.profiles SET role = 'admin', updated_at = now()
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_to_admin(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_all_bookings()
RETURNS TABLE (
  id uuid,
  booking_reference text,
  user_id uuid,
  trip_id uuid,
  origin text,
  destination text,
  operator_name text,
  seat_numbers text[],
  passenger_name text,
  phone text,
  total_amount numeric,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT b.id, b.booking_reference, b.user_id, b.trip_id,
         t_route.origin, t_route.destination, t_route.operator_name,
         b.seat_numbers, b.passenger_name, b.phone, b.total_amount,
         b.status, b.created_at
  FROM public.bookings b
  LEFT JOIN LATERAL (
    SELECT t.id AS trip_id, r.origin, r.destination, t.operator_name
    FROM public.trips t
    JOIN public.routes r ON r.id = t.route_id
    WHERE t.id = b.trip_id
  ) t_route ON true
  ORDER BY b.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_bookings() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_all_bookings() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_cancel_booking(p_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_booking FROM public.bookings
  WHERE id = p_booking_id FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;

  UPDATE public.trip_seats
  SET status = 'available', passenger_name = NULL
  WHERE trip_id = v_booking.trip_id
    AND seat_number = ANY (v_booking.seat_numbers)
    AND status = 'booked';

  UPDATE public.bookings SET status = 'cancelled'
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cancel_booking(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_cancel_booking(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT json_build_object(
    'totalBookings', (SELECT count(*) FROM public.bookings),
    'confirmedBookings', (SELECT count(*) FROM public.bookings WHERE status = 'confirmed'),
    'cancelledBookings', (SELECT count(*) FROM public.bookings WHERE status = 'cancelled'),
    'totalRevenue', (SELECT coalesce(sum(total_amount), 0) FROM public.bookings WHERE status = 'confirmed'),
    'totalTrips', (SELECT count(*) FROM public.trips WHERE active = true),
    'totalRoutes', (SELECT count(*) FROM public.routes WHERE active = true),
    'totalUsers', (SELECT count(*) FROM public.profiles)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
