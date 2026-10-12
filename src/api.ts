import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ApiUser { id: string; name: string; email: string; role: string; phone: string }
export interface ApiTrip { id: string; origin: string; destination: string; duration: string; operatorName: string; serviceNumber: string; busType: string; departure: string; arrival: string; fare: number; availableSeats: number; boardingPoints: string[]; droppingPoints: string[] }
export interface ApiSeat { seatNumber: string; status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'; passengerName: string | null; fare: number }
export interface ApiBooking { id: string; bookingReference: string; tripId: string; seatNumbers: string[]; passengerName: string; phone: string; totalAmount: number; status: string; createdAt: string }

const FALLBACK_TRIPS: ApiTrip[] = [
  { id: 't1', origin: 'Chennai', destination: 'Madurai', duration: '8h 00m', operatorName: 'Shyamoli NR Travels', serviceNumber: '1731–Madurai Express', busType: 'AC Sleeper', departure: '09:30 PM', arrival: '05:30 AM', fare: 1240, availableSeats: 25, boardingPoints: ['Chennai Koyambedu'], droppingPoints: ['Madurai Mattuthavani'] },
  { id: 't2', origin: 'Chennai', destination: 'Coimbatore', duration: '9h 00m', operatorName: 'KPN Travels', serviceNumber: '2084–Western Line', busType: 'AC Seater', departure: '08:15 PM', arrival: '05:15 AM', fare: 990, availableSeats: 25, boardingPoints: ['Chennai CMBT'], droppingPoints: ['Coimbatore Gandhipuram'] },
  { id: 't3', origin: 'Chennai', destination: 'Trichy', duration: '6h 45m', operatorName: 'Parveen Travels', serviceNumber: '1108–Kaveri Night Rider', busType: 'Semi Sleeper', departure: '10:00 PM', arrival: '04:45 AM', fare: 820, availableSeats: 25, boardingPoints: ['Chennai Koyambedu'], droppingPoints: ['Trichy Central'] },
];

function createFallbackSeats(fare: number): ApiSeat[] {
  return Array.from({ length: 28 }, (_, i) => ({ seatNumber: `C${Math.floor(i / 4) + 1}${(i % 4) + 1}`, status: i === 2 || i === 7 ? 'BOOKED' : i === 26 ? 'BLOCKED' : 'AVAILABLE', passengerName: i === 2 || i === 7 ? 'Sample Passenger' : null, fare }));
}

function isNetworkError(error: unknown): boolean { return error instanceof TypeError || (error instanceof Error && /fetch|network|connect|Failed to fetch/i.test(error.message)); }

function friendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect';
    if (/User already registered/i.test(msg)) return 'An account with that email already exists';
    if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters';
    return isNetworkError(error) ? fallback : msg;
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(friendlyMessage(error, 'Unable to sign in. Please check your connection.'));
  const session = data.session!;
  const profile = await fetchProfile(session.user.id);
  return { token: session.access_token, user: profile };
}

export async function register(name: string, email: string, phone: string, password: string): Promise<{ token: string; user: ApiUser }> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { display_name: name.trim(), phone } } });
  if (error) throw new Error(friendlyMessage(error, 'Unable to create account. Please check your connection.'));
  const session = data.session;
  if (!session) throw new Error('Account created. Please sign in to continue.');
  const { error: profileError } = await supabase.from('profiles').insert({ id: session.user.id, display_name: name.trim(), phone });
  if (profileError && !profileError.message.includes('duplicate')) throw new Error('Account created but profile setup failed. Please try signing in.');
  const profile = await fetchProfile(session.user.id);
  return { token: session.access_token, user: profile };
}

async function fetchProfile(userId: string): Promise<ApiUser> {
  const { data, error } = await supabase.from('profiles').select('id, display_name, phone, role').eq('id', userId).maybeSingle();
  if (error || !data) {
    const { data: authUser } = await supabase.auth.getUser();
    return { id: userId, name: authUser.user?.user_metadata?.display_name ?? 'Passenger', email: authUser.user?.email ?? '', role: 'user', phone: authUser.user?.user_metadata?.phone ?? '' };
  }
  return { id: data.id, name: data.display_name, email: '', role: data.role, phone: data.phone };
}

