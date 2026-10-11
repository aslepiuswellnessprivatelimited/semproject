package com.tictic.backend.model;

import java.util.ArrayList;
import java.util.List;

public class Route {
    private String id;
    private String origin;
    private String destination;
    private List<String> stops = new ArrayList<>();
    private List<String> boardingPoints = new ArrayList<>();
    private List<String> droppingPoints = new ArrayList<>();
    private String duration;
    private boolean active = true;

    public Route() {}
    public Route(String id, String origin, String destination, List<String> stops, List<String> boardingPoints, List<String> droppingPoints, String duration) { this.id = id; this.origin = origin; this.destination = destination; this.stops = stops; this.boardingPoints = boardingPoints; this.droppingPoints = droppingPoints; this.duration = duration; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public List<String> getStops() { return stops; }
    public void setStops(List<String> stops) { this.stops = stops; }
    public List<String> getBoardingPoints() { return boardingPoints; }
    public void setBoardingPoints(List<String> boardingPoints) { this.boardingPoints = boardingPoints; }
    public List<String> getDroppingPoints() { return droppingPoints; }
    public void setDroppingPoints(List<String> droppingPoints) { this.droppingPoints = droppingPoints; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
