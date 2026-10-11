export interface ApiUser { name: string; email: string; role: string }
export interface ApiTrip { id: string; origin: string; destination: string; duration: string; operatorName: string; serviceNumber: string; busType: string; departure: string; arrival: string; fare: number; availableSeats: number; boardingPoints: string[]; droppingPoints: string[] }
export interface ApiSeat { seatNumber: string; status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'; passengerName: string | null; fare: number }
export interface ApiBooking { id: string; tripId: string; seatNumbers: string[]; passengerName: string; phone: string; totalAmount: number; status: string; createdAt: string }

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('tictic_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export function login(email: string, password: string) { return request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
export function register(name: string, email: string, phone: string, password: string) { return request<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, phone, password }) }); }
export function searchTrips(from: string, to: string) { return request<ApiTrip[]>(`/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`); }
export function getSeats(tripId: string) { return request<{ tripId: string; seats: ApiSeat[]; availableCount: number }>(`/trips/${tripId}/seats`); }
export function createBooking(payload: { tripId: string; seatNumbers: string[]; passengerName: string; phone: string }) { return request<ApiBooking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }); }
export function getMyBookings() { return request<ApiBooking[]>('/bookings/me'); }
export function cancelBooking(id: string) { return request<ApiBooking>(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
export function saveSession(session: { token: string; user: ApiUser }) { localStorage.setItem('tictic_token', session.token); localStorage.setItem('tictic_user', JSON.stringify(session.user)); }
export function clearSession() { localStorage.removeItem('tictic_token'); localStorage.removeItem('tictic_user'); }
