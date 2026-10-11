package com.tictic.backend.controller;

import com.tictic.backend.model.Seat;
import com.tictic.backend.model.Trip;
import com.tictic.backend.service.SeatArrayService;
import com.tictic.backend.store.ArrayStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SeatController {
    private final ArrayStore store; private final SeatArrayService seats;
    public SeatController(ArrayStore store, SeatArrayService seats) { this.store = store; this.seats = seats; }

    @GetMapping("/trips/{tripId}/seats")
    ResponseEntity<?> seats(@PathVariable String tripId) { Trip trip = trip(tripId); List<Seat> available = seats.getAvailableSeats(trip.getSeats()); return ResponseEntity.ok(Map.of("tripId", tripId, "seats", trip.getSeats(), "availableCount", available.size())); }

    @GetMapping("/seats/available/{tripId}")
    List<Seat> available(@PathVariable String tripId) { return seats.getAvailableSeats(trip(tripId).getSeats()); }

    private Trip trip(String id) { return store.getTrips().stream().filter(item -> item.getId().equals(id)).findFirst().orElseThrow(() -> new IllegalArgumentException("Trip not found")); }
}
