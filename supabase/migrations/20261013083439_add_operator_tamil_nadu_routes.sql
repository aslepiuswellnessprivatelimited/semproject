/*
# Expand operator routes across Tamil Nadu

1. Purpose
- Adds active services for every travel operator shown in the Vehicles page.
- Uses the existing route catalog so operators open with real origin, destination,
  departure, arrival, bus type, and fare information.

2. Data changes
- Adds trips for Parveen Travels, KPN Travels, Orange Tours & Travels,
  Rathimeena Travels, and National Travels Madurai.
- Adds 28 available seats to each newly-created trip.
- Existing trips and bookings are preserved; duplicate services are skipped.

3. Security
- No tables, columns, or access policies are changed.
- Existing authenticated read policies continue to control the client queries.

4. Important notes
- Route records are not duplicated.
- This migration is safe to run again because service numbers are checked before
  inserting trips and seats.
*/

DO $$
DECLARE
  service record;
  v_route_id uuid;
  v_trip_id uuid;
  v_seat integer;
BEGIN
  FOR service IN
    SELECT * FROM (VALUES
      ('Parveen Travels', 'Chennai', 'Coimbatore', '08:30 PM', '05:30 AM', 'AC Sleeper', 1050::numeric, 'PV-COI-01'),
      ('Parveen Travels', 'Chennai', 'Madurai', '09:30 PM', '05:30 AM', 'AC Sleeper', 1240::numeric, 'PV-MDU-01'),
      ('Parveen Travels', 'Chennai', 'Trichy', '10:00 PM', '04:45 AM', 'Semi Sleeper', 820::numeric, 'PV-TRY-01'),
      ('Parveen Travels', 'Chennai', 'Tirunelveli', '08:45 PM', '07:15 AM', 'AC Sleeper', 1390::numeric, 'PV-TNV-01'),
      ('KPN Travels', 'Chennai', 'Bengaluru', '11:00 PM', '05:00 AM', 'AC Sleeper', 650::numeric, 'KPN-BLR-01'),
      ('KPN Travels', 'Chennai', 'Coimbatore', '08:15 PM', '05:15 AM', 'AC Seater', 990::numeric, 'KPN-COI-01'),
      ('KPN Travels', 'Chennai', 'Salem', '10:00 PM', '03:30 AM', 'Semi Sleeper', 520::numeric, 'KPN-SLM-01'),
      ('KPN Travels', 'Chennai', 'Erode', '09:45 PM', '05:00 AM', 'Non-AC Seater', 690::numeric, 'KPN-ERD-01'),
      ('Orange Tours & Travels', 'Chennai', 'Madurai', '10:00 PM', '06:00 AM', 'Multi-Axle AC Sleeper', 1100::numeric, 'OT-MDU-01'),
      ('Orange Tours & Travels', 'Chennai', 'Trichy', '09:45 PM', '04:30 AM', 'AC Sleeper', 880::numeric, 'OT-TRY-01'),
      ('Orange Tours & Travels', 'Chennai', 'Tirunelveli', '08:30 PM', '07:00 AM', 'AC Sleeper', 1450::numeric, 'OT-TNV-01'),
      ('Orange Tours & Travels', 'Chennai', 'Coimbatore', '08:00 PM', '05:00 AM', 'AC Seater', 1060::numeric, 'OT-COI-01'),
      ('Rathimeena Travels', 'Chennai', 'Chidambaram', '07:00 AM', '12:00 PM', 'AC Seater', 550::numeric, 'RM-CUD-01'),
      ('Rathimeena Travels', 'Chennai', 'Kumbakonam', '10:30 PM', '04:45 AM', 'Non-AC Sleeper', 680::numeric, 'RM-KUM-01'),
      ('Rathimeena Travels', 'Chennai', 'Thanjavur', '09:15 PM', '04:30 AM', 'Semi Sleeper', 750::numeric, 'RM-TNJ-01'),
      ('Rathimeena Travels', 'Chennai', 'Velankanni', '06:00 AM', '12:30 PM', 'AC Seater', 620::numeric, 'RM-VLK-01'),
      ('National Travels Madurai', 'Chennai', 'Madurai', '10:15 PM', '06:15 AM', 'AC Sleeper', 980::numeric, 'NT-MDU-01'),
      ('National Travels Madurai', 'Chennai', 'Tirunelveli', '08:00 PM', '07:30 AM', 'Non-AC Seater', 1300::numeric, 'NT-TNV-01'),
      ('National Travels Madurai', 'Chennai', 'Nagercoil', '07:30 PM', '07:00 AM', 'Semi Sleeper', 1500::numeric, 'NT-NGL-01'),
      ('National Travels Madurai', 'Chennai', 'Trichy', '09:30 PM', '04:30 AM', 'AC Seater', 820::numeric, 'NT-TRY-01')
    ) AS entries(operator_name, origin, destination, departure, arrival, bus_type, fare, service_number)
  LOOP
    SELECT id INTO v_route_id
    FROM public.routes
    WHERE origin = service.origin AND destination = service.destination AND active = true
    LIMIT 1;

    IF v_route_id IS NULL THEN
      CONTINUE;
    END IF;

    v_trip_id := NULL;
    INSERT INTO public.trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
    VALUES (v_route_id, service.operator_name, service.service_number, service.bus_type, service.departure, service.arrival, service.fare)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_trip_id;

    IF v_trip_id IS NOT NULL THEN
      FOR v_seat IN 1..28 LOOP
        INSERT INTO public.trip_seats (trip_id, seat_number, status, fare)
        VALUES (
          v_trip_id,
          'C' || (((v_seat - 1) / 4) + 1)::text || (((v_seat - 1) % 4) + 1)::text,
          'available',
          service.fare
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
