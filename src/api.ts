export interface ApiUser { name: string; email: string; role: string }
export interface ApiTrip { id: string; origin: string; destination: string; duration: string; operatorName: string; serviceNumber: string; busType: string; departure: string; arrival: string; fare: number; availableSeats: number; boardingPoints: string[]; droppingPoints: string[] }
export interface ApiSeat { seatNumber: string; status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'; passengerName: string | null; fare: number }
export interface ApiBooking { id: string; tripId: string; seatNumbers: string[]; passengerName: string; phone: string; totalAmount: number; status: string; createdAt: string }

type LocalUser = ApiUser & { password: string; phone: string };
type LocalStore = { users: LocalUser[]; bookings: ApiBooking[]; trips: ApiTrip[]; seats: Record<string, ApiSeat[]> };
const API_BASE = '/api';
const LOCAL_STORE_KEY = 'tictic_local_store';

const localTrips: ApiTrip[] = [
  { id: 't1', origin: 'Chennai', destination: 'Madurai', duration: '8h 00m', operatorName: 'Shyamoli NR Travels', serviceNumber: '1731–Madurai Express', busType: 'AC Sleeper', departure: '09:30 PM', arrival: '05:30 AM', fare: 1240, availableSeats: 25, boardingPoints: ['Chennai Koyambedu'], droppingPoints: ['Madurai Mattuthavani'] },
  { id: 't2', origin: 'Chennai', destination: 'Coimbatore', duration: '9h 00m', operatorName: 'KPN Travels', serviceNumber: '2084–Western Line', busType: 'AC Seater', departure: '08:15 PM', arrival: '05:15 AM', fare: 990, availableSeats: 25, boardingPoints: ['Chennai CMBT'], droppingPoints: ['Coimbatore Gandhipuram'] },
  { id: 't3', origin: 'Chennai', destination: 'Trichy', duration: '6h 45m', operatorName: 'Parveen Travels', serviceNumber: '1108–Kaveri Night Rider', busType: 'Semi Sleeper', departure: '10:00 PM', arrival: '04:45 AM', fare: 820, availableSeats: 25, boardingPoints: ['Chennai Koyambedu'], droppingPoints: ['Trichy Central'] },
];

function createLocalSeats(fare: number): ApiSeat[] {
  return Array.from({ length: 28 }, (_, index) => ({ seatNumber: `C${Math.floor(index / 4) + 1}${(index % 4) + 1}`, status: index === 2 || index === 7 ? 'BOOKED' : index === 26 ? 'BLOCKED' : 'AVAILABLE', passengerName: index === 2 || index === 7 ? 'Sample Passenger' : null, fare }));
}

function readLocalStore(): LocalStore {
  const saved = localStorage.getItem(LOCAL_STORE_KEY);
  if (saved) return JSON.parse(saved) as LocalStore;
  const store: LocalStore = { users: [{ name: 'Demo Passenger', email: 'demo@tictic.in', role: 'USER', password: 'demo123', phone: '9876543210' }], bookings: [], trips: localTrips, seats: Object.fromEntries(localTrips.map((trip) => [trip.id, createLocalSeats(trip.fare)])) };
  localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
  return store;
}

function writeLocalStore(store: LocalStore): void { localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store)); }
function localSession(user: ApiUser): { token: string; user: ApiUser } { return { token: `local.${btoa(`${user.email}:${Date.now()}`)}`, user }; }
function isNetworkFailure(error: unknown): boolean { return error instanceof TypeError || (error instanceof Error && /fetch|network|connect/i.test(error.message)); }
async function withLocalFallback<T>(remote: () => Promise<T>, local: () => T): Promise<T> { try { return await remote(); } catch (error) { if (!isNetworkFailure(error)) throw error; return local(); } }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('tictic_token');
  if (token?.startsWith('local.') && !path.startsWith('/auth')) throw new TypeError('local session');
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export function login(email: string, password: string) {
  return withLocalFallback(() => request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }), () => {
    const user = readLocalStore().users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password);
    if (!user) throw new Error('Email or password is incorrect');
    return localSession(user);
  });
}

export function register(name: string, email: string, phone: string, password: string) {
  return withLocalFallback(() => request<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password }) }), () => {
    const store = readLocalStore();
    if (store.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with that email already exists');
    const user: LocalUser = { name: name.trim(), email: email.trim().toLowerCase(), phone, password, role: 'USER' };
    store.users.push(user); writeLocalStore(store); return localSession(user);
  });
}

export function searchTrips(from: string, to: string) {
  return withLocalFallback(() => request<ApiTrip[]>(`/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`), () => readLocalStore().trips.filter((trip) => trip.origin.toLowerCase().includes(from.toLowerCase()) && trip.destination.toLowerCase().includes(to.toLowerCase())));
}

export function getSeats(tripId: string) {
  return withLocalFallback(() => request<{ tripId: string; seats: ApiSeat[]; availableCount: number }>(`/trips/${tripId}/seats`), () => { const seats = readLocalStore().seats[tripId] ?? []; return { tripId, seats, availableCount: seats.filter((seat) => seat.status === 'AVAILABLE').length }; });
}

export function createBooking(payload: { tripId: string; seatNumbers: string[]; passengerName: string; phone: string }) {
  return withLocalFallback(() => request<ApiBooking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }), () => {
    const store = readLocalStore(); const seats = store.seats[payload.tripId] ?? [];
    if (payload.seatNumbers.length === 0 || payload.seatNumbers.length > 6) throw new Error('Choose between 1 and 6 seats');
    const selected = payload.seatNumbers.map((number) => seats.find((seat) => seat.seatNumber === number));
    if (selected.some((seat) => !seat || seat.status !== 'AVAILABLE')) throw new Error('One or more selected seats are no longer available');
    selected.forEach((seat) => { if (seat) { seat.status = 'BOOKED'; seat.passengerName = payload.passengerName; } });
    const booking: ApiBooking = { id: `TT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, tripId: payload.tripId, seatNumbers: payload.seatNumbers, passengerName: payload.passengerName, phone: payload.phone, totalAmount: selected.reduce((sum, seat) => sum + (seat?.fare ?? 0), 0), status: 'CONFIRMED', createdAt: new Date().toISOString() };
    store.bookings.push(booking); writeLocalStore(store); return booking;
  });
}

export function getMyBookings() { return withLocalFallback(() => request<ApiBooking[]>('/bookings/me'), () => { const email = JSON.parse(localStorage.getItem('tictic_user') ?? '{}').email; return readLocalStore().bookings.filter((booking) => { const user = readLocalStore().users.find((candidate) => candidate.email === email); return user ? booking.phone === user.phone : false; }); }); }
export function cancelBooking(id: string) { return withLocalFallback(() => request<ApiBooking>(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }), () => { const store = readLocalStore(); const booking = store.bookings.find((item) => item.id === id); if (!booking) throw new Error('Booking not found'); const seats = store.seats[booking.tripId] ?? []; booking.status = 'CANCELLED'; booking.seatNumbers.forEach((number) => { const seat = seats.find((item) => item.seatNumber === number); if (seat) { seat.status = 'AVAILABLE'; seat.passengerName = null; } }); writeLocalStore(store); return booking; }); }
export function saveSession(session: { token: string; user: ApiUser }) { localStorage.setItem('tictic_token', session.token); localStorage.setItem('tictic_user', JSON.stringify(session.user)); }
export function clearSession() { localStorage.removeItem('tictic_token'); localStorage.removeItem('tictic_user'); }
