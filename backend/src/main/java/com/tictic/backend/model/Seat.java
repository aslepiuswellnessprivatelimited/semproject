package com.tictic.backend.model;

public class Seat {
    public enum Status { AVAILABLE, BOOKED, BLOCKED }

    private String seatNumber;
    private Status status;
    private String passengerName;
    private double fare;

    public Seat() {}
    public Seat(String seatNumber, Status status, String passengerName, double fare) { this.seatNumber = seatNumber; this.status = status; this.passengerName = passengerName; this.fare = fare; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    public double getFare() { return fare; }
    public void setFare(double fare) { this.fare = fare; }
}
