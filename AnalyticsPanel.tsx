import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CongestionLevel } from "../mapData";

interface Props {
  congestion: Record<string, CongestionLevel>;
  "data-ocid"?: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TIME_LABELS = [
  "0h",
  "2h",
  "4h",
  "6h",
  "8h",
  "10h",
  "12h",
  "14h",
  "16h",
  "18h",
  "20h",
  "22h",
];

function generateHourlyData() {
  const currentHour = new Date().getHours();
  return Array.from({ length: 24 }, (_, h) => {
    const isRushAM = h >= 7 && h <= 9;
    const isRushPM = h >= 17 && h <= 19;
    const isLate = h >= 22 || h <= 5;
    const base = isRushAM
      ? 75
      : isRushPM
        ? 85
        : isLate
          ? 12
          : h >= 10 && h <= 16
            ? 50
            : 32;
    const density = Math.max(
      5,
      Math.min(98, Math.round(base + (Math.random() - 0.5) * 14)),
    );
    const predicted = Math.max(
      5,
      Math.min(98, Math.round(density + (Math.random() - 0.5) * 12)),
    );
    return {
      hour: h.toString().padStart(2, "0"),
      density,
      predicted,
      isCurrent: h === currentHour,
    };
  });
}

function generateHeatmap(): number[][] {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 12 }, (_, slot) => {
      const hour = slot * 2;
      const isWeekend = day >= 5;
      const isRushAM = hour >= 7 && hour <= 9;
      const isRushPM = hour >= 17 && hour <= 19;
      const isLate = hour >= 22 || hour <= 5;
      const val = isWeekend
        ? 20
        : isRushAM
          ? 80
          : isRushPM
            ? 88
            : isLate
              ? 8
              : 42;
      return Math.max(
        0,
        Math.min(100, Math.round(val + (Math.random() - 0.5) * 20)),
      );
    }),
  );
}

function generateAccuracyData() {
  return Array.from({ length: 16 }, (_, i) => ({
    t: i,
    accuracy: Math.round(82 + Math.random() * 14),
    baseline: 75,
  }));
}

function heatColor(val: number): string {
  if (val < 33) return `rgba(0,204,136,${0.3 + val * 0.012})`;
  if (val < 66) return `rgba(255,170,34,${0.3 + (val - 33) * 0.01})`;
  return `rgba(255,51,85,${0.3 + (val - 66) * 0.014})`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(3,10,24,0.95)",
        border: "1px solid rgba(0,212,255,0.2)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.65rem",
      }}
    >
      <p style={{ color: "rgba(0,212,255,0.6)", marginBottom: 4 }}>
        {label}:00
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.dataKey === "density" ? "ACTUAL" : "PREDICTED"}: {p.value}%
        </p>
      ))}
    </div>
  );
};

const AccuracyTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(3,10,24,0.95)",
        border: "1px solid rgba(168,85,247,0.2)",
        borderRadius: "6px",
        padding: "6px 10px",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.62rem",
      }}
    >
      <p style={{ color: "#a855f7" }}>ACC: {payload[0]?.value}%</p>
    </div>
  );
};

