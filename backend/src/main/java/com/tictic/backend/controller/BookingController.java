package com.tictic.backend.controller;

import com.tictic.backend.model.Booking;
import com.tictic.backend.model.Trip;
import com.tictic.backend.service.SeatArrayService;
import com.tictic.backend.store.ArrayStore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final ArrayStore store; private final SeatArrayService seatService;
    public BookingController(ArrayStore store, SeatArrayService seatService) { this.store = store; this.seatService = seatService; }

    @PostMapping
    ResponseEntity<Booking> create(@Valid @RequestBody CreateBookingRequest request, Authentication authentication) {
        Trip trip = trip(request.tripId());
        synchronized (store) {
            seatService.bookSeats(trip, request.seatNumbers(), request.passengerName());
            double total = request.seatNumbers().stream().mapToDouble(number -> seatService.findSeatByNumber(trip.getSeats(), number).getFare()).sum();
            Booking booking = new Booking("TT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(), authentication.getName(), trip.getId(), request.seatNumbers(), request.passengerName(), request.phone(), total, Instant.now().toString());
            store.getBookings().add(booking); store.save(); return ResponseEntity.ok(booking);
        }
    }

    @GetMapping("/me")
    List<Booking> myBookings(Authentication authentication) { return store.getBookings().stream().filter(booking -> booking.getUserEmail().equalsIgnoreCase(authentication.getName())).toList(); }

    @DeleteMapping("/{id}")
    ResponseEntity<Booking> cancel(@PathVariable String id, Authentication authentication) {
        Booking booking = store.getBookings().stream().filter(item -> item.getId().equals(id)).findFirst().orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getUserEmail().equalsIgnoreCase(authentication.getName())) throw new IllegalStateException("You can only cancel your own bookings");
        if ("CANCELLED".equals(booking.getStatus())) throw new IllegalStateException("Booking is already cancelled");
        synchronized (store) { seatService.cancelSeats(trip(booking.getTripId()), booking); booking.setStatus("CANCELLED"); store.save(); }
        return ResponseEntity.ok(booking);
    }

    private Trip trip(String id) { return store.getTrips().stream().filter(item -> item.getId().equals(id)).findFirst().orElseThrow(() -> new IllegalArgumentException("Trip not found")); }
    public record CreateBookingRequest(@NotBlank String tripId, @NotEmpty List<String> seatNumbers, @NotBlank String passengerName, @Pattern(regexp = "\\d{10}", message = "Phone must contain exactly 10 digits") String phone) {}
}
