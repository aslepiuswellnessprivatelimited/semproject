package com.tictic.backend.store;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tictic.backend.model.Booking;
import com.tictic.backend.model.Route;
import com.tictic.backend.model.Trip;
import com.tictic.backend.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class ArrayStore {
    private final ObjectMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final Path file;
    private final List<User> users = new ArrayList<>();
    private final List<Route> routes = new ArrayList<>();
    private final List<Trip> trips = new ArrayList<>();
    private final List<Booking> bookings = new ArrayList<>();

    public ArrayStore(ObjectMapper mapper, PasswordEncoder passwordEncoder, @Value("${app.store-path:data/store.json}") String storePath) {
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.file = Path.of(storePath);
        load();
    }

    public synchronized void load() {
        try {
            if (Files.exists(file)) {
                StoreData data = mapper.readValue(file.toFile(), StoreData.class);
                users.addAll(data.users == null ? List.of() : data.users);
                routes.addAll(data.routes == null ? List.of() : data.routes);
                trips.addAll(data.trips == null ? List.of() : data.trips);
                bookings.addAll(data.bookings == null ? List.of() : data.bookings);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to load JSON data store", exception);
        }
        if (routes.isEmpty() || trips.isEmpty() || users.isEmpty()) seed();
    }

    public synchronized void save() {
        try {
            Files.createDirectories(file.getParent() == null ? Path.of(".") : file.getParent());
            mapper.writerWithDefaultPrettyPrinter().writeValue(file.toFile(), new StoreData(users, routes, trips, bookings));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to save JSON data store", exception);
        }
    }

    private void seed() {
        users.clear(); routes.clear(); trips.clear(); bookings.clear();
        users.add(new User("demo-user", "Demo Passenger", "demo@tictic.in", "9876543210", passwordEncoder.encode("demo123"), "USER"));
        users.add(new User("admin-user", "TicTic Admin", "admin@tictic.in", "9000000000", passwordEncoder.encode("admin123"), "ADMIN"));
        String[][] routeSeeds = {
            {"r1","Chennai","Madurai","8h 00m"},{"r2","Chennai","Coimbatore","9h 00m"},{"r3","Chennai","Trichy","6h 45m"},{"r4","Chennai","Salem","5h 30m"},{"r5","Chennai","Tirunelveli","10h 30m"},{"r6","Chennai","Erode","7h 30m"},{"r7","Chennai","Thanjavur","7h 15m"},{"r8","Chennai","Vellore","3h 30m"},{"r9","Coimbatore","Madurai","4h 30m"},{"r10","Madurai","Rameswaram","3h 00m"},{"r11","Chennai","Nagercoil","11h 30m"},{"r12","Coimbatore","Ooty","3h 30m"},{"r13","Chennai","Kumbakonam","6h 15m"},{"r14","Salem","Tiruppur","3h 00m"},{"r15","Madurai","Kanyakumari","4h 30m"},{"r16","Chennai","Kanchipuram","2h 00m"},{"r17","Trichy","Dindigul","2h 30m"},{"r18","Chennai","Hosur","6h 30m"},{"r19","Chennai","Cuddalore","4h 30m"},{"r20","Madurai","Theni","2h 30m"},{"r21","Chennai","Villupuram","3h 30m"},{"r22","Chennai","Karur","7h 00m"},{"r23","Madurai","Tuticorin","2h 30m"},{"r24","Tirunelveli","Nagercoil","2h 00m"},{"r25","Chennai","Tiruppur","8h 30m"}
        };
        for (String[] seed : routeSeeds) {
            routes.add(new Route(seed[0], seed[1], seed[2], List.of("Tamil Nadu Highway"), List.of(seed[1] + " Central Bus Stand", seed[1] + " Main Counter"), List.of(seed[2] + " Bus Stand", seed[2] + " Main Counter"), seed[3]));
        }
        String[] operators = {"KPN Travels", "Parveen Travels", "SETC Premium", "Sri SMS Travels", "Shyamoli NR Travels", "IntrCity SmartBus"};
        String[] types = {"AC Sleeper", "AC Seater", "Semi Sleeper", "Non-AC Seater"};
        int tripNumber = 1;
        for (Route route : routes) {
            for (int option = 0; option < (tripNumber <= 3 ? 2 : 1); option++) {
                double fare = 680 + ((tripNumber * 73 + option * 140) % 700);
                trips.add(new Trip("t" + tripNumber, route.getId(), operators[(tripNumber + option) % operators.length], String.format("%04d–%s", 1700 + tripNumber, route.getDestination()), types[(tripNumber + option) % types.length], option == 0 ? "09:30 PM" : "06:15 AM", option == 0 ? "05:30 AM" : "03:00 PM", LocalDate.now().plusDays(1).toString(), createSeats(fare, tripNumber)));
                tripNumber++;
            }
        }
        save();
    }

    private ArrayList<com.tictic.backend.model.Seat> createSeats(double fare, int tripNumber) {
        ArrayList<com.tictic.backend.model.Seat> seats = new ArrayList<>();
        for (int row = 1; row <= 7; row++) for (int col = 1; col <= 4; col++) {
            String number = "C" + row + col;
            com.tictic.backend.model.Seat.Status status = number.equals("C11") && tripNumber % 2 == 0 ? com.tictic.backend.model.Seat.Status.BLOCKED : (number.equals("C12") || number.equals("C23") ? com.tictic.backend.model.Seat.Status.BOOKED : com.tictic.backend.model.Seat.Status.AVAILABLE);
            seats.add(new com.tictic.backend.model.Seat(number, status, status == com.tictic.backend.model.Seat.Status.BOOKED ? "Sample Passenger" : null, fare));
        }
        return seats;
    }

    public List<User> getUsers() { return users; }
    public List<Route> getRoutes() { return routes; }
    public List<Trip> getTrips() { return trips; }
    public List<Booking> getBookings() { return bookings; }

    public record StoreData(List<User> users, List<Route> routes, List<Trip> trips, List<Booking> bookings) {}
}
