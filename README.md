# TicTic

TicTic is a production-style Tamil Nadu bus reservation demonstration. The booking screen keeps the original premium reference design while the browser talks to a Java Spring Boot API backed by JSON arrays.

## Run locally

Prerequisites: Node.js 18+, Java 17+, and Maven 3.9+.

Terminal 1:

```bash
cd backend
mvn spring-boot:run
```

Terminal 2:

```bash
npm install
npm run dev
```

Or start both processes with one root command:

```bash
npm run dev:full
```

Open the Vite address shown in the terminal. The development server forwards `/api` calls to `http://localhost:8080`.

## Demo account

- Email: `demo@tictic.in`
- Password: `demo123`

The API creates `backend/data/store.json` on its first start. It contains seeded users, Tamil Nadu routes, trips, and seat arrays. Do not use the demo credentials in a real deployment. Set `JWT_SECRET` to a long private value before production.

## Features

- Login and registration with BCrypt password hashing and JWT sessions.
- Tamil Nadu route search with 25 seeded route families and 28-seat trips.
- Live seat availability from the backend array, including AVAILABLE, BOOKED, and BLOCKED states.
- Maximum six seats per booking, explicit passenger name capture, and ten-digit phone validation.
- My Trips page with ownership-checked cancellation.
- Explicit seat-array traversal, linear search, and in-place update methods for the semester report.
- Responsive reference-style TicTic booking UI.

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/routes?from=&to=`
- `GET /api/trips/search?from=&to=`
- `GET /api/trips/{tripId}/seats`
- `GET /api/seats/available/{tripId}`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `DELETE /api/bookings/{id}`

Booking and cancellation require `Authorization: Bearer <token>`.

## Array mapping

- Representation: `Trip.seats` is an ordered `ArrayList<Seat>`.
- Traversal: `SeatArrayService.getAvailableSeats` visits every seat.
- Searching: `findSeatByNumber` performs linear seat lookup.
- Updating: `bookSeats` changes available seats to booked; `cancelSeats` restores them.
- Persistence: `ArrayStore` saves all arrays to `backend/data/store.json` after mutations.
