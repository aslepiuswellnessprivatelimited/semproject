import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ApiUser { id: string; name: string; email: string; role: string; phone: string }
export interface ApiTrip { id: string; origin: string; destination: string; duration: string; operatorName: string; serviceNumber: string; busType: string; departure: string; arrival: string; fare: number; availableSeats: number; boardingPoints: string[]; droppingPoints: string[] }
export interface ApiSeat { seatNumber: string; status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'; passengerName: string | null; fare: number }
export interface ApiBookingTrip { origin: string; destination: string; operatorName: string; serviceNumber: string; departure: string; arrival: string; journeyDate: string }
export interface ApiBooking { id: string; bookingReference: string; tripId: string; seatNumbers: string[]; passengerName: string; phone: string; totalAmount: number; status: string; createdAt: string; trip?: ApiBookingTrip }
export interface AdditionalPassenger { name: string; age: number }
export interface AdminBooking { id: string; bookingReference: string; userId: string; tripId: string; origin: string; destination: string; operatorName: string; seatNumbers: string[]; passengerName: string; phone: string; totalAmount: number; status: string; createdAt: string }
export interface AdminStats { totalBookings: number; confirmedBookings: number; cancelledBookings: number; totalRevenue: number; totalTrips: number; totalRoutes: number; totalUsers: number }

function friendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (/Failed to fetch|fetch failed|network request failed/i.test(msg)) return 'Unable to connect to the booking service. Please refresh and try again.';
    if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect';
    if (/User already registered/i.test(msg)) return 'An account with that email already exists';
    if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters';
    if (/Admin access required/i.test(msg)) return 'You do not have admin privileges';
    if (/Invalid admin access code/i.test(msg)) return 'The admin access code is incorrect';
    return msg;
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(friendlyMessage(error, 'Unable to sign in. Please check your connection.'));
  const session = data.session!;
  const profile = await fetchProfile(session.user.id, session.user);
  return { token: session.access_token, user: profile };
}

export async function register(name: string, email: string, phone: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { display_name: name.trim(), phone } } });
  if (error) throw new Error(friendlyMessage(error, 'Unable to create account. Please check your connection.'));
  const session = data.session;
  if (!session) throw new Error('Account created. Please sign in to continue.');
  const { error: profileError } = await supabase.from('profiles').insert({ id: session.user.id, display_name: name.trim(), phone });
  if (profileError && !profileError.message.includes('duplicate')) throw new Error('Account created but profile setup failed. Please try signing in.');
  const profile = await fetchProfile(session.user.id, session.user);
  return { token: session.access_token, user: profile };
}

export async function adminLogin(email: string, password: string, adminCode: string): Promise<{ token: string; user: ApiUser }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(friendlyMessage(error, 'Unable to sign in. Please check your connection.'));
  const session = data.session!;
  let profile = await fetchProfile(session.user.id, session.user);

  if (profile.role !== 'admin') {
    const { error: promoteError } = await supabase.rpc('promote_to_admin', { p_admin_code: adminCode });
    if (promoteError) {
      await supabase.auth.signOut();
      throw new Error(friendlyMessage(promoteError, 'Admin authentication failed.'));
    }
    profile = await fetchProfile(session.user.id, session.user);
  }

  if (profile.role !== 'admin') {
    await supabase.auth.signOut();
    throw new Error('Admin access could not be verified.');
  }
  return { token: session.access_token, user: profile };
}

async function fetchProfile(userId: string, authUser?: { email?: string | null; user_metadata?: Record<string, unknown> }): Promise<ApiUser> {
  const { data, error } = await supabase.from('profiles').select('id, display_name, phone, role').eq('id', userId).maybeSingle();
  const email = authUser?.email ?? '';
  const metadata = authUser?.user_metadata ?? {};
  if (error || !data) {
    return { id: userId, name: typeof metadata.display_name === 'string' ? metadata.display_name : 'Passenger', email, role: 'user', phone: typeof metadata.phone === 'string' ? metadata.phone : '' };
  }
  return { id: data.id, name: data.display_name, email, role: data.role, phone: data.phone };
}

