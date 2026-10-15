/*
# Fix admin booking query column ambiguity

1. Purpose
- Fixes the admin dashboard error caused by the `id` output field in
  `get_all_bookings()` conflicting with the profiles table's `id` column.

2. Modified function
- Qualifies the admin role check as `profiles.id = auth.uid()`.
- Keeps the existing booking result fields and newest-first ordering.

3. Security
- The function remains SECURITY DEFINER.
- Only an authenticated profile with role `admin` can read all bookings.
- No booking records or user data are changed.
*/

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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT b.id, b.booking_reference, b.user_id, b.trip_id,
         t_route.origin, t_route.destination, t_route.operator_name,
         b.seat_numbers, b.passenger_name, b.phone, b.total_amount,
         b.status, b.created_at
  FROM public.bookings AS b
  LEFT JOIN LATERAL (
    SELECT t.id AS trip_id, r.origin, r.destination, t.operator_name
    FROM public.trips AS t
    JOIN public.routes AS r ON r.id = t.route_id
    WHERE t.id = b.trip_id
  ) AS t_route ON true
  ORDER BY b.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_bookings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_bookings() TO authenticated;
