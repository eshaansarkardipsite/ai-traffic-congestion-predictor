import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useState } from "react";
import AnalyticsPanel from "./components/AnalyticsPanel";
import PredictionPanel from "./components/PredictionPanel";
import RoutePanel from "./components/RoutePanel";
import StatusStrip from "./components/StatusStrip";
import TopBar from "./components/TopBar";
import TrafficMap from "./components/TrafficMap";
import { useActor } from "./hooks/useActor";
import {
  type CongestionLevel,
  PRESET_LOCATIONS,
  type RouteResult,
  initCongestion,
  randomizeCongestion,
} from "./mapData";

export interface PredictionStats {
  level: CongestionLevel;
  travelTime: number;
  density: number;
  confidence: number;
}

function randomPredictions(): PredictionStats {
  const r = Math.random();
  return {
    level: r < 0.35 ? "low" : r < 0.7 ? "medium" : "high",
    travelTime: Math.round(12 + Math.random() * 28),
    density: Math.round(28 + Math.random() * 65),
    confidence: Math.round(74 + Math.random() * 24),
  };
}

export default function App() {
  const { actor } = useActor();
  const [congestion, setCongestion] =
    useState<Record<string, CongestionLevel>>(initCongestion);
  const [predictions, setPredictions] =
    useState<PredictionStats>(randomPredictions);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [locations, setLocations] = useState<string[]>(PRESET_LOCATIONS);

  // Initialize backend and load locations
  useEffect(() => {
    if (!actor) return;
    actor
      .initialize()
      .then(() => actor.getAllLocations())
      .then((locs) => {
        const names = locs.map((l) => l.name);
        const merged = [...new Set([...PRESET_LOCATIONS, ...names])];
        setLocations(merged);
      })
      .catch(() => {
        // silently fallback to presets
      });
  }, [actor]);

  // Simulation: update congestion every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setCongestion((prev) => randomizeCongestion(prev));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Simulation: update prediction stats every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setPredictions(randomPredictions());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const handleRouteResult = useCallback(
    (result: RouteResult) => {
      setRouteResult(result);
      if (actor) {
        actor
          .recordRouteRequest(result.fromName, result.toName)
          .catch(() => {});
      }
    },
    [actor],
  );

  return (
    <div
      className="flex flex-col h-screen bg-background overflow-hidden"
      style={{ fontFamily: "Satoshi, sans-serif" }}
    >
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <PredictionPanel
          predictions={predictions}
          data-ocid="prediction.panel"
        />
        <div className="flex-1 overflow-hidden relative">
          <TrafficMap congestion={congestion} routeResult={routeResult} />
        </div>
        <RoutePanel
          locations={locations}
          congestion={congestion}
          onRouteResult={handleRouteResult}
          data-ocid="route.panel"
        />
      </div>
      <StatusStrip />
      <AnalyticsPanel congestion={congestion} />
      <Toaster />
    </div>
  );
}
