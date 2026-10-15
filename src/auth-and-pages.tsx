import { ArrowLeft, ArrowRight, BarChart3, BusFront, CalendarDays, CalendarClock, CircleHelp, Clock3, Compass, LoaderCircle, LogOut, MapPin, Search, Settings, Shield, Ticket, TicketCheck, TrendingUp, Users, WalletCards } from 'lucide-react';
import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { adminCancelBooking, adminLogin, cancelBooking, getAllBookings, getAdminStats, getMyBookings, login, register, searchTrips, searchTripsByOperator, type AdminBooking, type AdminStats, type ApiBooking, type ApiTrip, type ApiUser } from '@/api';

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

type HomeDashboardProps = {
  user: ApiUser;
  onSearch: (from: string, to: string) => void;
  onNavigate: (destination: 'Trips' | 'Schedules' | 'Vehicles' | 'Admin') => void;
  onLogout: () => void;
};

const dashboardSchedules = [
  { route: 'Chennai → Madurai', departure: '09:30 PM', arrival: '05:30 AM', duration: '8h 00m' },
  { route: 'Chennai → Coimbatore', departure: '08:15 PM', arrival: '05:15 AM', duration: '9h 00m' },
  { route: 'Chennai → Trichy', departure: '10:00 PM', arrival: '04:45 AM', duration: '6h 45m' },
];

