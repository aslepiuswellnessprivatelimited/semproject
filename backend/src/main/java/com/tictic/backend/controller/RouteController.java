package com.tictic.backend.controller;

import com.tictic.backend.model.Route;
import com.tictic.backend.model.Trip;
import com.tictic.backend.store.ArrayStore;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api")
public class RouteController {
    private final ArrayStore store;
    public RouteController(ArrayStore store) { this.store = store; }

    @GetMapping("/routes")
    List<Route> routes(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return store.getRoutes().stream().filter(route -> matches(route.getOrigin(), from) && matches(route.getDestination(), to) && route.isActive()).toList();
    }

    @GetMapping("/trips/search")
    List<TripSummary> trips(@RequestParam(required = false) String from, @RequestParam(required = false) String to) {
        return store.getTrips().stream().filter(trip -> store.getRoutes().stream().anyMatch(route -> route.getId().equals(trip.getRouteId()) && matches(route.getOrigin(), from) && matches(route.getDestination(), to))).map(this::summary).toList();
    }

    private boolean matches(String actual, String expected) { return expected == null || expected.isBlank() || actual.toLowerCase(Locale.ROOT).contains(expected.toLowerCase(Locale.ROOT)); }
    private TripSummary summary(Trip trip) { Route route = store.getRoutes().stream().filter(item -> item.getId().equals(trip.getRouteId())).findFirst().orElseThrow(); long available = trip.getSeats().stream().filter(seat -> seat.getStatus() == com.tictic.backend.model.Seat.Status.AVAILABLE).count(); double fare = trip.getSeats().isEmpty() ? 0 : trip.getSeats().get(0).getFare(); return new TripSummary(trip.getId(), route.getOrigin(), route.getDestination(), route.getDuration(), trip.getOperatorName(), trip.getServiceNumber(), trip.getBusType(), trip.getDeparture(), trip.getArrival(), fare, available, route.getBoardingPoints(), route.getDroppingPoints()); }
    public record TripSummary(String id, String origin, String destination, String duration, String operatorName, String serviceNumber, String busType, String departure, String arrival, double fare, long availableSeats, List<String> boardingPoints, List<String> droppingPoints) {}
}
