package com.tictic.backend.model;

import java.util.ArrayList;
import java.util.List;

public class Trip {
    private String id;
    private String routeId;
    private String operatorName;
    private String serviceNumber;
    private String busType;
    private String departure;
    private String arrival;
    private String date;
    private List<Seat> seats = new ArrayList<>();

    public Trip() {}
    public Trip(String id, String routeId, String operatorName, String serviceNumber, String busType, String departure, String arrival, String date, List<Seat> seats) { this.id = id; this.routeId = routeId; this.operatorName = operatorName; this.serviceNumber = serviceNumber; this.busType = busType; this.departure = departure; this.arrival = arrival; this.date = date; this.seats = seats; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRouteId() { return routeId; }
    public void setRouteId(String routeId) { this.routeId = routeId; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public String getServiceNumber() { return serviceNumber; }
    public void setServiceNumber(String serviceNumber) { this.serviceNumber = serviceNumber; }
    public String getBusType() { return busType; }
    public void setBusType(String busType) { this.busType = busType; }
    public String getDeparture() { return departure; }
    public void setDeparture(String departure) { this.departure = departure; }
    public String getArrival() { return arrival; }
    public void setArrival(String arrival) { this.arrival = arrival; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public List<Seat> getSeats() { return seats; }
    public void setSeats(List<Seat> seats) { this.seats = seats; }
}
