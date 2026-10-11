export type SeatStatus = 'available' | 'sold' | 'blocked' | 'selected';

export interface Seat {
  seatNumber: string;
  status: SeatStatus;
  fare: number;
}

export function createSeatArray(rows: number, fare: number): Seat[] {
  return Array.from({ length: rows }, (_, index) => {
    const row = index + 1;
    return [1, 2, 3, 4].map((column) => ({
      seatNumber: `C${row}${column}`,
      status: 'available' as SeatStatus,
      fare,
    }));
  }).flat();
}

export function findSeatByNumber(seats: Seat[], seatNumber: string): Seat | undefined {
  return seats.find((seat) => seat.seatNumber === seatNumber);
}

export function getAvailableSeats(seats: Seat[]): Seat[] {
  return seats.filter((seat) => seat.status === 'available');
}

export function countAvailableSeats(seats: Seat[]): number {
  return getAvailableSeats(seats).length;
}

export function toggleSeat(seats: Seat[], seatNumber: string): Seat[] {
  return seats.map((seat) => {
    if (seat.seatNumber !== seatNumber) return seat;
    if (seat.status === 'available') return { ...seat, status: 'selected' };
    if (seat.status === 'selected') return { ...seat, status: 'available' };
    return seat;
  });
}
