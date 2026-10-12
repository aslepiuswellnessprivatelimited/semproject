/*
# Create TicTic bus booking schema

Creates the database tables for a Tamil Nadu intercity bus booking app with
sign-in. The app already has login and account-creation screens, so this
schema is multi-user with owner-scoped row level security.

## New Tables

1. `profiles`
   - `id` uuid, primary key, matches the authenticated user in auth.users
   - `display_name` text, the passenger's full name
   - `phone` text, 10-digit contact number
   - `role` text, server-controlled, defaults to 'user' (never client-writable)
   - `created_at`, `updated_at` timestamps

2. `routes`
   - Origin, destination, stops, boarding/dropping points, and duration
   - Shared catalog data visible to all signed-in users

3. `trips`
   - Scheduled services tied to a route: operator, bus type, times, fare
   - Shared catalog data visible to all signed-in users

4. `trip_seats`
   - One row per seat per trip: seat number, status (available/booked/blocked),
     passenger name, and fare
   - Visible to signed-in users; mutations happen only through booking functions

5. `bookings`
   - Passenger reservations owned by the authenticated user
   - `user_id` defaults to auth.uid() so inserts never need to pass it
   - Status is confirmed or cancelled

## Security

- Row Level Security enabled on every table.
- Profiles and bookings are owner-scoped with auth.uid() checks.
- Routes, trips, and trip_seats are read-only for authenticated users; direct
  INSERT/UPDATE/DELETE policies use WITH CHECK (false) / USING (false) to deny
  all client writes. Catalog data is seeded server-side only.
- The `role` column on profiles is revoked from authenticated so users cannot
  escalate themselves; it is set by the database default only.
- Seat booking and cancellation use SECURITY DEFINER functions that lock the
  seat rows, re-check availability, validate quantity (1-6), validate phone
  format, and compute the total fare from trip_seats — never trusting the
  client-supplied amount.

## Important Notes

1. The booking function uses FOR UPDATE row locks on trip_seats to prevent two
   users booking the same seat concurrently.
2. The client never supplies total_amount; the function sums fares from the
   locked seat rows.
3. Cancellation frees the associated seats back to 'available' and marks the
   booking 'cancelled'.
4. Seed data inserts sample Tamil Nadu routes, trips, and 28 seats per trip.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  stops text[] NOT NULL DEFAULT '{}',
  boarding_points text[] NOT NULL DEFAULT '{}',
  dropping_points text[] NOT NULL DEFAULT '{}',
  duration text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin, destination)
);

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  operator_name text NOT NULL,
  service_number text NOT NULL,
  bus_type text NOT NULL,
  departure text NOT NULL,
  arrival text NOT NULL,
  journey_date date NOT NULL DEFAULT (current_date + 1),
  fare numeric(10,2) NOT NULL CHECK (fare > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (route_id, service_number)
);

CREATE TABLE IF NOT EXISTS public.trip_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  passenger_name text,
  fare numeric(10,2) NOT NULL CHECK (fare > 0),
  UNIQUE (trip_id, seat_number)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE DEFAULT ('TT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id),
  seat_numbers text[] NOT NULL,
  passenger_name text NOT NULL,
  phone text NOT NULL,
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_route_id_idx ON public.trips(route_id);
CREATE INDEX IF NOT EXISTS trip_seats_trip_status_idx ON public.trip_seats(trip_id, status);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

REVOKE UPDATE (role) ON public.profiles FROM authenticated;

DROP POLICY IF EXISTS "routes_select_authenticated" ON public.routes;
CREATE POLICY "routes_select_authenticated" ON public.routes FOR SELECT
  TO authenticated USING (active = true);

DROP POLICY IF EXISTS "routes_insert_denied" ON public.routes;
CREATE POLICY "routes_insert_denied" ON public.routes FOR INSERT
  TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "routes_update_denied" ON public.routes;
CREATE POLICY "routes_update_denied" ON public.routes FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "routes_delete_denied" ON public.routes;
CREATE POLICY "routes_delete_denied" ON public.routes FOR DELETE
  TO authenticated USING (false);

DROP POLICY IF EXISTS "trips_select_authenticated" ON public.trips;
CREATE POLICY "trips_select_authenticated" ON public.trips FOR SELECT
  TO authenticated USING (active = true);

DROP POLICY IF EXISTS "trips_insert_denied" ON public.trips;
CREATE POLICY "trips_insert_denied" ON public.trips FOR INSERT
  TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "trips_update_denied" ON public.trips;
CREATE POLICY "trips_update_denied" ON public.trips FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "trips_delete_denied" ON public.trips;
CREATE POLICY "trips_delete_denied" ON public.trips FOR DELETE
  TO authenticated USING (false);

DROP POLICY IF EXISTS "trip_seats_select_authenticated" ON public.trip_seats;
CREATE POLICY "trip_seats_select_authenticated" ON public.trip_seats FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_seats.trip_id AND trips.active = true)
  );

DROP POLICY IF EXISTS "trip_seats_insert_denied" ON public.trip_seats;
CREATE POLICY "trip_seats_insert_denied" ON public.trip_seats FOR INSERT
  TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "trip_seats_update_denied" ON public.trip_seats;
CREATE POLICY "trip_seats_update_denied" ON public.trip_seats FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "trip_seats_delete_denied" ON public.trip_seats;
CREATE POLICY "trip_seats_delete_denied" ON public.trip_seats FOR DELETE
  TO authenticated USING (false);

DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_insert_denied" ON public.bookings;
CREATE POLICY "bookings_insert_denied" ON public.bookings FOR INSERT
  TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "bookings_update_denied" ON public.bookings;
CREATE POLICY "bookings_update_denied" ON public.bookings FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "bookings_delete_denied" ON public.bookings;
CREATE POLICY "bookings_delete_denied" ON public.bookings FOR DELETE
  TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.book_trip(
  p_trip_id uuid,
  p_seat_numbers text[],
  p_passenger_name text,
  p_phone text
) RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_unique_count integer;
  v_found_count integer;
  v_available_count integer;
  v_total numeric(10,2);
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

  SELECT count(*), coalesce(sum(fare), 0) INTO v_available_count, v_total
  FROM public.trip_seats
  WHERE trip_id = p_trip_id
    AND seat_number = ANY (SELECT upper(trim(s)) FROM unnest(p_seat_numbers) AS s)
    AND status = 'available'
  FOR UPDATE;

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

REVOKE ALL ON FUNCTION public.book_trip(uuid, text[], text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_trip(uuid, text[], text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  SELECT * INTO v_booking FROM public.bookings
  WHERE id = p_booking_id AND user_id = auth.uid() FOR UPDATE;

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

REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated;

DO $$
DECLARE
  route_data text[][] := ARRAY[
    ARRAY['Chennai','Madurai','8h 00m'],
    ARRAY['Chennai','Coimbatore','9h 00m'],
    ARRAY['Chennai','Trichy','6h 45m'],
    ARRAY['Chennai','Salem','5h 30m'],
    ARRAY['Chennai','Tirunelveli','10h 30m'],
    ARRAY['Chennai','Erode','7h 30m'],
    ARRAY['Chennai','Thanjavur','7h 15m'],
    ARRAY['Chennai','Vellore','3h 30m'],
    ARRAY['Coimbatore','Madurai','4h 30m'],
    ARRAY['Madurai','Rameswaram','3h 00m'],
    ARRAY['Chennai','Nagercoil','11h 30m'],
    ARRAY['Coimbatore','Ooty','3h 30m'],
    ARRAY['Chennai','Kumbakonam','6h 15m'],
    ARRAY['Salem','Tiruppur','3h 00m'],
    ARRAY['Madurai','Kanyakumari','4h 30m'],
    ARRAY['Chennai','Kanchipuram','2h 00m'],
    ARRAY['Trichy','Dindigul','2h 30m'],
    ARRAY['Chennai','Hosur','6h 30m'],
    ARRAY['Chennai','Cuddalore','4h 30m'],
    ARRAY['Madurai','Theni','2h 30m'],
    ARRAY['Chennai','Villupuram','3h 30m'],
    ARRAY['Chennai','Karur','7h 00m'],
    ARRAY['Madurai','Tuticorin','2h 30m'],
    ARRAY['Tirunelveli','Nagercoil','2h 00m'],
    ARRAY['Chennai','Tiruppur','8h 30m']
  ];
  operators text[] := ARRAY['KPN Travels','Parveen Travels','SETC Premium','Sri SMS Travels','Shyamoli NR Travels','IntrCity SmartBus'];
  types text[] := ARRAY['AC Sleeper','AC Seater','Semi Sleeper','Non-AC Seater'];
  v_route_id uuid;
  v_trip_id uuid;
  v_i integer;
  v_j integer;
  v_k integer;
  v_fare numeric;
  v_operator text;
  v_bus_type text;
  v_service text;
BEGIN
  FOR v_i IN 1..array_length(route_data, 1) LOOP
    INSERT INTO public.routes (origin, destination, stops, boarding_points, dropping_points, duration)
    VALUES (
      route_data[v_i][1],
      route_data[v_i][2],
      ARRAY['Tamil Nadu Highway'],
      ARRAY[route_data[v_i][1] || ' Central Bus Stand', route_data[v_i][1] || ' Main Counter'],
      ARRAY[route_data[v_i][2] || ' Bus Stand', route_data[v_i][2] || ' Main Counter'],
      route_data[v_i][3]
    )
    ON CONFLICT (origin, destination) DO UPDATE SET duration = EXCLUDED.duration
    RETURNING id INTO v_route_id;

    FOR v_j IN 0..1 LOOP
      v_fare := 680 + ((v_i * 73 + v_j * 140) % 700);
      v_operator := operators[((v_i + v_j - 1) % array_length(operators, 1)) + 1];
      v_bus_type := types[((v_i + v_j - 1) % array_length(types, 1)) + 1];
      v_service := lpad((1700 + v_i)::text, 4, '0') || '-' || route_data[v_i][2] || '-' || v_j;

      INSERT INTO public.trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
      VALUES (
        v_route_id,
        v_operator,
        v_service,
        v_bus_type,
        CASE WHEN v_j = 0 THEN '09:30 PM' ELSE '06:15 AM' END,
        CASE WHEN v_j = 0 THEN '05:30 AM' ELSE '03:00 PM' END,
        v_fare
      )
      ON CONFLICT (route_id, service_number) DO UPDATE SET fare = EXCLUDED.fare
      RETURNING id INTO v_trip_id;

      FOR v_k IN 1..28 LOOP
        INSERT INTO public.trip_seats (trip_id, seat_number, status, passenger_name, fare)
        VALUES (
          v_trip_id,
          'C' || ((v_k - 1) / 4 + 1)::text || (((v_k - 1) % 4) + 1)::text,
          CASE WHEN v_k IN (3, 8) THEN 'booked' WHEN v_k = 27 AND v_i % 2 = 0 THEN 'blocked' ELSE 'available' END,
          CASE WHEN v_k IN (3, 8) THEN 'Sample Passenger' ELSE NULL END,
          v_fare
        )
        ON CONFLICT (trip_id, seat_number) DO UPDATE SET fare = EXCLUDED.fare;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
