package com.tictic.backend.model;

import java.util.ArrayList;
import java.util.List;

public class Booking {
    private String id;
    private String userEmail;
    private String tripId;
    private List<String> seatNumbers = new ArrayList<>();
    private String passengerName;
    private String phone;
    private double totalAmount;
    private String status = "CONFIRMED";
    private String createdAt;

    public Booking() {}
    public Booking(String id, String userEmail, String tripId, List<String> seatNumbers, String passengerName, String phone, double totalAmount, String createdAt) { this.id = id; this.userEmail = userEmail; this.tripId = tripId; this.seatNumbers = seatNumbers; this.passengerName = passengerName; this.phone = phone; this.totalAmount = totalAmount; this.createdAt = createdAt; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getTripId() { return tripId; }
    public void setTripId(String tripId) { this.tripId = tripId; }
    public List<String> getSeatNumbers() { return seatNumbers; }
    public void setSeatNumbers(List<String> seatNumbers) { this.seatNumbers = seatNumbers; }
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