export default function AnalyticsPanel({ "data-ocid": dataOcid }: Props) {
  const hourlyData = useMemo(() => generateHourlyData(), []);
  const heatmap = useMemo(() => generateHeatmap(), []);
  const accuracyData = useMemo(() => generateAccuracyData(), []);

  const currentHour = new Date().getHours();
  const isRushHour =
    (currentHour >= 7 && currentHour <= 9) ||
    (currentHour >= 17 && currentHour <= 19);

  return (
    <section
      data-ocid={dataOcid ?? "analytics.panel"}
      className="shrink-0 flex gap-0 overflow-hidden"
      style={{
        height: "200px",
        background: "rgba(2,7,18,0.96)",
        borderTop: "1px solid rgba(0,212,255,0.1)",
      }}
    >
      {/* Hourly Traffic Trend */}
      <div
        className="flex flex-col p-3"
        style={{
          flex: "0 0 40%",
          borderRight: "1px solid rgba(0,212,255,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="data-label"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
          >
            24-HR TRAFFIC DENSITY
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ background: "#00d4ff" }} />
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.55rem",
                  color: "rgba(0,212,255,0.5)",
                }}
              >
                ACTUAL
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-3"
                style={{ height: "1px", borderTop: "2px dashed #00ffcc" }}
              />
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.55rem",
                  color: "rgba(0,255,204,0.5)",
                }}
              >
                PREDICTED
              </span>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourlyData}
              margin={{ top: 2, right: 4, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00ffcc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,212,255,0.06)"
              />
              <XAxis
                dataKey="hour"
                stroke="rgba(0,212,255,0.2)"
                tick={{
                  fill: "rgba(0,212,255,0.45)",
                  fontSize: 9,
                  fontFamily: "JetBrains Mono",
                }}
                interval={3}
              />
              <YAxis
                stroke="rgba(0,212,255,0.2)"
                tick={{
                  fill: "rgba(0,212,255,0.45)",
                  fontSize: 9,
                  fontFamily: "JetBrains Mono",
                }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="density"
                stroke="#00d4ff"
                strokeWidth={2}
                fill="url(#densityGrad)"
                dot={false}
                activeDot={{ r: 3, fill: "#00d4ff", stroke: "#00d4ff" }}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#00ffcc"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#predGrad)"
                dot={false}
                activeDot={{ r: 3, fill: "#00ffcc", stroke: "#00ffcc" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Congestion Heatmap */}
      <div
        className="flex flex-col p-3"
        style={{
          flex: "0 0 38%",
          borderRight: "1px solid rgba(0,212,255,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="data-label"
            style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
          >
            WEEKLY CONGESTION HEATMAP
          </span>
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-1.5 rounded-sm"
              style={{ background: "#00cc88" }}
            />
            <div
              className="w-4 h-1.5 rounded-sm"
              style={{ background: "#ffaa22" }}
            />
            <div
              className="w-4 h-1.5 rounded-sm"
              style={{ background: "#ff3355" }}
            />
          </div>
        </div>
        <div className="flex gap-1 flex-1">
          {/* Day labels */}
          <div className="flex flex-col justify-around">
            {DAYS.map((d) => (
              <span
                key={d}
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.5rem",
                  color: "rgba(0,212,255,0.35)",
                  lineHeight: 1,
                }}
              >
                {d}
              </span>
            ))}
          </div>
          {/* Grid */}
          <div
            className="flex-1"
            style={{
              display: "grid",
              gridTemplateRows: "repeat(7,1fr)",
              gap: "2px",
            }}
          >
            {heatmap.map((row, di) => (
              <div key={DAYS[di]} className="flex gap-0.5">
                {row.map((val, si) => (
                  <div
                    key={TIME_LABELS[si]}
                    className="flex-1 rounded-sm"
                    style={{ background: heatColor(val), minWidth: 0 }}
                    title={`${DAYS[di]} ${TIME_LABELS[si]}: ${val}%`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex ml-6 mt-1">
          {["0", "6", "12", "18", "24"].map((t) => (
            <span
              key={t}
              className="flex-1"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.48rem",
                color: "rgba(0,212,255,0.3)",
              }}
            >
              {t}h
            </span>
          ))}
        </div>
      </div>

      {/* AI Accuracy + Peak indicator */}
      <div className="flex flex-col p-3" style={{ flex: "0 0 22%" }}>
        <span
          className="data-label mb-2"
          style={{ fontSize: "0.6rem", letterSpacing: "0.1em" }}
        >
          AI PREDICTION ACCURACY
        </span>
        <div
          className="rounded px-2 py-1.5 mb-2"
          style={{
            background: isRushHour
              ? "rgba(255,51,85,0.12)"
              : "rgba(0,204,136,0.08)",
            border: `1px solid ${isRushHour ? "rgba(255,51,85,0.25)" : "rgba(0,204,136,0.2)"}`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
              style={{
                background: isRushHour ? "#ff3355" : "#00cc88",
                boxShadow: isRushHour ? "0 0 6px #ff3355" : "0 0 6px #00cc88",
              }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.6rem",
                color: isRushHour ? "#ff3355" : "#00cc88",
              }}
            >
              {isRushHour ? "PEAK HOUR" : "OFF PEAK"}
            </span>
          </div>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.55rem",
              color: "rgba(180,190,210,0.5)",
              marginTop: "2px",
            }}
          >
            {currentHour.toString().padStart(2, "0")}:00 LOCAL
          </div>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={accuracyData}
              margin={{ top: 2, right: 2, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgba(168,85,247,0.08)"
              />
              <YAxis
                domain={[70, 100]}
                stroke="rgba(168,85,247,0.2)"
                tick={{
                  fill: "rgba(168,85,247,0.4)",
                  fontSize: 8,
                  fontFamily: "JetBrains Mono",
                }}
              />
              <Tooltip content={<AccuracyTooltip />} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#a855f7" }}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="rgba(168,85,247,0.25)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
