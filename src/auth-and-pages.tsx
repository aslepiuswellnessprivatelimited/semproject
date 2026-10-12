import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, BusFront, CalendarDays, CircleHelp, LoaderCircle, MapPin, Search, Shield, Ticket, TrendingUp, Users } from 'lucide-react';
import { adminCancelBooking, adminLogin, cancelBooking, getAllBookings, getAdminStats, getMyBookings, login, register, searchTrips, type AdminBooking, type AdminStats, type ApiBooking, type ApiTrip, type ApiUser } from '@/api';

export type AuthSession = { token: string; user: ApiUser };

type AuthProps = { mode: 'login' | 'register'; onModeChange: (mode: 'login' | 'register') => void; onAuthenticated: (session: AuthSession) => void };

export function AuthScreen({ mode, onModeChange, onAuthenticated }: AuthProps) {
  const [authTab, setAuthTab] = useState<'user' | 'admin'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      if (authTab === 'admin') {
        const session = await adminLogin(email, password, adminCode);
        onAuthenticated(session);
      } else {
        const session = mode === 'login' ? await login(email, password) : await register(name, email, phone, password);
        onAuthenticated(session);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue'); } finally { setLoading(false); }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand"><Ticket size={25} /><span>TicTic</span></div>
        <p className="eyebrow">Tamil Nadu journeys, thoughtfully booked</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${authTab === 'user' ? 'auth-tab-active' : ''}`} onClick={() => { setAuthTab('user'); setError(''); }}>
            <Users size={15} /> Passenger
          </button>
          <button className={`auth-tab ${authTab === 'admin' ? 'auth-tab-active' : ''}`} onClick={() => { setAuthTab('admin'); setError(''); }}>
            <Shield size={15} /> Admin
          </button>
        </div>

        {authTab === 'user' ? (
          <>
            <h1>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
            <p className="auth-copy">{mode === 'login' ? 'Sign in to select seats and manage your trips.' : 'Save your passenger details and book in a few simple steps.'}</p>
            <form onSubmit={submit}>
              {mode === 'register' && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" /></label>}
              <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              {mode === 'register' && <label>Phone number<input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required pattern="[0-9]{10}" inputMode="numeric" placeholder="10-digit number" /></label>}
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></>}</button>
            </form>
            <button className="auth-switch" onClick={() => { onModeChange(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'New to TicTic? Create an account' : 'Already have an account? Sign in'}</button>
            <p className="demo-note">Create an account or sign in with your email and password</p>
          </>
        ) : (
          <>
            <h1>Admin access</h1>
            <p className="auth-copy">Sign in with your credentials and enter the admin access code to manage bookings and view platform stats.</p>
            <form onSubmit={submit}>
              <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
              <label>Admin access code<input value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required placeholder="Enter admin code" /></label>
              {error && <p className="auth-error">{error}</p>}
              <button className="auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <>Sign in as admin <ArrowRight size={17} /></>}</button>
            </form>
            <button className="auth-switch" onClick={() => { setAuthTab('user'); setError(''); }}>Back to passenger sign in</button>
          </>
        )}
      </div>
    </main>
  );
}

export function TripsView({ onBack }: { onBack: () => void }) {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBookings()
      .then((data) => { setBookings(data); setLoading(false); })
      .catch((reason) => { setError(reason instanceof Error ? reason.message : 'Unable to load trips'); setLoading(false); });
  }, []);

  async function cancel(id: string) {
    try { await cancelBooking(id); setBookings((items) => items.map((item) => item.id === id ? { ...item, status: 'CANCELLED' } : item)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to cancel booking. Please try again.'); }
  }

  return (
    <SimplePage title="My trips" description="Your confirmed and cancelled TicTic journeys, all in one place." action="Back to tickets" onAction={onBack}>
      <div className="trip-list">
        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="empty-state">Loading your trips…</p>}
        {!loading && bookings.length === 0 && !error && <p className="empty-state">No trips yet. Your next journey will appear here.</p>}
        {bookings.map((booking) => (
          <article className="trip-item" key={booking.id}>
            <div>
              <span className="eyebrow">{booking.bookingReference ?? booking.id}</span>
              <h3>{booking.passengerName}</h3>
              <p>{booking.seatNumbers.join(', ')} · ₹{booking.totalAmount}</p>
            </div>
            <div className="trip-actions">
              <span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span>
              {booking.status !== 'CANCELLED' && <button onClick={() => cancel(booking.id)}>Cancel</button>}
            </div>
          </article>
        ))}
      </div>
    </SimplePage>
  );
}

export function SchedulesView({ onBack, onChoose }: { onBack: () => void; onChoose: (trip: ApiTrip) => void }) {
  const [from, setFrom] = useState('Chennai');
  const [to, setTo] = useState('Madurai');
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try { setTrips(await searchTrips(from, to)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to search schedules'); }
    finally { setLoading(false); }
  }

  return (
    <SimplePage title="Schedules" description="Find an intercity service across Tamil Nadu." action="Back to tickets" onAction={onBack}>
      <form className="schedule-search" onSubmit={search}>
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <ArrowRight size={17} />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        <button disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <><Search size={16} /> Search</>}</button>
      </form>
      {error && <p className="auth-error">{error}</p>}
      {!loading && trips.length === 0 && !error && <p className="empty-state">No services found for this route. Try a different search.</p>}
      <div className="schedule-list">
        {trips.map((trip) => (
          <button className="schedule-item" key={trip.id} onClick={() => onChoose(trip)}>
            <div>
              <span className="eyebrow">{trip.operatorName}</span>
              <h3>{trip.origin} <ArrowRight size={14} /> {trip.destination}</h3>
              <p>{trip.departure} · {trip.duration} · {trip.busType}</p>
            </div>
            <strong>₹{trip.fare}</strong>
          </button>
        ))}
      </div>
    </SimplePage>
  );
}

export function AdminView({ onBack, user }: { onBack: () => void; user: ApiUser }) {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    Promise.all([getAllBookings(), getAdminStats()])
      .then(([b, s]) => { setBookings(b); setStats(s); setLoading(false); })
      .catch((reason) => { setError(reason instanceof Error ? reason.message : 'Unable to load admin data'); setLoading(false); });
  }, []);

  async function cancel(id: string) {
    try { await adminCancelBooking(id); setBookings((items) => items.map((item) => item.id === id ? { ...item, status: 'CANCELLED' } : item)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to cancel booking.'); }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter.toUpperCase());

  return (
    <main className="simple-page">
      <div className="simple-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={18} /></button>
        <div className="auth-brand"><Shield size={23} /><span>TicTic Admin</span></div>
      </div>
      <div className="simple-content admin-content">
        <p className="eyebrow">Administration panel</p>
        <h1>Dashboard</h1>
        <p>Welcome, {user.name}. Manage bookings and monitor platform activity.</p>

        {error && <p className="auth-error">{error}</p>}
        {loading && <p className="empty-state">Loading admin data…</p>}

        {!loading && stats && (
          <div className="admin-stats">
            <div className="stat-card"><div className="stat-icon stat-green"><TrendingUp size={20} /></div><div><strong>{stats.totalBookings}</strong><small>Total bookings</small></div></div>
            <div className="stat-card"><div className="stat-icon stat-blue"><Ticket size={20} /></div><div><strong>{stats.confirmedBookings}</strong><small>Confirmed</small></div></div>
            <div className="stat-card"><div className="stat-icon stat-amber"><BarChart3 size={20} /></div><div><strong>{stats.cancelledBookings}</strong><small>Cancelled</small></div></div>
            <div className="stat-card"><div className="stat-icon stat-green"><CalendarDays size={20} /></div><div><strong>₹{stats.totalRevenue}</strong><small>Revenue</small></div></div>
            <div className="stat-card"><div className="stat-icon stat-blue"><MapPin size={20} /></div><div><strong>{stats.totalRoutes}</strong><small>Routes</small></div></div>
            <div className="stat-card"><div className="stat-icon stat-amber"><Users size={20} /></div><div><strong>{stats.totalUsers}</strong><small>Users</small></div></div>
          </div>
        )}

        {!loading && (
          <div className="admin-bookings">
            <div className="admin-bookings-header">
              <h3>All bookings</h3>
              <div className="admin-filter">
                {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
                  <button key={f} className={filter === f ? 'filter-active' : ''} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? <p className="empty-state">No bookings to show.</p> : (
              <div className="trip-list">
                {filtered.map((booking) => (
                  <article className="trip-item admin-trip-item" key={booking.id}>
                    <div>
                      <span className="eyebrow">{booking.bookingReference}</span>
                      <h3>{booking.passengerName}</h3>
                      <p>{booking.origin} → {booking.destination} · {booking.operatorName}</p>
                      <p>{booking.seatNumbers.join(', ')} · ₹{booking.totalAmount} · {booking.phone}</p>
                    </div>
                    <div className="trip-actions">
                      <span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span>
                      {booking.status !== 'CANCELLED' && <button onClick={() => cancel(booking.id)}>Cancel</button>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
        <button className="modal-button" onClick={onBack}>Back to tickets <ArrowRight size={16} /></button>
      </div>
    </main>
  );
}

export const travelOperators = [
  { name: 'Parveen Travels', description: 'Major private fleet provider offering AC/non-AC sleeper and seater coaches for routes across South India.', fleet: ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper'], routes: 'Chennai, Madurai, Coimbatore, Bengaluru' },
  { name: 'KPN Travels INDIA Ltd', description: 'Connects Chennai with key cities like Bengaluru, Coimbatore, and Salem.', fleet: ['AC Sleeper', 'Semi Sleeper', 'Non-AC Seater'], routes: 'Chennai, Bengaluru, Coimbatore, Salem' },
  { name: 'Orange Tours & Travels', description: 'Long-distance sleeper and multi-axle AC services.', fleet: ['Multi-Axle AC Sleeper', 'AC Sleeper', 'AC Seater'], routes: 'Chennai, Madurai, Trichy, Tirunelveli' },
  { name: 'Rathimeena Travels', description: 'Popular for routes connecting Chennai to Chidambaram, Kumbakonam, Tanjore, and Velankanni.', fleet: ['AC Seater', 'Non-AC Sleeper', 'Semi Sleeper'], routes: 'Chennai, Chidambaram, Kumbakonam, Tanjore, Velankanni' },
  { name: 'National Travels Madurai', description: 'Frequent connections between Chennai and southern Tamil Nadu hubs.', fleet: ['AC Sleeper', 'Non-AC Seater', 'Semi Sleeper'], routes: 'Chennai, Madurai, Tirunelveli, Nagercoil' },
];

export function VehiclesView({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SimplePage title="Our travel partners" description="TicTic partners with Tamil Nadu's most trusted bus operators. Browse their fleets and find the right service for your journey." action="Back to tickets" onAction={onBack}>
      <div className="operator-list">
        {travelOperators.map((operator) => (
          <article className="operator-card" key={operator.name} onClick={() => setExpanded(expanded === operator.name ? null : operator.name)}>
            <div className="operator-header">
              <div className="operator-icon"><BusFront size={22} /></div>
              <div className="operator-info">
                <h3>{operator.name}</h3>
                <p>{operator.routes}</p>
              </div>
              <ArrowRight size={18} className={`operator-arrow ${expanded === operator.name ? 'operator-arrow-open' : ''}`} />
            </div>
            <p className="operator-desc">{operator.description}</p>
            {expanded === operator.name && (
              <div className="operator-fleet">
                <h4>Available bus types</h4>
                <div className="fleet-grid">
                  {operator.fleet.map((busType) => (
                    <div className="fleet-item" key={busType}>
                      <div className="fleet-bus"><BusFront size={18} /></div>
                      <div>
                        <strong>{busType}</strong>
                        <small>{busType.includes('Sleeper') ? 'Reclining berths' : busType.includes('Multi') ? 'Premium double-deck' : 'Reclining seats'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </SimplePage>
  );
}

export function SimplePage({ title, description, action, onAction, children }: { title: string; description: string; action: string; onAction: () => void; children?: ReactNode }) {
  return (
    <main className="simple-page">
      <div className="simple-header">
        <button className="back-button" onClick={onAction}><ArrowLeft size={18} /></button>
        <div className="auth-brand"><Ticket size={23} /><span>TicTic</span></div>
      </div>
      <div className="simple-content">
        <CircleHelp size={26} className="simple-icon" />
        <p className="eyebrow">TicTic travel desk</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        <button className="modal-button" onClick={onAction}>{action} <ArrowRight size={16} /></button>
      </div>
    </main>
  );
}
