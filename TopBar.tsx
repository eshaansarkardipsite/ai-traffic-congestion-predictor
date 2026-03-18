import { useEffect, useState } from "react";

export default function TopBar() {
  const [time, setTime] = useState(new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date());
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = time.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header
      data-ocid="top.status_panel"
      className="flex items-center justify-between px-5 h-12 shrink-0"
      style={{
        background: "rgba(3,8,20,0.95)",
        borderBottom: "1px solid rgba(0,212,255,0.18)",
        boxShadow: "0 1px 20px rgba(0,212,255,0.1)",
      }}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse-dot"
            style={{ background: "#00d4ff", boxShadow: "0 0 8px #00d4ff" }}
          />
          <span
            className="text-sm font-bold tracking-[0.2em] uppercase"
            style={{
              fontFamily: "Bricolage Grotesque, sans-serif",
              color: "#00d4ff",
              textShadow: "0 0 12px rgba(0,212,255,0.6)",
            }}
          >
            AI Traffic Command Center
          </span>
        </div>
        <div
          className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded"
          style={{
            background: "rgba(0,255,204,0.08)",
            border: "1px solid rgba(0,255,204,0.2)",
          }}
        >
          <span
            className="text-xs"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#00ffcc",
              fontSize: "0.6rem",
            }}
          >
            PRED WINDOW: 30–60 MIN
          </span>
        </div>
      </div>

      {/* Center: Status indicators */}
      <div className="flex items-center gap-4">
        <StatusBadge label="AI MODEL" value="ONLINE" color="#00ffcc" />
        <StatusBadge label="DATA FEED" value="LIVE" color="#00d4ff" pulse />
        <StatusBadge label="GPS SATS" value="24/24" color="#a855f7" />
      </div>

      {/* Right: Time */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div
            className="text-sm tabular-nums"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#00d4ff",
              fontSize: "0.8rem",
              letterSpacing: "0.05em",
            }}
          >
            {timeStr}
          </div>
          <div
            className="text-xs"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "rgba(0,212,255,0.45)",
              fontSize: "0.6rem",
            }}
          >
            {dateStr}
          </div>
        </div>
        {/* Data packet flash indicator */}
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: tick % 2 === 0 ? "#00ffcc" : "rgba(0,255,204,0.2)",
            boxShadow: tick % 2 === 0 ? "0 0 6px #00ffcc" : "none",
            transition: "all 0.1s",
          }}
        />
      </div>
    </header>
  );
}

function StatusBadge({
  label,
  value,
  color,
  pulse,
}: {
  label: string;
  value: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {pulse && (
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
      )}
      <span
        className="hidden lg:block"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.55rem",
          color: "rgba(0,212,255,0.4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.65rem",
          color,
          letterSpacing: "0.05em",
          textShadow: `0 0 8px ${color}60`,
        }}
      >
        {value}
      </span>
    </div>
  );
}
