import { useEffect, useState } from "react";

const DATA_PACKETS = [
  "PKT#7821 | GPS:40.71°N/74.00°W | SPEED:42km/h | FLOW:MODERATE",
  "SENSOR_ID:TF-0042 | DENSITY:78 | STATUS:CONGESTED | LANE:3",
  "WEATHER:CLEAR | VISIBILITY:10km | WIND:12km/h NE | HUMID:62%",
  "PKT#7822 | INCIDENT:NONE | SIGNAL_PHASE:GREEN | WAIT:14s",
  "AI_UPDATE: Congestion predicted +15% @ 17:30 | CONF:92%",
  "SENSOR_ID:TF-0089 | FLOW:HIGH | QUEUE_LEN:840m | DELAY:8min",
  "PKT#7823 | CAM:SW-14 | FRAME:CLEAR | VEHICLES:23 | SPEED:38km/h",
  "ROUTE_OPT: Alt route saved 6min avg | USERS:1,204 rerouted",
  "PKT#7824 | GPS:40.73°N/73.98°W | SPEED:61km/h | FLOW:LOW",
  "WEATHER_UPD: Rain expected 18:00 | IMPACT:+22% congestion",
  "SENSOR_ID:TF-0107 | DENSITY:34 | STATUS:FLOWING | SPEED:58km/h",
  "PKT#7825 | SIGNAL:OPT | PHASE_ADJ:+8s GREEN | CLEARED:2 LANES",
  "AI_ALERT: Peak hour approaching | T-45min | CONF:89%",
  "SENSOR_ID:TF-0062 | DENSITY:91 | STATUS:HEAVY | INCIDENT:MERGE",
];

// Precompute duplicated list with stable unique keys
const ALL_PACKETS = [
  ...DATA_PACKETS.map((pkt, idx) => ({ key: `first-${idx}`, pkt, idx })),
  ...DATA_PACKETS.map((pkt, idx) => ({ key: `second-${idx}`, pkt, idx })),
];

export default function StatusStrip() {
  const [activePacket, setActivePacket] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActivePacket((p) => (p + 1) % DATA_PACKETS.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-ocid="status.panel"
      className="shrink-0 flex items-center overflow-hidden"
      style={{
        height: "38px",
        background: "rgba(2,8,18,0.96)",
        borderTop: "1px solid rgba(0,212,255,0.12)",
        borderBottom: "1px solid rgba(0,212,255,0.08)",
      }}
    >
      {/* Left badge */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 h-full"
        style={{
          background: "rgba(0,212,255,0.07)",
          borderRight: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }}
        />
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.6rem",
            color: "#00d4ff",
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
          }}
        >
          DATA STREAM
        </span>
      </div>

      {/* Scrolling stream */}
      <div className="flex-1 overflow-hidden relative">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          {ALL_PACKETS.map(({ key, pkt, idx }) => (
            <span
              key={key}
              className="shrink-0"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.62rem",
                color: idx === activePacket ? "#00d4ff" : "rgba(0,180,220,0.4)",
                letterSpacing: "0.04em",
                textShadow:
                  idx === activePacket ? "0 0 8px rgba(0,212,255,0.6)" : "none",
                transition: "color 0.3s",
              }}
            >
              <span style={{ color: "rgba(0,255,204,0.4)" }}>▸</span> {pkt}
            </span>
          ))}
        </div>
      </div>

      {/* Right status badges */}
      <div
        className="shrink-0 flex items-center gap-3 px-3 h-full"
        style={{
          borderLeft: "1px solid rgba(0,212,255,0.12)",
          background: "rgba(0,10,20,0.5)",
        }}
      >
        {[
          { label: "RF PREDICTOR", color: "#00ffcc" },
          { label: "GPS FEED", color: "#a855f7" },
          { label: "WEATHER API", color: "#00d4ff" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-1 h-1 rounded-full animate-pulse-dot"
              style={{ background: color, boxShadow: `0 0 4px ${color}` }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.55rem",
                color: `${color}80`,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
