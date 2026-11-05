import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Armchair,
  BedDouble,
  BusFront,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  DoorOpen,
  Gauge,
  MapPin,
  Menu,
  Navigation,
  Printer,
  Search,
  Settings,
  Snowflake,
  Ticket,
  UsersRound,
  Wind,
  WalletCards,
  X,
} from 'lucide-react';
import { createBooking, getSeats, restoreSession, saveSession, signOut, searchTrips, type AdditionalPassenger, type ApiTrip, type ApiUser } from '@/api';
import { AdminView, AuthScreen, HomeDashboard, SchedulesView, SimplePage, TripsView, VehiclesView } from '@/auth-and-pages';
import { createSeatArray, countAvailableSeats, toggleSeat, type Seat } from '@/utils/seatArray';
import { getBusTypeFeatures } from '@/utils/busType';
import AdditionalPassengersModal from '@/components/AdditionalPassengersModal';
import { LogOut, AlertCircle } from 'lucide-react';

const routes = [
  {
    id: 'madurai',
    origin: 'Chennai',
    destination: 'Madurai',
    operator: 'Shyamoli NR Travels',
    service: '1731–Madurai Express',
    type: 'AC Sleeper',
    departure: '09:30 PM',
    arrival: '05:30 AM',
    duration: '8h 00m',
    fare: 1240,
    boarding: 'Chennai Koyambedu',
    dropping: 'Madurai Mattuthavani',
  },
  {
    id: 'coimbatore',
    origin: 'Chennai',
    destination: 'Coimbatore',
    operator: 'KPN Travels',
    service: '2084–Western Line',
    type: 'AC Seater',
    departure: '08:15 PM',
    arrival: '05:15 AM',
    duration: '9h 00m',
    fare: 990,
    boarding: 'Chennai CMBT',
    dropping: 'Gandhipuram',
  },
  {
    id: 'trichy',
    origin: 'Chennai',
    destination: 'Trichy',
    operator: 'Parveen Travels',
    service: '1108–Kaveri Night Rider',
    type: 'Semi Sleeper',
    departure: '10:00 PM',
    arrival: '04:45 AM',
    duration: '6h 45m',
    fare: 820,
    boarding: 'Chennai Koyambedu',
    dropping: 'Trichy Central',
  },
];

const trendingRoutes = ['Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Erode', 'Thanjavur', 'Vellore'];
const navItems = [
  { label: 'Tickets', icon: Ticket },
  { label: 'Search', icon: Search },
  { label: 'Routes', icon: Navigation },
  { label: 'Schedules', icon: CalendarDays },
  { label: 'Trips', icon: WalletCards },
  { label: 'Support', icon: CircleHelp },
  { label: 'Vehicles', icon: BusFront },
];

