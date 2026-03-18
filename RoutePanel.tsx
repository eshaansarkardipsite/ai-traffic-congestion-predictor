import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  type CongestionLevel,
  EDGES,
  NAME_TO_NODE,
  type RouteResult,
  buildCongestionWeights,
  calcPathMinutes,
  findPath,
} from "../mapData";

interface Props {
  locations: string[];
  congestion: Record<string, CongestionLevel>;
  onRouteResult: (result: RouteResult) => void;
  "data-ocid"?: string;
}

const RISK_MAP: Record<CongestionLevel, { label: string; color: string }> = {
  low: { label: "LOW RISK", color: "#00cc88" },
  medium: { label: "MODERATE", color: "#ffaa22" },
  high: { label: "HIGH RISK", color: "#ff3355" },
};

function pathRisk(
  path: string[],
  congestion: Record<string, CongestionLevel>,
): CongestionLevel {
  let high = 0;
  let medium = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = EDGES.find(
      (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
    );
    if (edge) {
      const c = congestion[edge.id];
      if (c === "high") high++;
      else if (c === "medium") medium++;
    }
  }
  if (high > 0) return "high";
  if (medium > 0) return "medium";
  return "low";
}

export default function RoutePanel({
  locations,
  congestion,
  onRouteResult,
  "data-ocid": dataOcid,
}: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<RouteResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const canOptimize = from && to && from !== to;

  const handleOptimize = async () => {
    if (!canOptimize) return;
    setOptimizing(true);
    setResult(null);

    await new Promise((r) => setTimeout(r, 900));

    const fromNode = NAME_TO_NODE[from] || "downtown";
    const toNode = NAME_TO_NODE[to] || "central";

    const optWeights = buildCongestionWeights(congestion, false);
    const congWeights = buildCongestionWeights(congestion, true);

    const optimizedPath = findPath(fromNode, toNode, optWeights);
    const congestedPath = findPath(fromNode, toNode, congWeights);

    const optimizedMinutes = calcPathMinutes(optimizedPath, congestion);
    const currentMinutes = calcPathMinutes(congestedPath, congestion);

    const res: RouteResult = {
      fromName: from,
      toName: to,
      congestedPath,
      optimizedPath,
      currentMinutes: Math.max(currentMinutes, optimizedMinutes),
      optimizedMinutes,
    };
    setResult(res);
    onRouteResult(res);
    setOptimizing(false);
  };

  const timeSaved = result
    ? result.currentMinutes - result.optimizedMinutes
    : 0;

  return (
    <aside
      data-ocid={dataOcid}
      className="w-68 shrink-0 flex flex-col gap-3 p-3 overflow-y-auto"
      style={{
        width: "17rem",
        background: "rgba(3,10,22,0.92)",
        borderLeft: "1px solid rgba(168,85,247,0.14)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 pb-2"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.12)" }}
      >
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: "#a855f7", boxShadow: "0 0 8px #a855f7" }}
        />
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{
            fontFamily: "Bricolage Grotesque, sans-serif",
            color: "#a855f7",
          }}
        >
          Route Optimizer
        </span>
      </div>

      {/* FROM */}
      <div className="space-y-1.5">
        <div className="data-label">Origin</div>
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger
            data-ocid="route.select"
            className="h-9 text-xs"
            style={{
              background: "rgba(0,10,28,0.8)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: from ? "#e0e8ff" : "rgba(168,85,247,0.5)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.7rem",
            }}
          >
            <SelectValue placeholder="Select origin..." />
          </SelectTrigger>
          <SelectContent
            style={{
              background: "#060e1e",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            {locations.map((loc) => (
              <SelectItem
                key={loc}
                value={loc}
                className="text-xs"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#c0d0f0",
                }}
              >
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TO */}
      <div className="space-y-1.5">
        <div className="data-label">Destination</div>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger
            data-ocid="route.destination.select"
            className="h-9 text-xs"
            style={{
              background: "rgba(0,10,28,0.8)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: to ? "#e0e8ff" : "rgba(168,85,247,0.5)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.7rem",
            }}
          >
            <SelectValue placeholder="Select destination..." />
          </SelectTrigger>
          <SelectContent
            style={{
              background: "#060e1e",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            {locations.map((loc) => (
              <SelectItem
                key={loc}
                value={loc}
                className="text-xs"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#c0d0f0",
                }}
              >
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Optimize Button */}
      <button
        type="button"
        data-ocid="route.primary_button"
        className="neon-btn w-full py-2.5 rounded-lg font-bold tracking-widest"
        style={{
          opacity: canOptimize ? 1 : 0.45,
          cursor: canOptimize ? "pointer" : "not-allowed",
        }}
        onClick={handleOptimize}
        disabled={!canOptimize || optimizing}
      >
        {optimizing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
            ANALYZING...
          </span>
        ) : (
          "⚡ OPTIMIZE ROUTE"
        )}
      </button>

      {/* Results */}
      {result && (
        <div
          data-ocid="route.success_state"
          className="space-y-2 animate-slide-up"
        >
          <div className="data-label">Route Analysis</div>

          {/* Current Route */}
          <div
            className="rounded-lg p-2.5"
            style={{
              background: "rgba(255,51,85,0.08)",
              border: "1px solid rgba(255,51,85,0.22)",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="data-label"
                style={{ color: "rgba(255,100,120,0.7)" }}
              >
                Current Route
              </span>
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(255,51,85,0.15)",
                  border: "1px solid rgba(255,51,85,0.3)",
                }}
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: "#ff3355" }}
                />
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.6rem",
                    color: "#ff3355",
                  }}
                >
                  {RISK_MAP[pathRisk(result.congestedPath, congestion)].label}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-xl font-bold tabular-nums"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#ff6680",
                }}
              >
                {result.currentMinutes}
              </span>
              <span
                style={{ color: "rgba(255,100,130,0.5)", fontSize: "0.65rem" }}
              >
                min
              </span>
            </div>
            <div
              className="mt-1 truncate"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.6rem",
                color: "rgba(255,100,120,0.5)",
              }}
            >
              {result.congestedPath.map((n) => n.toUpperCase()).join(" → ")}
            </div>
          </div>

          {/* Optimized Route */}
          <div
            className="rounded-lg p-2.5"
            style={{
              background: "rgba(0,255,204,0.07)",
              border: "1px solid rgba(0,255,204,0.22)",
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="data-label"
                style={{ color: "rgba(0,255,180,0.7)" }}
              >
                AI Optimized
              </span>
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(0,255,204,0.12)",
                  border: "1px solid rgba(0,255,204,0.28)",
                }}
              >
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: "#00ffcc" }}
                />
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.6rem",
                    color: "#00ffcc",
                  }}
                >
                  {RISK_MAP[pathRisk(result.optimizedPath, congestion)].label}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-xl font-bold tabular-nums"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#00ffcc",
                  textShadow: "0 0 12px rgba(0,255,204,0.5)",
                }}
              >
                {result.optimizedMinutes}
              </span>
              <span
                style={{ color: "rgba(0,255,180,0.5)", fontSize: "0.65rem" }}
              >
                min
              </span>
            </div>
            <div
              className="mt-1 truncate"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.6rem",
                color: "rgba(0,200,160,0.5)",
              }}
            >
              {result.optimizedPath.map((n) => n.toUpperCase()).join(" → ")}
            </div>
          </div>

          {/* Time Saved */}
          {timeSaved > 0 && (
            <div
              className="rounded-lg p-2.5 text-center"
              style={{
                background: "rgba(0,212,255,0.07)",
                border: "1px solid rgba(0,212,255,0.25)",
                boxShadow: "0 0 16px rgba(0,212,255,0.1)",
              }}
            >
              <div className="data-label mb-0.5">Time Saved</div>
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: "Bricolage Grotesque, sans-serif",
                  color: "#00d4ff",
                  textShadow: "0 0 20px rgba(0,212,255,0.7)",
                }}
              >
                -{timeSaved} min
              </div>
            </div>
          )}
        </div>
      )}

      {/* Algorithm Info */}
      <div
        className="mt-auto rounded-lg p-2.5"
        style={{
          background: "rgba(0,10,20,0.5)",
          border: "1px solid rgba(168,85,247,0.1)",
        }}
      >
        <div
          className="data-label mb-2"
          style={{ color: "rgba(168,85,247,0.6)" }}
        >
          Algorithm
        </div>
        {(
          [
            ["MODEL", "Random Forest"],
            ["METHOD", "Dijkstra+"],
            ["INPUTS", "GPS+Weather"],
            ["LATENCY", "< 50ms"],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex justify-between mb-1">
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.58rem",
                color: "rgba(168,85,247,0.45)",
                letterSpacing: "0.06em",
              }}
            >
              {k}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.58rem",
                color: "rgba(180,160,255,0.75)",
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
