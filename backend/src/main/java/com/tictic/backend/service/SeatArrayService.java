package com.tictic.backend.service;

import com.tictic.backend.model.Booking;
import com.tictic.backend.model.Seat;
import com.tictic.backend.model.Trip;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
public class SeatArrayService {
    // Array representation: every trip owns an ordered ArrayList of Seat objects.
    public ArrayList<Seat> createSeatArray(int rows, double fare) {
        ArrayList<Seat> seats = new ArrayList<>();
        for (int row = 1; row <= rows; row++) for (int column = 1; column <= 4; column++) seats.add(new Seat("C" + row + column, Seat.Status.AVAILABLE, null, fare));
        return seats;
    }

    // Traversal: visit each element and collect only seats that can be reserved.
    public List<Seat> getAvailableSeats(List<Seat> seats) {
        List<Seat> available = new ArrayList<>();
        for (Seat seat : seats) if (seat.getStatus() == Seat.Status.AVAILABLE) available.add(seat);
        return available;
    }

    // Linear search: seat lookup by unique seat number.
    public Seat findSeatByNumber(List<Seat> seats, String seatNumber) {
        for (Seat seat : seats) if (seat.getSeatNumber().equalsIgnoreCase(seatNumber)) return seat;
        return null;
    }

    public synchronized void bookSeats(Trip trip, List<String> requestedSeats, String passengerName) {
        if (requestedSeats == null || requestedSeats.isEmpty() || requestedSeats.size() > 6) throw new IllegalArgumentException("Choose between 1 and 6 seats");
        Set<String> uniqueSeats = new HashSet<>();
        for (String requested : requestedSeats) {
            if (!uniqueSeats.add(requested.toUpperCase())) throw new IllegalArgumentException("Duplicate seat selection");
            Seat seat = findSeatByNumber(trip.getSeats(), requested);
            if (seat == null) throw new IllegalArgumentException("Invalid seat number: " + requested);
            if (seat.getStatus() != Seat.Status.AVAILABLE) throw new IllegalStateException("Seat " + requested + " is no longer available");
        }
        // Update: mutate each matching array element only after every seat passes validation.
        for (String requested : requestedSeats) {
            Seat seat = findSeatByNumber(trip.getSeats(), requested);
            seat.setStatus(Seat.Status.BOOKED);
            seat.setPassengerName(passengerName);
        }
    }

    public synchronized void cancelSeats(Trip trip, Booking booking) {
        for (String seatNumber : booking.getSeatNumbers()) {
            Seat seat = findSeatByNumber(trip.getSeats(), seatNumber);
            if (seat != null && seat.getStatus() == Seat.Status.BOOKED) {
                seat.setStatus(Seat.Status.AVAILABLE);
                seat.setPassengerName(null);
            }
        }
    }
}