export async function searchTrips(from: string, to: string): Promise<ApiTrip[]> {
  const { data: routeData, error: routeError } = await supabase
    .from('routes')
    .select('id, origin, destination, duration, boarding_points, dropping_points')
    .ilike('origin', `%${from}%`)
    .ilike('destination', `%${to}%`)
    .eq('active', true);

  if (routeError) throw routeError;
  if (!routeData || routeData.length === 0) return [];

  const routeIds = routeData.map((r) => r.id);
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .select('id, route_id, operator_name, service_number, bus_type, departure, arrival, fare')
    .in('route_id', routeIds)
    .eq('active', true);

  if (tripError) throw tripError;
  if (!tripData || tripData.length === 0) return [];

  const trips: ApiTrip[] = tripData.map((trip) => {
    const route = routeData.find((r) => r.id === trip.route_id);
    return {
      id: trip.id,
      origin: route?.origin ?? '',
      destination: route?.destination ?? '',
      duration: route?.duration ?? '',
      operatorName: trip.operator_name,
      serviceNumber: trip.service_number,
      busType: trip.bus_type,
      departure: trip.departure,
      arrival: trip.arrival,
      fare: Number(trip.fare),
      availableSeats: 25,
      boardingPoints: route?.boarding_points ?? [],
      droppingPoints: route?.dropping_points ?? [],
    };
  });

  return trips;
}

export async function getSeats(tripId: string): Promise<{ tripId: string; seats: ApiSeat[]; availableCount: number }> {
  const { data, error } = await supabase
    .from('trip_seats')
    .select('seat_number, status, passenger_name, fare')
    .eq('trip_id', tripId)
    .order('seat_number');

  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No seats found for this trip. Please try another route.');

  const seats: ApiSeat[] = data.map((row) => ({
    seatNumber: row.seat_number as string,
    status: (row.status as string).toUpperCase() as ApiSeat['status'],
    passengerName: row.passenger_name as string | null,
    fare: Number(row.fare),
  }));
  return { tripId, seats, availableCount: seats.filter((s) => s.status === 'AVAILABLE').length };
}

export async function createBooking(payload: { tripId: string; seatNumbers: string[]; passengerName: string; phone: string; additionalPassengers: AdditionalPassenger[] }): Promise<ApiBooking> {
  const { data, error } = await supabase.rpc('book_trip', {
    p_trip_id: payload.tripId,
    p_seat_numbers: payload.seatNumbers,
    p_passenger_name: payload.passengerName,
    p_phone: payload.phone,
    p_additional_passengers: payload.additionalPassengers,
  });
  if (error) throw new Error(friendlyMessage(error, 'Unable to complete booking. Please try again.'));
  const row = data as unknown as Record<string, unknown>;
  return {
    id: row.id as string,
    bookingReference: row.booking_reference as string,
    tripId: row.trip_id as string,
    seatNumbers: row.seat_numbers as string[],
    passengerName: row.passenger_name as string,
    phone: row.phone as string,
    totalAmount: Number(row.total_amount),
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

export async function getMyBookings(): Promise<ApiBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_reference, trip_id, seat_numbers, passenger_name, phone, total_amount, status, created_at, trips(operator_name, service_number, departure, arrival, journey_date, routes(origin, destination))')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map((row) => {
    const trip = row.trips as unknown as { operator_name: string; service_number: string; departure: string; arrival: string; journey_date: string; routes: { origin: string; destination: string } | null } | null;
    return {
      id: row.id as string,
      bookingReference: row.booking_reference as string,
      tripId: row.trip_id as string,
      seatNumbers: row.seat_numbers as string[],
      passengerName: row.passenger_name as string,
      phone: row.phone as string,
      totalAmount: Number(row.total_amount),
      status: (row.status as string).toUpperCase(),
      createdAt: row.created_at as string,
      trip: trip?.routes ? {
        origin: trip.routes.origin,
        destination: trip.routes.destination,
        operatorName: trip.operator_name,
        serviceNumber: trip.service_number,
        departure: trip.departure,
        arrival: trip.arrival,
        journeyDate: trip.journey_date,
      } : undefined,
    };
  });
}

