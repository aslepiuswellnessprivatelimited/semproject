/*
# Fix concurrent seat booking row locking

1. Purpose
- Fixes the booking error caused by PostgreSQL rejecting `FOR UPDATE` on an
  aggregate query that calculated seat count and fare at the same time.

2. Modified function
- Replaces the aggregate lock in `public.book_trip` with a locked row loop.
- The function now locks each requested available seat, counts those locked
  rows, and totals their fares before changing their status.

3. Security
- Keeps the existing authenticated-only execution and SECURITY DEFINER
  behavior.
- Keeps all passenger, phone, seat-count, duplicate-seat, and availability
  validation.

4. Data safety
- No rows are deleted or reset.
- Existing bookings and seat statuses are preserved.
- Row locking continues to prevent two customers from booking the same seat.
*/

CREATE OR REPLACE FUNCTION public.book_trip(
  p_trip_id uuid,
  p_seat_numbers text[],
  p_passenger_name text,
  p_phone text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_unique_count integer;
  v_found_count integer;
  v_available_count integer := 0;
  v_total numeric(10,2) := 0;
  v_locked_seat record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_passenger_name IS NULL OR length(trim(p_passenger_name)) < 2 THEN
    RAISE EXCEPTION 'Passenger name is required';
  END IF;

  IF p_phone IS NULL OR p_phone !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Phone must contain exactly 10 digits';
  END IF;

  IF p_seat_numbers IS NULL OR cardinality(p_seat_numbers) < 1 OR cardinality(p_seat_numbers) > 6 THEN
    RAISE EXCEPTION 'Choose between 1 and 6 seats';
  END IF;

  SELECT count(*) INTO v_unique_count
  FROM (SELECT DISTINCT upper(trim(s)) AS seat_number FROM unnest(p_seat_numbers) AS s) u;

  IF v_unique_count <> cardinality(p_seat_numbers) THEN
    RAISE EXCEPTION 'Duplicate seat selection';
  END IF;

  SELECT count(*) INTO v_found_count
  FROM public.trip_seats
  WHERE trip_id = p_trip_id
    AND seat_number = ANY (SELECT upper(trim(s)) FROM unnest(p_seat_numbers) AS s);

  IF v_found_count <> cardinality(p_seat_numbers) THEN
    RAISE EXCEPTION 'Invalid seat selection';
  END IF;

  FOR v_locked_seat IN
    SELECT fare
    FROM public.trip_seats
    WHERE trip_id = p_trip_id
      AND seat_number = ANY (SELECT upper(trim(s)) FROM unnest(p_seat_numbers) AS s)
      AND status = 'available'
    FOR UPDATE
  LOOP
    v_available_count := v_available_count + 1;
    v_total := v_total + v_locked_seat.fare;
  END LOOP;

  IF v_available_count <> cardinality(p_seat_numbers) THEN
    RAISE EXCEPTION 'One or more seats are no longer available';
  END IF;

  UPDATE public.trip_seats
  SET status = 'booked', passenger_name = trim(p_passenger_name)
  WHERE trip_id = p_trip_id
    AND seat_number = ANY (SELECT upper(trim(s)) FROM unnest(p_seat_numbers) AS s);

  INSERT INTO public.bookings (user_id, trip_id, seat_numbers, passenger_name, phone, total_amount)
  VALUES (auth.uid(), p_trip_id, p_seat_numbers, trim(p_passenger_name), p_phone, v_total)
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;