export function HomeDashboard({ user, onSearch, onNavigate, onLogout }: HomeDashboardProps) {
  const [from, setFrom] = useState('Chennai');
  const [to, setTo] = useState('Madurai');
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<ApiBooking[]>([]);

  useEffect(() => {
    getMyBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    onSearch(from.trim() || 'Chennai', to.trim() || 'Madurai');
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="auth-brand"><Ticket size={24} /><span>TicTic</span></div>
        <nav className="home-nav">
          <button className="home-nav-active">Home</button>
          <button onClick={() => onSearch(from, to)}>Search</button>
          <button onClick={() => onNavigate('Schedules')}>Schedules</button>
          <button onClick={() => onNavigate('Trips')}>Trips</button>
          <button onClick={() => onNavigate('Vehicles')}>Vehicles</button>
          {user.role === 'admin' && <button onClick={() => onNavigate('Admin')}>Admin</button>}
        </nav>
        <div className="home-header-actions"><button className="icon-button" aria-label="Settings"><Settings size={17} /></button><button className="icon-button" aria-label="Sign out" onClick={onLogout}><LogOut size={17} /></button></div>
      </header>

      <section className="home-content">
        <div className="home-hero home-reveal">
          <div><p className="eyebrow">Your next journey starts here</p><h1>Hi, {user.name}</h1><p className="home-hero-copy">How can we help with your trip today?</p></div>
          <div className="home-hero-art"><BusFront size={76} strokeWidth={1.25} /><span>Travel better. Arrive happier.</span></div>
        </div>

        <form className="dashboard-search home-reveal home-reveal-delay-1" onSubmit={submitSearch}>
          <div className="dashboard-search-heading"><div><p className="eyebrow">Plan your journey</p><h2>Search buses</h2></div><Compass size={24} /></div>
          <div className="dashboard-search-fields">
            <label><span>From</span><input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="Starting city" /></label>
            <label><span>To</span><input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Destination" /></label>
            <label><span>Journey date</span><input type="date" value={journeyDate} onChange={(event) => setJourneyDate(event.target.value)} /></label>
            <button className="dashboard-search-button"><Search size={17} /> Search buses</button>
          </div>
        </form>

        <div className="dashboard-grid">
          <section className="dashboard-card trips-preview home-reveal home-reveal-delay-2"><div className="dashboard-card-heading"><div><p className="eyebrow">Your travel history</p><h2>My trips</h2></div><button className="text-action" onClick={() => onNavigate('Trips')}>View all <ArrowRight size={14} /></button></div>{bookings.length === 0 ? <div className="dashboard-empty"><TicketCheck size={22} /><p>Your booked journeys will appear here.</p><button onClick={() => onSearch(from, to)}>Book your first trip</button></div> : bookings.slice(0, 2).map((booking) => <div className="dashboard-trip" key={booking.id}><div><strong>{booking.bookingReference ?? 'TicTic booking'}</strong><p>{booking.passengerName} · {booking.seatNumbers.join(', ')}</p></div><span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span></div>)}</section>
          <section className="dashboard-card home-reveal home-reveal-delay-3"><div className="dashboard-card-heading"><div><p className="eyebrow">Plan ahead</p><h2>Quick actions</h2></div><WalletCards size={22} /></div><div className="quick-actions"><button onClick={() => onSearch(from, to)}><Search size={18} /><span>Search bus</span></button><button onClick={() => onNavigate('Trips')}><TicketCheck size={18} /><span>My trips</span></button><button onClick={() => onNavigate('Schedules')}><CalendarClock size={18} /><span>Schedules</span></button><button onClick={() => onNavigate('Vehicles')}><BusFront size={18} /><span>Vehicles</span></button></div></section>
        </div>

        <div className="dashboard-grid dashboard-grid-wide">
          <section className="dashboard-card home-reveal home-reveal-delay-4"><div className="dashboard-card-heading"><div><p className="eyebrow">Popular this week</p><h2>Popular routes</h2></div><TrendingUp size={22} /></div><div className="popular-route-list">{['Madurai', 'Coimbatore', 'Trichy', 'Bangalore'].map((destination) => <button key={destination} onClick={() => onSearch('Chennai', destination)}><span>Chennai <ArrowRight size={14} /> {destination}</span><ArrowRight size={15} /></button>)}</div></section>
          <section className="dashboard-card schedule-preview home-reveal home-reveal-delay-5"><div className="dashboard-card-heading"><div><p className="eyebrow">Today’s departures</p><h2>Bus schedules</h2></div><button className="text-action" onClick={() => onNavigate('Schedules')}>See more <ArrowRight size={14} /></button></div>{dashboardSchedules.map((schedule) => <div className="schedule-preview-item" key={schedule.route}><div><strong>{schedule.route}</strong><p><Clock3 size={12} /> {schedule.duration}</p></div><span>{schedule.departure}<small>{schedule.arrival}</small></span></div>)}</section>
        </div>

        <section className="dashboard-info home-reveal home-reveal-delay-5"><div className="dashboard-info-icon"><CalendarDays size={23} /></div><div><p className="eyebrow">Travel smart</p><h2>Comfortable journeys across Tamil Nadu</h2><p>Choose an earlier departure for the widest seat selection, keep your booking reference ready, and arrive at the boarding point 15 minutes early.</p></div></section>
      </section>
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

export function SchedulesView({ onBack, onChoose, initialFrom = 'Chennai', initialTo = 'Madurai' }: { onBack: () => void; onChoose: (trip: ApiTrip) => void; initialFrom?: string; initialTo?: string }) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
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
    <SimplePage title="Search buses" description="Search live services by starting point and destination across Tamil Nadu." action="Back to tickets" onAction={onBack}>
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
  const recent = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const confirmedCount = stats?.confirmedBookings ?? 0;
  const cancelledCount = stats?.cancelledBookings ?? 0;
  const totalCount = stats?.totalBookings ?? 0;
  const confirmedPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
  const cancelledPct = totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0;

  // Route breakdown for bar chart
  const routeCounts: Record<string, number> = {};
  bookings.forEach((b) => {
    const key = b.destination || 'Unknown';
    routeCounts[key] = (routeCounts[key] ?? 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxRouteCount = topRoutes[0]?.[1] ?? 1;

  // Donut chart
  const confirmedAngle = totalCount > 0 ? (confirmedCount / totalCount) * 251.2 : 0;

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <button className="back-button" onClick={onBack}><ArrowLeft size={18} /></button>
        <div className="auth-brand"><Shield size={22} /><span>TicTic Admin</span></div>
        <div className="admin-header-right"><span className="eyebrow">Signed in as {user.name}</span></div>
      </header>

      <div className="admin-body">
        {error && (
          <div className="admin-error-banner">
            <BarChart3 size={16} />
            <span>{error}</span>
            <button onClick={() => {
              setError(''); setLoading(true);
              Promise.all([getAllBookings(), getAdminStats()])
                .then(([b, s]) => { setBookings(b); setStats(s); setLoading(false); })
                .catch((r) => { setError(r instanceof Error ? r.message : 'Retry failed'); setLoading(false); });
            }}>Retry</button>
          </div>
        )}

        {loading && (
          <div className="admin-loading">
            <LoaderCircle className="spin" size={28} />
            <p>Loading dashboard data…</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* ── Stat cards ── */}
            <section className="admin-stat-grid">
              <div className="admin-stat-card admin-stat-total">
                <div className="admin-stat-icon"><TrendingUp size={22} /></div>
                <div><strong>{totalCount}</strong><small>Total Bookings</small></div>
              </div>
              <div className="admin-stat-card admin-stat-confirmed">
                <div className="admin-stat-icon"><Ticket size={22} /></div>
                <div><strong>{confirmedCount}</strong><small>Confirmed</small></div>
              </div>
              <div className="admin-stat-card admin-stat-cancelled">
                <div className="admin-stat-icon"><Users size={22} /></div>
                <div><strong>{cancelledCount}</strong><small>Cancelled</small></div>
              </div>
              <div className="admin-stat-card admin-stat-revenue">
                <div className="admin-stat-icon"><BarChart3 size={22} /></div>
                <div><strong>₹{Number(stats.totalRevenue).toLocaleString('en-IN')}</strong><small>Total Revenue</small></div>
              </div>
              <div className="admin-stat-card admin-stat-routes">
                <div className="admin-stat-icon"><MapPin size={22} /></div>
                <div><strong>{stats.totalRoutes}</strong><small>Active Routes</small></div>
              </div>
              <div className="admin-stat-card admin-stat-users">
                <div className="admin-stat-icon"><CalendarDays size={22} /></div>
                <div><strong>{stats.totalUsers}</strong><small>Registered Users</small></div>
              </div>
            </section>

            {/* ── Charts row ── */}
            <div className="admin-charts-row">
              {/* Donut */}
              <div className="admin-chart-card">
                <h3>Booking status</h3>
                <p className="eyebrow">Confirmed vs Cancelled</p>
                <div className="admin-donut-wrap">
                  <svg viewBox="0 0 90 90" className="admin-donut" aria-label="Booking status donut chart">
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#e8ede6" strokeWidth="10" />
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#e3846b" strokeWidth="10"
                      strokeDasharray={`${(cancelledCount / (totalCount || 1)) * 251.2} 251.2`}
                      strokeDashoffset="0" transform="rotate(-90 45 45)" className="admin-donut-ring" />
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#4caf6a" strokeWidth="10"
                      strokeDasharray={`${confirmedAngle} 251.2`}
                      strokeDashoffset={`${-(cancelledCount / (totalCount || 1)) * 251.2}`}
                      transform="rotate(-90 45 45)" className="admin-donut-ring" />
                    <text x="45" y="42" textAnchor="middle" className="admin-donut-pct">{confirmedPct}%</text>
                    <text x="45" y="52" textAnchor="middle" className="admin-donut-label">confirmed</text>
                  </svg>
                  <div className="admin-donut-legend">
                    <span><i style={{ background: '#4caf6a' }} />Confirmed ({confirmedCount})</span>
                    <span><i style={{ background: '#e3846b' }} />Cancelled ({cancelledCount})</span>
                  </div>
                </div>
                <div className="admin-pct-bar">
                  <div className="admin-pct-fill" style={{ width: `${confirmedPct}%`, background: '#4caf6a' }} />
                  <div className="admin-pct-fill" style={{ width: `${cancelledPct}%`, background: '#e3846b' }} />
                </div>
                <p className="admin-pct-labels"><span>{confirmedPct}% confirmed</span><span>{cancelledPct}% cancelled</span></p>
              </div>

              {/* Bar chart – top routes */}
              <div className="admin-chart-card admin-chart-bar-card">
                <h3>Top destinations</h3>
                <p className="eyebrow">Bookings by destination</p>
                {topRoutes.length === 0 ? (
                  <p className="empty-state" style={{ marginTop: 20 }}>No booking data yet.</p>
                ) : (
                  <div className="admin-bar-chart">
                    {topRoutes.map(([dest, count]) => (
                      <div className="admin-bar-row" key={dest}>
                        <span className="admin-bar-label">{dest}</span>
                        <div className="admin-bar-track">
                          <div className="admin-bar-fill" style={{ width: `${(count / maxRouteCount) * 100}%` }} />
                        </div>
                        <span className="admin-bar-value">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent activity */}
              <div className="admin-chart-card">
                <h3>Recent bookings</h3>
                <p className="eyebrow">Last {recent.length} transactions</p>
                <div className="admin-recent-list">
                  {recent.length === 0 && <p className="empty-state">No bookings yet.</p>}
                  {recent.map((b) => (
                    <div className="admin-recent-item" key={b.id}>
                      <div className="admin-recent-dot" data-status={b.status.toLowerCase()} />
                      <div>
                        <strong>{b.passengerName}</strong>
                        <p>{b.origin} → {b.destination}</p>
                        <small>{b.bookingReference} · ₹{b.totalAmount}</small>
                      </div>
                      <span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Booking table ── */}
            <div className="admin-table-card">
              <div className="admin-bookings-header">
                <h3>All bookings</h3>
                <div className="admin-filter">
                  {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
                    <button key={f} className={filter === f ? 'filter-active' : ''} onClick={() => setFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length === 0 ? (
                <p className="empty-state">No bookings to show.</p>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Reference</th><th>Passenger</th><th>Route</th><th>Operator</th><th>Seats</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {filtered.map((booking) => (
                        <tr key={booking.id}>
                          <td className="admin-td-ref">{booking.bookingReference}</td>
                          <td><strong>{booking.passengerName}</strong><br /><small>{booking.phone}</small></td>
                          <td>{booking.origin} → {booking.destination}</td>
                          <td>{booking.operatorName}</td>
                          <td>{booking.seatNumbers.join(', ')}</td>
                          <td>₹{booking.totalAmount}</td>
                          <td><small>{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</small></td>
                          <td><span className={`status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                          <td>{booking.status !== 'CANCELLED' && <button className="admin-cancel-btn" onClick={() => cancel(booking.id)}>Cancel</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <button className="modal-button" style={{ marginTop: 28 }} onClick={onBack}>Back to home <ArrowRight size={16} /></button>
      </div>
    </main>
  );
}

const travelOperators = [
  { name: 'Parveen Travels', description: 'Major private fleet provider offering AC/non-AC sleeper and seater coaches for routes across South India.', fleet: ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper'], routes: 'Chennai, Madurai, Coimbatore, Bengaluru' },
  { name: 'KPN Travels', description: 'Connects Chennai with key cities like Bengaluru, Coimbatore, and Salem.', fleet: ['AC Sleeper', 'Semi Sleeper', 'Non-AC Seater'], routes: 'Chennai, Bengaluru, Coimbatore, Salem' },
  { name: 'Orange Tours & Travels', description: 'Long-distance sleeper and multi-axle AC services.', fleet: ['Multi-Axle AC Sleeper', 'AC Sleeper', 'AC Seater'], routes: 'Chennai, Madurai, Trichy, Tirunelveli' },
  { name: 'Rathimeena Travels', description: 'Popular for routes connecting Chennai to Chidambaram, Kumbakonam, Tanjore, and Velankanni.', fleet: ['AC Seater', 'Non-AC Sleeper', 'Semi Sleeper'], routes: 'Chennai, Chidambaram, Kumbakonam, Tanjore, Velankanni' },
  { name: 'National Travels Madurai', description: 'Frequent connections between Chennai and southern Tamil Nadu hubs.', fleet: ['AC Sleeper', 'Non-AC Seater', 'Semi Sleeper'], routes: 'Chennai, Madurai, Tirunelveli, Nagercoil' },
];

export function VehiclesView({ onBack, onChooseTrip }: { onBack: () => void; onChooseTrip: (trip: ApiTrip) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [operatorTrips, setOperatorTrips] = useState<Record<string, ApiTrip[]>>({});
  const [loadingOperator, setLoadingOperator] = useState<string | null>(null);
  const [tripError, setTripError] = useState('');

  async function toggleOperator(name: string) {
    if (expanded === name) { setExpanded(null); return; }
    setExpanded(name);
    setTripError('');
    if (operatorTrips[name]) return;
    setLoadingOperator(name);
    try {
      const trips = await searchTripsByOperator(name);
      setOperatorTrips((prev) => ({ ...prev, [name]: trips }));
    } catch (reason) {
      setTripError(reason instanceof Error ? reason.message : 'Unable to load routes for this operator.');
    } finally {
      setLoadingOperator(null);
    }
  }

  return (
    <SimplePage title="Our travel partners" description="TicTic partners with Tamil Nadu's most trusted bus operators. Click an operator to see their available routes and book directly." action="Back to tickets" onAction={onBack}>
      <div className="operator-list">
        {travelOperators.map((operator) => (
          <article className="operator-card" key={operator.name}>
            <div className="operator-header" onClick={() => toggleOperator(operator.name)}>
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
                <h4 className="operator-routes-heading">Routes & schedules</h4>
                {loadingOperator === operator.name && <p className="empty-state">Loading routes…</p>}
                {tripError && <p className="auth-error">{tripError}</p>}
                {!loadingOperator && operatorTrips[operator.name]?.length === 0 && <p className="empty-state">No active routes found for this operator.</p>}
                {!loadingOperator && operatorTrips[operator.name] && operatorTrips[operator.name].length > 0 && (
                  <div className="schedule-list">
                    {operatorTrips[operator.name].map((trip) => (
                      <button className="schedule-item" key={trip.id} onClick={() => onChooseTrip(trip)}>
                        <div>
                          <span className="eyebrow">{trip.busType}</span>
                          <h3>{trip.origin} <ArrowRight size={14} /> {trip.destination}</h3>
                          <p>{trip.departure} · {trip.duration} · {trip.serviceNumber}</p>
                        </div>
                        <strong>₹{trip.fare}</strong>
                      </button>
                    ))}
                  </div>
                )}
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