export async function cancelBooking(id: string): Promise<ApiBooking> {
  const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: id });
  if (error) throw new Error(friendlyMessage(error, 'Unable to cancel booking. Please try again.'));
  const row = data as unknown as Record<string, unknown>;
  return {
    id: row.id as string,
    bookingReference: row.booking_reference as string,
    tripId: row.trip_id as string,
    seatNumbers: row.seat_numbers as string[],
    passengerName: row.passenger_name as string,
    phone: row.phone as string,
    totalAmount: Number(row.total_amount),
    status: (row.status as string).toUpperCase(),
    createdAt: row.created_at as string,
  };
}

async function refreshSession(): Promise<void> {
  const { error } = await supabase.auth.refreshSession();
  if (error) throw new Error('Session expired. Please sign in again.');
}

export async function getAllBookings(): Promise<AdminBooking[]> {
  await refreshSession();
  const { data, error } = await supabase.rpc('get_all_bookings');
  if (error) throw new Error(friendlyMessage(error, 'Unable to load bookings. Admin access required.'));
  if (!data) return [];
  return (data as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    bookingReference: row.booking_reference as string,
    userId: row.user_id as string,
    tripId: row.trip_id as string,
    origin: row.origin as string,
    destination: row.destination as string,
    operatorName: row.operator_name as string,
    seatNumbers: row.seat_numbers as string[],
    passengerName: row.passenger_name as string,
    phone: row.phone as string,
    totalAmount: Number(row.total_amount),
    status: (row.status as string).toUpperCase(),
    createdAt: row.created_at as string,
  }));
}

export async function adminCancelBooking(id: string): Promise<void> {
  await refreshSession();
  const { error } = await supabase.rpc('admin_cancel_booking', { p_booking_id: id });
  if (error) throw new Error(friendlyMessage(error, 'Unable to cancel booking.'));
}

export async function getAdminStats(): Promise<AdminStats> {
  await refreshSession();
  const { data, error } = await supabase.rpc('get_admin_stats');
  if (error) throw new Error(friendlyMessage(error, 'Unable to load stats. Admin access required.'));
  return data as unknown as AdminStats;
}

export async function searchTripsByOperator(operatorName: string): Promise<ApiTrip[]> {
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .select('id, route_id, operator_name, service_number, bus_type, departure, arrival, fare')
    .ilike('operator_name', operatorName)
    .eq('active', true);

  if (tripError) throw tripError;
  if (!tripData || tripData.length === 0) return [];

  const routeIds = [...new Set(tripData.map((t) => t.route_id))];
  const { data: routeData, error: routeError } = await supabase
    .from('routes')
    .select('id, origin, destination, duration, boarding_points, dropping_points')
    .in('id', routeIds)
    .eq('active', true);

  if (routeError) throw routeError;

  return tripData.map((trip) => {
    const route = routeData?.find((r) => r.id === trip.route_id);
    return {
      id: trip.id,
      origin: route?.origin ?? '',
      destination: route?.destination ?? '',
      duration: route?.duration ?? '',
      operatorName: trip.operator_name,
      serviceNumber: trip.service_number,
      busType: trip.bus_type,
      departure: trip.departure,
      arrival: trip.arrival,
      fare: Number(trip.fare),
      availableSeats: 25,
      boardingPoints: route?.boarding_points ?? [],
      droppingPoints: route?.dropping_points ?? [],
    };
  });
}

export async function signOut(): Promise<void> { await supabase.auth.signOut(); }

export function saveSession(session: { token: string; user: ApiUser }): void {
  localStorage.setItem('tictic_token', session.token);
  localStorage.setItem('tictic_user', JSON.stringify(session.user));
}

export function clearSession(): void {
  localStorage.removeItem('tictic_token');
  localStorage.removeItem('tictic_user');
}

export async function restoreSession(): Promise<{ token: string; user: ApiUser } | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const profile = await fetchProfile(data.session.user.id, data.session.user);
  const session = { token: data.session.access_token, user: profile };
  saveSession(session);
  return session;
}
