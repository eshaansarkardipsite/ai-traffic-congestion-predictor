import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    name: string;
    coordinates: [number, number];
}
export interface TrafficSegment {
    id: string;
    congestion: Congestion;
}
export enum Congestion {
    low = "low",
    high = "high",
    medium = "medium"
}
export interface backendInterface {
    getAllLocations(): Promise<Array<Location>>;
    getAllTrafficSegments(): Promise<Array<TrafficSegment>>;
    getTrafficSegment(segmentId: string): Promise<TrafficSegment>;
    initialize(): Promise<void>;
    recordRouteRequest(startName: string, endName: string): Promise<void>;
}