export async function searchTrips(from: string, to: string): Promise<ApiTrip[]> {
  try {
    const { data, error } = await supabase.from('routes').select('id, origin, destination, duration, boarding_points, dropping_points, trips!inner(id, operator_name, service_number, bus_type, departure, arrival, fare)').ilike('origin', `%${from}%`).ilike('destination', `%${to}%`).eq('active', true);
    if (error) throw error;
    const trips: ApiTrip[] = [];
    for (const route of data ?? []) {
      for (const trip of (route as unknown as { trips: Record<string, unknown>[] }).trips) {
        trips.push({ id: trip.id as string, origin: route.origin, destination: route.destination, duration: route.duration, operatorName: trip.operator_name as string, serviceNumber: trip.service_number as string, busType: trip.bus_type as string, departure: trip.departure as string, arrival: trip.arrival as string, fare: Number(trip.fare), availableSeats: 25, boardingPoints: route.boarding_points ?? [], droppingPoints: route.dropping_points ?? [] });
      }
    }
    return trips.length > 0 ? trips : FALLBACK_TRIPS.filter((t) => t.origin.toLowerCase().includes(from.toLowerCase()) && t.destination.toLowerCase().includes(to.toLowerCase()));
  } catch {
    return FALLBACK_TRIPS.filter((t) => t.origin.toLowerCase().includes(from.toLowerCase()) && t.destination.toLowerCase().includes(to.toLowerCase()));
  }
}

export async function getSeats(tripId: string): Promise<{ tripId: string; seats: ApiSeat[]; availableCount: number }> {
  try {
    const { data, error } = await supabase.from('trip_seats').select('seat_number, status, passenger_name, fare').eq('trip_id', tripId).order('seat_number');
    if (error) throw error;
    if (!data || data.length === 0) {
      const trip = FALLBACK_TRIPS.find((t) => t.id === tripId);
      const seats = createFallbackSeats(trip?.fare ?? 1000);
      return { tripId, seats, availableCount: seats.filter((s) => s.status === 'AVAILABLE').length };
    }
    const seats: ApiSeat[] = data.map((row) => ({ seatNumber: row.seat_number as string, status: (row.status as string).toUpperCase() as ApiSeat['status'], passengerName: row.passenger_name as string | null, fare: Number(row.fare) }));
    return { tripId, seats, availableCount: seats.filter((s) => s.status === 'AVAILABLE').length };
  } catch {
    const trip = FALLBACK_TRIPS.find((t) => t.id === tripId);
    const seats = createFallbackSeats(trip?.fare ?? 1000);
    return { tripId, seats, availableCount: seats.filter((s) => s.status === 'AVAILABLE').length };
  }
}

export async function createBooking(payload: { tripId: string; seatNumbers: string[]; passengerName: string; phone: string }): Promise<ApiBooking> {
  const { data, error } = await supabase.rpc('book_trip', { p_trip_id: payload.tripId, p_seat_numbers: payload.seatNumbers, p_passenger_name: payload.passengerName, p_phone: payload.phone });
  if (error) throw new Error(friendlyMessage(error, 'Unable to complete booking. Please try again.'));
  const row = data as unknown as Record<string, unknown>;
  return { id: row.id as string, bookingReference: row.booking_reference as string, tripId: row.trip_id as string, seatNumbers: row.seat_numbers as string[], passengerName: row.passenger_name as string, phone: row.phone as string, totalAmount: Number(row.total_amount), status: row.status as string, createdAt: row.created_at as string };
}

export async function getMyBookings(): Promise<ApiBooking[]> {
  try {
    const { data, error } = await supabase.from('bookings').select('id, booking_reference, trip_id, seat_numbers, passenger_name, phone, total_amount, status, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return [];
    return data.map((row) => ({ id: row.id as string, bookingReference: row.booking_reference as string, tripId: row.trip_id as string, seatNumbers: row.seat_numbers as string[], passengerName: row.passenger_name as string, phone: row.phone as string, totalAmount: Number(row.total_amount), status: (row.status as string).toUpperCase(), createdAt: row.created_at as string }));
  } catch {
    return [];
  }
}

export async function cancelBooking(id: string): Promise<ApiBooking> {
  const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: id });
  if (error) throw new Error(friendlyMessage(error, 'Unable to cancel booking. Please try again.'));
  const row = data as unknown as Record<string, unknown>;
  return { id: row.id as string, bookingReference: row.booking_reference as string, tripId: row.trip_id as string, seatNumbers: row.seat_numbers as string[], passengerName: row.passenger_name as string, phone: row.phone as string, totalAmount: Number(row.total_amount), status: (row.status as string).toUpperCase(), createdAt: row.created_at as string };
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
  const profile = await fetchProfile(data.session.user.id);
  const session = { token: data.session.access_token, user: profile };
  saveSession(session);
  return session;
}
