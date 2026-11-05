/*
# Store additional passenger names and ages on bookings

Plain-English summary
- Multi-seat bookings now carry a name and age for every seat after the first. The first seat stays under the main passenger's name and contact number, as before.
- Booking is rejected unless every additional seat has a valid name (at least 2 letters) and age (1 to 120).

1. Modified tables
- `bookings`: new column `passengers` (jsonb, defaults to an empty list). Each entry holds `seatNumber`, `name` and `age` for one additional passenger.

2. Modified functions
- `book_trip`: replaced by a version that accepts a fifth argument, `p_additional_passengers`, a list of `{ name, age }` in the same order as the seats after the first. The old four-argument version is removed so that bookings cannot skip passenger details.
- Each additional passenger's name is written to their seat in `trip_seats`.

3. Security
- The function keeps its SECURITY DEFINER behaviour and still requires a signed-in user.
- EXECUTE is revoked from PUBLIC and anon and granted to authenticated only.

4. Notes
- No existing rows are changed or removed. Existing bookings get an empty passenger list.
*/

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS passengers jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.book_trip(uuid, text[], text, text);

CREATE OR REPLACE FUNCTION public.book_trip(
  p_trip_id uuid,
  p_seat_numbers text[],
  p_passenger_name text,
  p_phone text,
  p_additional_passengers jsonb DEFAULT '[]'::jsonb
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking public.bookings;
  v_unique_count integer;
  v_found_count integer;
  v_available_count integer := 0;
  v_total numeric(10,2) := 0;
  v_locked_seat record;
  v_extra_passengers jsonb := '[]'::jsonb;
  v_extra jsonb;
  v_index integer;
  v_extra_name text;
  v_extra_age text;
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

  IF p_additional_passengers IS NULL OR jsonb_typeof(p_additional_passengers) <> 'array'
     OR jsonb_array_length(p_additional_passengers) <> cardinality(p_seat_numbers) - 1 THEN
    RAISE EXCEPTION 'Passenger details are required for every additional seat';
  END IF;

  FOR v_index IN 1..cardinality(p_seat_numbers) - 1 LOOP
    v_extra := p_additional_passengers -> (v_index - 1);
    v_extra_name := trim(coalesce(v_extra ->> 'name', ''));
    v_extra_age := trim(coalesce(v_extra ->> 'age', ''));

    IF length(v_extra_name) < 2 THEN
      RAISE EXCEPTION 'Every passenger needs a name';
    END IF;

    IF v_extra_age !~ '^[0-9]{1,3}$' OR v_extra_age::integer NOT BETWEEN 1 AND 120 THEN
      RAISE EXCEPTION 'Enter a valid age for every passenger';
    END IF;

    v_extra_passengers := v_extra_passengers || jsonb_build_object(
      'seatNumber', upper(trim(p_seat_numbers[v_index + 1])),
      'name', v_extra_name,
      'age', v_extra_age::integer
    );
  END LOOP;

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

  FOR v_extra IN SELECT value FROM jsonb_array_elements(v_extra_passengers) LOOP
    UPDATE public.trip_seats
    SET passenger_name = v_extra ->> 'name'
    WHERE trip_id = p_trip_id
    AND seat_number = v_extra ->> 'seatNumber';
  END LOOP;

  INSERT INTO public.bookings (user_id, trip_id, seat_numbers, passenger_name, phone, total_amount, passengers)
  VALUES (auth.uid(), p_trip_id, p_seat_numbers, trim(p_passenger_name), p_phone, v_total, v_extra_passengers)
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.book_trip(uuid, text[], text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_trip(uuid, text[], text, text, jsonb) TO authenticated;