type TicketDetails = {
  bookingReference: string;
  passengerName: string;
  phone: string;
  seatNumbers: string[];
  totalAmount: number;
  origin: string;
  destination: string;
  operatorName: string;
  departure: string;
  arrival: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function App() {
  const [activeRoute, setActiveRoute] = useState(routes[0]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('Home');
  const [searchFrom, setSearchFrom] = useState('Chennai');
  const [searchTo, setSearchTo] = useState('Madurai');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tictic_token'));
  const [user, setUser] = useState<ApiUser | null>(() => { const value = localStorage.getItem('tictic_user'); return value ? JSON.parse(value) as ApiUser : null; });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [seats, setSeats] = useState<Seat[]>(() => createSeatArray(7, routes[0].fare));
  const [passengerName, setPassengerName] = useState('');
  const [phone, setPhone] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [ticketDetails, setTicketDetails] = useState<TicketDetails | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const restored = await restoreSession();
      if (!mounted) return;
      if (restored) { setToken(restored.token); setUser(restored.user); }
      setAuthReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!token) return;
    searchTrips('Chennai', routes[0].destination).then((trips) => {
      if (trips[0]) applyApiTrip(trips[0]);
    }).catch(() => setBookingError('Unable to load the starting trip. Use Search to choose another route.'));
  }, [token]);

  const selectedSeats = useMemo(() => seats.filter((seat) => seat.status === 'selected'), [seats]);
  const availableSeats = countAvailableSeats(seats);
  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.fare, 0);
  const serviceCharge = selectedSeats.length ? 45 : 0;
  const tax = Math.round(subtotal * 0.05);
  const discount = selectedSeats.length >= 2 ? 120 : 0;
  const total = subtotal + serviceCharge + tax - discount;
  const busFeatures = getBusTypeFeatures(activeRoute.type);
  const primaryPassengerName = passengerName.trim() || user?.name.trim() || '';
  const primaryDetailsValid = selectedSeats.length > 0 && primaryPassengerName.length >= 2 && phone.replace(/\D/g, '').length === 10 && !!user;

  function applyApiTrip(trip: ApiTrip) {
    const nextRoute = { id: trip.id, origin: trip.origin, destination: trip.destination, operator: trip.operatorName, service: trip.serviceNumber, type: trip.busType, departure: trip.departure, arrival: trip.arrival, duration: trip.duration, fare: trip.fare, boarding: trip.boardingPoints[0] ?? `${trip.origin} Bus Stand`, dropping: trip.droppingPoints[0] ?? `${trip.destination} Bus Stand` };
    setActiveTripId(trip.id);
    setActiveRoute(nextRoute);
    getSeats(trip.id).then((data) => setSeats(data.seats.map((seat) => ({ seatNumber: seat.seatNumber, fare: seat.fare, status: seat.status === 'AVAILABLE' ? 'available' : seat.status === 'BOOKED' ? 'sold' : 'blocked' })))).catch(() => undefined);
  }

  function chooseRoute(destination: string) {
    const nextRoute = routes.find((route) => route.destination === destination) ?? routes[0];
    setActiveRoute(nextRoute);
    setBookingError('');
    searchTrips('Chennai', destination).then((trips) => {
      if (trips[0]) applyApiTrip(trips[0]);
      else { setBookingError('No services found for this route. Try another destination.'); setSeats(createSeatArray(7, nextRoute.fare)); }
    }).catch(() => { setBookingError('Unable to search for trips. Please try again.'); setSeats(createSeatArray(7, nextRoute.fare)); });
  }

  function handleSeatClick(seat: Seat) {
    if (seat.status === 'sold' || seat.status === 'blocked') return;
    if (seat.status === 'available' && selectedSeats.length >= 6) return;
    setSeats((currentSeats) => toggleSeat(currentSeats, seat.seatNumber));
  }

  async function handleLogout() {
    await signOut();
    localStorage.removeItem('tictic_token');
    localStorage.removeItem('tictic_user');
    setToken(null);
    setUser(null);
    setActiveNav('Home');
  }

  function handleBuyClick() {
    if (!primaryDetailsValid) return;
    if (selectedSeats.length > 1) {
      setBookingError('');
      setPassengerModalOpen(true);
      return;
    }
    handleBook([]);
  }

  async function handleBook(additionalPassengers: AdditionalPassenger[]) {
    const bookingPassengerName = passengerName.trim() || user?.name.trim() || '';
    if (selectedSeats.length === 0 || bookingPassengerName.length < 2 || phone.replace(/\D/g, '').length !== 10 || !user) return;
    if (!activeTripId) { setBookingError('Please wait for the trip to load, then try again.'); return; }
    setBookingError('');
    setBookingLoading(true);
    try {
      const booking = await createBooking({ tripId: activeTripId, seatNumbers: selectedSeats.map((seat) => seat.seatNumber), passengerName: bookingPassengerName, phone: phone.replace(/\D/g, ''), additionalPassengers });
      setPassengerModalOpen(false);
      setBookingMessage(`Booking ${booking.bookingReference} confirmed for seats ${booking.seatNumbers.join(', ')}. Total: ₹${booking.totalAmount}`);
      setTicketDetails({ bookingReference: booking.bookingReference, passengerName: bookingPassengerName, phone: phone.replace(/\D/g, ''), seatNumbers: booking.seatNumbers, totalAmount: booking.totalAmount, origin: activeRoute.origin, destination: activeRoute.destination, operatorName: activeRoute.operator, departure: activeRoute.departure, arrival: activeRoute.arrival });
      setShowConfirmation(true);
      setPassengerName('');
      setPhone('');
      const data = await getSeats(activeTripId);
      setSeats(data.seats.map((seat) => ({ seatNumber: seat.seatNumber, fare: seat.fare, status: seat.status === 'AVAILABLE' ? 'available' : seat.status === 'BOOKED' ? 'sold' : 'blocked' })));
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Booking could not be completed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  }

  function printTicket() {
    if (!ticketDetails) return;
    const printWindow = window.open('', '_blank', 'width=760,height=900');
    if (!printWindow) { setBookingError('Please allow pop-ups to print your ticket.'); return; }
    const ticket = ticketDetails;
    printWindow.document.write(`<!doctype html><html><head><title>TicTic Ticket ${escapeHtml(ticket.bookingReference)}</title><style>body{font-family:Arial,sans-serif;color:#26352a;padding:40px;max-width:680px;margin:auto}header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #dce8d5;padding-bottom:20px}h1{margin:0;font-size:28px}h2{margin:28px 0 8px;font-size:20px}.reference{color:#4a8654;font-weight:700;letter-spacing:.08em}.route{font-size:24px;font-weight:700;margin:18px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;border-top:1px solid #d9dfd5;padding-top:18px}.label{display:block;color:#778176;font-size:12px;margin-bottom:5px}.value{font-size:15px;font-weight:600}.total{margin-top:24px;padding:18px;background:#edf5e8;border-radius:12px;font-size:20px;font-weight:700}@media print{body{padding:0}}</style></head><body><header><h1>TicTic</h1><span class="reference">${escapeHtml(ticket.bookingReference)}</span></header><p class="route">${escapeHtml(ticket.origin)} → ${escapeHtml(ticket.destination)}</p><p>${escapeHtml(ticket.operatorName)}</p><div class="grid"><div><span class="label">Passenger</span><span class="value">${escapeHtml(ticket.passengerName)}</span></div><div><span class="label">Contact</span><span class="value">${escapeHtml(ticket.phone)}</span></div><div><span class="label">Seats</span><span class="value">${escapeHtml(ticket.seatNumbers.join(', '))}</span></div><div><span class="label">Departure / Arrival</span><span class="value">${escapeHtml(ticket.departure)} / ${escapeHtml(ticket.arrival)}</span></div></div><div class="total">Total paid: ₹${ticket.totalAmount}</div><p>Keep this ticket ready when boarding.</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  if (!authReady) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: 'center' }}><div className="auth-brand"><Ticket size={25} /><span>TicTic</span></div><p className="auth-copy">Loading your journey…</p></div></main>;
  if (!token) return <AuthScreen mode={authMode} onModeChange={setAuthMode} onAuthenticated={(session) => { saveSession(session); setToken(session.token); setUser(session.user); setActiveNav('Home'); }} />;
  if (activeNav === 'Home') return <HomeDashboard user={user!} onSearch={(from, to) => { setSearchFrom(from); setSearchTo(to); setActiveNav('Search'); }} onNavigate={(destination) => setActiveNav(destination)} onLogout={handleLogout} />;
  if (activeNav === 'Trips') return <TripsView onBack={() => setActiveNav('Home')} />;
  if (activeNav === 'Search' || activeNav === 'Routes' || activeNav === 'Schedules') return <SchedulesView initialFrom={searchFrom} initialTo={searchTo} onBack={() => setActiveNav('Home')} onChoose={(trip) => { applyApiTrip(trip); setActiveNav('Tickets'); }} />;
  if (activeNav === 'Support') return <SimplePage title="Travel support" description="Need help with a booking? Our travel desk is available for every TicTic journey." action="Back to home" onAction={() => setActiveNav('Home')} />;
  if (activeNav === 'Vehicles') return <VehiclesView onBack={() => setActiveNav('Home')} onChooseTrip={(trip) => { applyApiTrip(trip); setActiveNav('Tickets'); }} />;
  if (activeNav === 'Admin' && user?.role === 'admin') return <AdminView onBack={() => setActiveNav('Home')} user={user} />;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="app-panel">
        <header className="topbar">
          <div className="brand-mark"><Ticket size={24} strokeWidth={2.4} /><span>TicTic</span></div>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
          <nav className={`top-nav ${menuOpen ? 'is-open' : ''}`}>
            {['Home', 'Buy Tickets', 'Search', 'Schedules', 'Trips', 'Vehicles', ...(user?.role === 'admin' ? ['Admin'] : [])].map((item) => (
              <button className={(activeNav === item || (item === 'Buy Tickets' && activeNav === 'Tickets')) ? 'top-nav-active' : ''} key={item} onClick={() => setActiveNav(item === 'Buy Tickets' ? 'Tickets' : item)}>{item}</button>
            ))}
          </nav>
          <div className="location-chip"><MapPin size={14} /><span>Your location:</span><strong>Chennai</strong></div>
          <button className="icon-button" aria-label="Settings"><Settings size={17} /></button>
          <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={handleLogout}><LogOut size={17} /></button>
        </header>

        <div className="content-layout">
          <aside className="side-rail">
            <div className="rail-top">
              {navItems.map(({ label, icon: Icon }) => (
                <button key={label} className={`rail-button ${activeNav === label ? 'rail-active' : ''}`} onClick={() => setActiveNav(label)} aria-label={label} title={label}>
                  <Icon size={17} />
                </button>
              ))}
            </div>
            <div className="rail-bottom">
              <button className="rail-button"><UsersRound size={17} /></button>
              <div className="avatar">{user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'TT'}</div>
            </div>
          </aside>

          <section className="journey-column">
            <div className="journey-heading">
              <button className="back-button" aria-label="Go back"><ArrowLeft size={18} /></button>
              <div><h1>{activeRoute.operator}</h1><p>{activeRoute.service} <span>•</span> {activeRoute.type}</p></div>
            </div>
            <div className="bus-stage">
              <div className="bus-shadow" />
              <svg className="bus-illustration" viewBox="0 0 720 240" role="img" aria-label="Side view of a TicTic coach bus">
                <defs>
                  <linearGradient id="busBody" x1="0" x2="1"><stop offset="0" stopColor="#f4f4ef" /><stop offset=".52" stopColor="#ded7c4" /><stop offset="1" stopColor="#c79f8d" /></linearGradient>
                  <linearGradient id="window" x1="0" x2="1"><stop stopColor="#424441" /><stop offset="1" stopColor="#232625" /></linearGradient>
                </defs>
                <path d="M91 57h514c23 0 48 24 48 48v82H61V94c0-21 12-37 30-37Z" fill="url(#busBody)" stroke="#777873" strokeWidth="5" />
                <path d="M93 65h495c24 0 41 16 45 39l-4 49H63V103c0-22 11-38 30-38Z" fill="url(#window)" />
                <path d="M63 153h570v34H61Z" fill="#d7ccb8" opacity=".9" />
                <path d="M63 153h570" stroke="#676961" strokeWidth="4" />
                <path d="M114 68v83M174 68v83M235 68v83M296 68v83M357 68v83M418 68v83M479 68v83M540 68v83" stroke="#686b68" strokeWidth="3" opacity=".75" />
                <path d="M65 150c73-30 113-31 156-83" stroke="#fff" strokeWidth="14" opacity=".72" />
                <path d="M81 187h562" stroke="#4c4d48" strokeWidth="7" />
                <circle cx="166" cy="191" r="29" fill="#303331" /><circle cx="166" cy="191" r="14" fill="#d7d8d2" /><circle cx="166" cy="191" r="5" fill="#6b6c65" />
                <circle cx="554" cy="191" r="29" fill="#303331" /><circle cx="554" cy="191" r="14" fill="#d7d8d2" /><circle cx="554" cy="191" r="5" fill="#6b6c65" />
                <path d="M56 103v35l-13 11V95c0-9 6-15 13-15h9v9h-9Z" fill="#343734" />
                <path d="M293 48h112l16 15H280Z" fill="#3d3f3b" />
                <rect x="517" y="157" width="17" height="7" rx="2" fill="#353632" /><rect x="245" y="157" width="17" height="7" rx="2" fill="#353632" />
              </svg>
              <div className="bus-badge"><BusFront size={14} /> SAMPLE SERVICE</div>
            </div>

            <div className="route-card">
              <div className="route-points">
                <div className="route-point"><div className="point-icon"><DoorOpen size={17} /></div><div><strong>{activeRoute.boarding}</strong><small>Starting Point</small></div></div>
                <div className="route-line" />
                <div className="route-point"><div className="point-icon"><DoorOpen size={17} /></div><div><strong>{activeRoute.dropping}</strong><small>End Point</small></div></div>
                <button className="round-action" aria-label="Route details"><ArrowRight size={18} /></button>
              </div>
              <div className="route-meta">
                <div><strong>{activeRoute.departure}</strong><small>Departure time</small></div><span className="meta-divider" />
                <div><strong>{activeRoute.arrival}</strong><small>Arrival time</small></div><span className="meta-divider" />
                <div><strong>{activeRoute.duration}</strong><small>Journey duration</small></div><span className="meta-divider" />
                <div><strong>{availableSeats}</strong><small>Seats Available</small></div>
              </div>
            </div>

            <div className="trending-card">
              <div className="section-heading"><div><h2>Related Trending Searches</h2><p>Explore popular routes from Chennai</p></div><button className="round-action" aria-label="Explore routes"><ArrowRight size={18} /></button></div>
              <div className="trend-list">{trendingRoutes.map((destination) => <button className={activeRoute.destination === destination ? 'trend-active' : ''} onClick={() => chooseRoute(destination)} key={destination}>Chennai – {destination}</button>)}</div>
            </div>
          </section>

          <section className="booking-panel">
            <div className="legend-row">{[['sold', 'Sold'], ['blocked', 'Blocked'], ['selected', 'Selected'], ['available', 'Available']].map(([status, label]) => <div key={status}><i className={`legend-dot ${status}`} />{label}</div>)}</div>
            <div className="select-row"><label><span>Boarding Point</span><button>{activeRoute.boarding}<ChevronDown size={14} /></button></label><label><span>Dropping Point</span><button>{activeRoute.dropping}<ChevronDown size={14} /></button></label></div>
            <div className="booking-body">
              <div className="seat-section">
                <div className="bus-type-chips"><span className={`bus-type-chip ${busFeatures.ac ? 'bus-type-chip-ac' : 'bus-type-chip-nonac'}`}>{busFeatures.ac ? <Snowflake size={11} /> : <Wind size={11} />}{busFeatures.ac ? 'AC' : 'Non-AC'}</span><span className="bus-type-chip bus-type-chip-sleeper">{busFeatures.sleeper ? <BedDouble size={11} /> : <Armchair size={11} />}{busFeatures.sleeper ? 'Sleeper' : 'Seater'}</span></div><div className="seat-header"><span>Front of bus</span><Gauge size={17} /></div>
                <div className="seat-grid">{seats.map((seat) => <button key={seat.seatNumber} className={`seat ${seat.status}`} onClick={() => handleSeatClick(seat)} disabled={seat.status === 'sold' || seat.status === 'blocked'} aria-label={`${seat.seatNumber}, ${seat.status}`} title={`${seat.seatNumber} · ₹${seat.fare} · ${seat.status}`}><span>{seat.seatNumber.replace('C', '')}</span><small>{busFeatures.sleeper ? 'Sleeper' : 'Seater'}</small></button>)}</div>
                <div className="driver-label"><BusFront size={14} /> Driver</div>
              </div>
              <div className="fare-summary">
                <div className="summary-seats"><strong>{selectedSeats.length ? selectedSeats.map((seat) => seat.seatNumber).join(', ') : 'No seats selected'}</strong><small>Your Seats</small></div>
                <div className="summary-item"><strong>{activeRoute.type}</strong><small>Seat Class</small></div>
                <div className="summary-item"><strong>₹{serviceCharge}</strong><small>Service Charge</small></div>
                <div className="summary-item"><strong>₹{tax}</strong><small>Applicable Tax</small></div>
                <div className="summary-item"><strong>₹{discount}</strong><small>Discount</small></div>
                <div className="summary-item"><strong>₹{activeRoute.fare}</strong><small>Per Seat Fare</small></div>
                <div className="summary-item"><strong>{String(selectedSeats.length).padStart(2, '0')}</strong><small>Number of Seats</small></div>
                <div className="summary-item summary-total"><strong>₹{total}</strong><small>Total Payable</small></div>
              </div>
            </div>
            <div className="checkout-row"><label className="phone-input"><span>Passenger Name</span><input value={passengerName} onChange={(event) => setPassengerName(event.target.value)} placeholder={user?.name ?? 'Full name'} /></label><label className="phone-input"><span>Passenger's Contact Number</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" inputMode="numeric" /></label><button className="buy-button" onClick={handleBuyClick} disabled={bookingLoading || !activeTripId}>{bookingLoading ? 'Booking…' : 'Buy Now'} <ArrowRight size={17} /></button></div>
            {selectedSeats.length === 0 && <p className="form-hint">Choose up to 6 seats to continue</p>}
            {phone.length > 0 && phone.length !== 10 && <p className="form-error">Enter a valid 10-digit contact number</p>}
            {selectedSeats.length > 0 && passengerName.trim().length < 2 && <p className="form-error">Enter the passenger name before booking</p>}
            {bookingError && <div className="booking-error-banner"><AlertCircle size={15} /><span>{bookingError}</span></div>}
            {bookingLoading && <p className="form-hint">Processing your booking…</p>}
          </section>
        </div>
      </section>

      {passengerModalOpen && <AdditionalPassengersModal seatNumbers={selectedSeats.slice(1).map((seat) => seat.seatNumber)} loading={bookingLoading} error={bookingError} onConfirm={handleBook} onClose={() => setPassengerModalOpen(false)} />}
      {showConfirmation && <div className="modal-backdrop" onClick={() => setShowConfirmation(false)}><div className="confirmation-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowConfirmation(false)} aria-label="Close"><X size={18} /></button><div className="success-icon"><Check size={28} /></div><p className="eyebrow">Reservation ready</p><h2>Your seats are held.</h2><p>{bookingMessage}</p><div className="confirmation-actions"><button className="modal-button modal-button-secondary" onClick={printTicket}><Printer size={16} /> Print ticket</button><button className="modal-button" onClick={() => setShowConfirmation(false)}>Done <ArrowRight size={16} /></button></div></div></div>}
    </main>
  );
}

export default App;
