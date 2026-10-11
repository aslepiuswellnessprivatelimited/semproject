import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
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
  Settings,
  Ticket,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { createSeatArray, countAvailableSeats, toggleSeat, type Seat } from '@/utils/seatArray';

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
  { label: 'Routes', icon: Navigation },
  { label: 'Schedules', icon: CalendarDays },
  { label: 'Trips', icon: WalletCards },
  { label: 'Support', icon: CircleHelp },
];

function App() {
  const [activeRoute, setActiveRoute] = useState(routes[0]);
  const [activeNav, setActiveNav] = useState('Tickets');
  const [seats, setSeats] = useState<Seat[]>(() => createSeatArray(7, routes[0].fare));
  const [phone, setPhone] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedSeats = useMemo(() => seats.filter((seat) => seat.status === 'selected'), [seats]);
  const availableSeats = countAvailableSeats(seats);
  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.fare, 0);
  const serviceCharge = selectedSeats.length ? 45 : 0;
  const tax = Math.round(subtotal * 0.05);
  const discount = selectedSeats.length >= 2 ? 120 : 0;
  const total = subtotal + serviceCharge + tax - discount;

  function chooseRoute(destination: string) {
    const nextRoute = routes.find((route) => route.destination === destination) ?? routes[0];
    setActiveRoute(nextRoute);
    setSeats(createSeatArray(7, nextRoute.fare).map((seat, index) => ({
      ...seat,
      status: index === 2 || index === 7 ? 'sold' : index === 26 ? 'blocked' : 'available',
    })));
  }

  function handleSeatClick(seat: Seat) {
    if (seat.status === 'sold' || seat.status === 'blocked') return;
    if (seat.status === 'available' && selectedSeats.length >= 6) return;
    setSeats((currentSeats) => toggleSeat(currentSeats, seat.seatNumber));
  }

  function handleBook() {
    if (selectedSeats.length > 0 && phone.replace(/\D/g, '').length >= 10) setShowConfirmation(true);
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="app-panel">
        <header className="topbar">
          <div className="brand-mark"><Ticket size={24} strokeWidth={2.4} /><span>TicTic</span></div>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
          <nav className={`top-nav ${menuOpen ? 'is-open' : ''}`}>
            {['Buy Tickets', 'Schedules', 'Trips', 'Vehicles'].map((item, index) => (
              <button className={index === 0 ? 'top-nav-active' : ''} key={item} onClick={() => setActiveNav(item)}>{item}</button>
            ))}
          </nav>
          <div className="location-chip"><MapPin size={14} /><span>Your location:</span><strong>Chennai</strong></div>
          <button className="icon-button" aria-label="Settings"><Settings size={17} /></button>
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
              <div className="avatar">AK</div>
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
                <div className="seat-header"><span>Front of bus</span><Gauge size={17} /></div>
                <div className="seat-grid">{seats.map((seat) => <button key={seat.seatNumber} className={`seat ${seat.status}`} onClick={() => handleSeatClick(seat)} disabled={seat.status === 'sold' || seat.status === 'blocked'} aria-label={`${seat.seatNumber}, ${seat.status}`} title={`${seat.seatNumber} · ₹${seat.fare} · ${seat.status}`}><span>{seat.seatNumber.replace('C', '')}</span></button>)}</div>
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
            <div className="checkout-row"><label className="phone-input"><span>Passenger's Contact Number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" inputMode="tel" /></label><button className="buy-button" onClick={handleBook}>Buy Now <ArrowRight size={17} /></button></div>
            {selectedSeats.length === 0 && <p className="form-hint">Choose up to 6 seats to continue</p>}
            {phone.length > 0 && phone.replace(/\D/g, '').length < 10 && <p className="form-error">Enter a valid 10-digit contact number</p>}
          </section>
        </div>
      </section>

      {showConfirmation && <div className="modal-backdrop" onClick={() => setShowConfirmation(false)}><div className="confirmation-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowConfirmation(false)} aria-label="Close"><X size={18} /></button><div className="success-icon"><Check size={28} /></div><p className="eyebrow">Reservation ready</p><h2>Your seats are held.</h2><p>Review complete. Booking reference <strong>TT-{Math.floor(100000 + Math.random() * 900000)}</strong> has been created for {selectedSeats.map((seat) => seat.seatNumber).join(', ')} at ₹{total}.</p><button className="modal-button" onClick={() => setShowConfirmation(false)}>Done <ArrowRight size={16} /></button></div></div>}
    </main>
  );
}

export default App;
