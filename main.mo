import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  type Congestion = {
    #low;
    #medium;
    #high;
  };

  type TrafficSegment = {
    id : Text;
    congestion : Congestion;
  };

  type Location = {
    name : Text;
    coordinates : (Float, Float);
  };

  type RouteRequest = {
    startLocation : Location;
    endLocation : Location;
  };

  let trafficSegments = Map.empty<Text, Congestion>();

  let locations = Map.empty<Text, Location>();

  let routeRequests = Map.empty<Nat, RouteRequest>();

  // Initialize with some segments and locations
  public shared ({ caller }) func initialize() : async () {
    trafficSegments.add("Highway_1", #medium);
    trafficSegments.add("City_Ring_2", #low);
    trafficSegments.add("MainStreet_15", #high);

    locations.add(
      "Central Park",
      {
        name = "Central Park";
        coordinates = (52.5200, 13.4050);
      },
    );
    locations.add(
      "Tech District",
      {
        name = "Tech District";
        coordinates = (52.5194, 13.4060);
      },
    );
  };

  public query ({ caller }) func getTrafficSegment(segmentId : Text) : async TrafficSegment {
    switch (trafficSegments.get(segmentId)) {
      case (null) { Runtime.trap("Segment not found.") };
      case (?congestion) {
        {
          id = segmentId;
          congestion;
        };
      };
    };
  };

  public query ({ caller }) func getAllTrafficSegments() : async [TrafficSegment] {
    trafficSegments.toArray().map(func((id, congestion)) { { id; congestion } });
  };

  public query ({ caller }) func getAllLocations() : async [Location] {
    locations.values().toArray();
  };

  public shared ({ caller }) func recordRouteRequest(startName : Text, endName : Text) : async () {
    let startLoc = switch (locations.get(startName)) {
      case (null) { Runtime.trap("Start location not found.") };
      case (?loc) { loc };
    };
    let endLoc = switch (locations.get(endName)) {
      case (null) { Runtime.trap("End location not found.") };
      case (?loc) { loc };
    };
    let routeRequest = {
      startLocation = startLoc;
      endLocation = endLoc;
    };
    let newId = routeRequests.size();
    routeRequests.add(newId, routeRequest);
  };
};
