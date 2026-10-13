/*
# Add missing travel operators and admin user

1. Adds routes and trips for Orange Tours & Travels, Rathimeena Travels,
   and National Travels Madurai to match the Vehicles page.
2. Adds missing KPN routes (Bengaluru, Salem).
3. Creates an admin user account with known credentials.

## Admin User
- Email: admin@tictic.in
- Password: admin123456
- Role: admin
*/

INSERT INTO routes (origin, destination, duration, boarding_points, dropping_points)
VALUES
  ('Chennai', 'Chidambaram', '5h 00m', ARRAY['Chennai Koyambedu'], ARRAY['Chidambaram Bus Stand']),
  ('Chennai', 'Velankanni', '6h 30m', ARRAY['Chennai Koyambedu'], ARRAY['Velankanni Bus Stand']),
  ('Chennai', 'Nagercoil', '11h 30m', ARRAY['Chennai Koyambedu', 'Chennai Central'], ARRAY['Nagercoil Bus Stand']),
  ('Chennai', 'Bengaluru', '6h 00m', ARRAY['Chennai Koyambedu', 'Chennai CMBT'], ARRAY['Bengaluru Majestic', 'Bengaluru Electronic City'])
ON CONFLICT (origin, destination) DO NOTHING;

DO $$
DECLARE
  v_route_id uuid;
  v_trip_id uuid;
  v_k integer;
  v_fare numeric;
  v_service text;
  v_op text;
BEGIN
  -- Helper: create trip + 28 seats for a given operator/route/bus_type/departure/arrival/fare/service
  -- Orange Tours & Travels
  v_op := 'Orange Tours & Travels';
  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Madurai';
  v_fare := 1100; v_service := 'OT-2201-Madurai';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Multi-Axle AC Sleeper', '10:00 PM', '06:00 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Trichy';
  v_fare := 880; v_service := 'OT-3301-Trichy';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Sleeper', '09:45 PM', '04:30 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Tirunelveli';
  v_fare := 1450; v_service := 'OT-4401-Tirunelveli';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Sleeper', '08:30 PM', '07:00 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  -- Rathimeena Travels
  v_op := 'Rathimeena Travels';
  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Chidambaram';
  v_fare := 550; v_service := 'RM-5501-Chidambaram';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Seater', '07:00 AM', '12:00 PM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Kumbakonam';
  v_fare := 680; v_service := 'RM-6601-Kumbakonam';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Non-AC Sleeper', '10:30 PM', '04:45 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Thanjavur';
  v_fare := 750; v_service := 'RM-7701-Thanjavur';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Semi Sleeper', '09:15 PM', '04:30 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Velankanni';
  v_fare := 620; v_service := 'RM-8801-Velankanni';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Seater', '06:00 AM', '12:30 PM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  -- National Travels Madurai
  v_op := 'National Travels Madurai';
  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Madurai';
  v_fare := 980; v_service := 'NT-9901-Madurai';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Sleeper', '10:15 PM', '06:15 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Tirunelveli';
  v_fare := 1300; v_service := 'NT-9902-Tirunelveli';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Non-AC Seater', '08:00 PM', '07:30 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Nagercoil';
  v_fare := 1500; v_service := 'NT-9903-Nagercoil';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Semi Sleeper', '07:30 PM', '07:00 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  -- KPN Travels: Chennai-Bengaluru
  v_op := 'KPN Travels';
  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Bengaluru';
  v_fare := 650; v_service := 'KPN-5501-Bengaluru';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'AC Sleeper', '11:00 PM', '05:00 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;

  -- KPN Travels: Chennai-Salem
  SELECT id INTO v_route_id FROM routes WHERE origin='Chennai' AND destination='Salem';
  v_fare := 520; v_service := 'KPN-5502-Salem';
  INSERT INTO trips (route_id, operator_name, service_number, bus_type, departure, arrival, fare)
  VALUES (v_route_id, v_op, v_service, 'Semi Sleeper', '10:00 PM', '03:30 AM', v_fare)
  ON CONFLICT (route_id, service_number) DO NOTHING RETURNING id INTO v_trip_id;
  IF v_trip_id IS NOT NULL THEN FOR v_k IN 1..28 LOOP INSERT INTO trip_seats (trip_id, seat_number, status, fare) VALUES (v_trip_id, 'C'||((v_k-1)/4+1)::text||(((v_k-1)%4)+1)::text, 'available', v_fare) ON CONFLICT DO NOTHING; END LOOP; END IF;
END $$;

-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token,
  email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@tictic.in',
  crypt('admin123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"TicTic Admin","phone":"9876543210"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT DO NOTHING;

-- Insert admin profile
INSERT INTO profiles (id, display_name, phone, role)
SELECT u.id, 'TicTic Admin', '9876543210', 'admin'
FROM auth.users u
WHERE u.email = 'admin@tictic.in'
ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = 'TicTic Admin';
