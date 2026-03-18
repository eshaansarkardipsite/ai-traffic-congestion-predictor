import { useCallback, useEffect, useRef } from "react";
import {
  type CongestionLevel,
  EDGES,
  NODES,
  type RouteResult,
} from "../mapData";

// Canvas literal colors (CSS vars cannot be used in Canvas API)
const C = {
  bg: "#030c1a",
  gridLine: "rgba(0,180,255,0.038)",
  roadBase: "#0d1e35",
  roadLow: "#00cc88",
  roadLowBright: "#80ffe8",
  roadMedium: "#ffaa22",
  roadMediumBright: "#ffe090",
  roadHigh: "#ff3355",
  roadHighBright: "#ff8090",
  nodeGlow: "#00d4ff",
  nodeCore: "#061828",
  vehicleDefault: "#c8e8ff",
  routeCongested: "#ff3355",
  routeOptimized: "#00ffcc",
  labelColor: "rgba(0,212,255,0.55)",
  buildingFill: "#071525",
  scanline: "rgba(0,212,255,0.018)",
};

interface Vehicle {
  edgeId: string;
  t: number;
  speed: number;
  dir: 1 | -1;
}

interface Props {
  congestion: Record<string, CongestionLevel>;
  routeResult: RouteResult | null;
}

function getNodeXY(nodeId: string, w: number, h: number): [number, number] {
  const n = NODES[nodeId];
  if (!n) return [0, 0];
  return [n.fx * w, n.fy * h];
}

function roadColor(c: CongestionLevel | undefined): {
  main: string;
  bright: string;
} {
  if (!c || c === "low") return { main: C.roadLow, bright: C.roadLowBright };
  if (c === "medium") return { main: C.roadMedium, bright: C.roadMediumBright };
  return { main: C.roadHigh, bright: C.roadHighBright };
}

function gLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  blur: number,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export default function TrafficMap({ congestion, routeResult }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const congestionRef = useRef(congestion);
  const routeRef = useRef(routeResult);
  const frameRef = useRef(0);

  useEffect(() => {
    congestionRef.current = congestion;
  }, [congestion]);

  useEffect(() => {
    routeRef.current = routeResult;
  }, [routeResult]);

  const initVehicles = useCallback(() => {
    const veh: Vehicle[] = [];
    for (let i = 0; i < 22; i++) {
      const edge = EDGES[i % EDGES.length];
      veh.push({
        edgeId: edge.id,
        t: Math.random(),
        speed: 0.0008 + Math.random() * 0.0018,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    vehiclesRef.current = veh;
  }, []);

  const draw = useCallback(
    (w: number, h: number, ctx: CanvasRenderingContext2D) => {
      const cong = congestionRef.current;
      const route = routeRef.current;
      const t = frameRef.current++;

      // Background
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = C.gridLine;
      ctx.lineWidth = 0.5;
      const gStep = 28;
      for (let x = 0; x < w; x += gStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Building blocks
      const buildings = [
        [0.15, 0.04, 0.1, 0.08],
        [0.32, 0.04, 0.12, 0.07],
        [0.62, 0.04, 0.1, 0.06],
        [0.04, 0.28, 0.06, 0.14],
        [0.2, 0.38, 0.07, 0.09],
        [0.57, 0.2, 0.11, 0.08],
        [0.36, 0.56, 0.09, 0.1],
        [0.62, 0.62, 0.08, 0.1],
        [0.78, 0.33, 0.06, 0.12],
        [0.22, 0.88, 0.08, 0.06],
        [0.56, 0.56, 0.07, 0.07],
      ];
      for (const [bx, by, bw, bh] of buildings) {
        ctx.fillStyle = C.buildingFill;
        ctx.fillRect(bx * w, by * h, bw * w, bh * h);
        // Window lights
        for (let wy = 0; wy < 3; wy++) {
          for (let wx = 0; wx < 4; wx++) {
            const brightness =
              0.04 +
              0.06 * Math.abs(Math.sin(t * 0.015 + bx * 9 + wy * 3 + wx));
            ctx.fillStyle = `rgba(0,190,255,${brightness})`;
            ctx.fillRect(
              (bx + 0.008 + wx * 0.023) * w,
              (by + 0.01 + wy * 0.028) * h,
              0.012 * w,
              0.012 * h,
            );
          }
        }
      }

      // Collect route edge sets
      const congestedEdgeIds = new Set<string>();
      const optimizedEdgeIds = new Set<string>();
      if (route) {
        for (let i = 0; i < route.congestedPath.length - 1; i++) {
          const a = route.congestedPath[i];
          const b = route.congestedPath[i + 1];
          const e = EDGES.find(
            (ed) =>
              (ed.from === a && ed.to === b) || (ed.from === b && ed.to === a),
          );
          if (e) congestedEdgeIds.add(e.id);
        }
        for (let i = 0; i < route.optimizedPath.length - 1; i++) {
          const a = route.optimizedPath[i];
          const b = route.optimizedPath[i + 1];
          const e = EDGES.find(
            (ed) =>
              (ed.from === a && ed.to === b) || (ed.from === b && ed.to === a),
          );
          if (e) optimizedEdgeIds.add(e.id);
        }
      }

      // Draw roads
      for (const edge of EDGES) {
        const [x1, y1] = getNodeXY(edge.from, w, h);
        const [x2, y2] = getNodeXY(edge.to, w, h);
        const { main, bright } = roadColor(cong[edge.id]);

        // Road base (wide dark)
        gLine(ctx, x1, y1, x2, y2, C.roadBase, 10, 0);
        // Colored road
        gLine(ctx, x1, y1, x2, y2, main, 2.5, 10);
        // Bright center
        gLine(ctx, x1, y1, x2, y2, bright, 0.8, 2);
      }

      // Route overlays
      if (route) {
        // Congested route - dashed red
        ctx.save();
        ctx.setLineDash([9, 7]);
        for (let i = 0; i < route.congestedPath.length - 1; i++) {
          const [x1, y1] = getNodeXY(route.congestedPath[i], w, h);
          const [x2, y2] = getNodeXY(route.congestedPath[i + 1], w, h);
          gLine(ctx, x1, y1, x2, y2, C.routeCongested, 3.5, 14);
        }
        ctx.restore();

        // Optimized route - glowing cyan, pulsing
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.06);
        ctx.save();
        ctx.globalAlpha = pulse;
        for (let i = 0; i < route.optimizedPath.length - 1; i++) {
          const [x1, y1] = getNodeXY(route.optimizedPath[i], w, h);
          const [x2, y2] = getNodeXY(route.optimizedPath[i + 1], w, h);
          gLine(ctx, x1, y1, x2, y2, C.routeOptimized, 4.5, 22);
          gLine(ctx, x1, y1, x2, y2, "#ffffff", 1.2, 4);
        }
        ctx.restore();

        // Animated dot along optimized route
        const pathLen = route.optimizedPath.length - 1;
        if (pathLen > 0) {
          const dotT = (t * 0.012) % pathLen;
          const segIdx = Math.floor(dotT);
          const segT = dotT - segIdx;
          if (segIdx < route.optimizedPath.length - 1) {
            const [ax, ay] = getNodeXY(route.optimizedPath[segIdx], w, h);
            const [bx, by] = getNodeXY(route.optimizedPath[segIdx + 1], w, h);
            const dx = ax + (bx - ax) * segT;
            const dy = ay + (by - ay) * segT;
            ctx.save();
            ctx.shadowColor = C.routeOptimized;
            ctx.shadowBlur = 16;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Intersection nodes
      for (const nodeId of Object.keys(NODES)) {
        const [x, y] = getNodeXY(nodeId, w, h);
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.035 + NODES[nodeId].fx * 18);
        ctx.save();
        ctx.shadowColor = C.nodeGlow;
        ctx.shadowBlur = 14 * pulse;
        ctx.fillStyle = C.nodeCore;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.nodeGlow;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Location labels
      ctx.font = `bold 9px "JetBrains Mono", monospace`;
      ctx.fillStyle = C.labelColor;
      ctx.textAlign = "center";
      for (const nodeId of Object.keys(NODES)) {
        const node = NODES[nodeId];
        const [x, y] = getNodeXY(nodeId, w, h);
        const below = node.fy < 0.6;
        ctx.fillText(node.displayName, x, y + (below ? 19 : -12));
      }

      // Vehicles
      for (const v of vehiclesRef.current) {
        v.t += v.speed * v.dir;
        if (v.t >= 1) {
          v.t = 1;
          v.dir = -1;
        }
        if (v.t <= 0) {
          v.t = 0;
          v.dir = 1;
        }
        const edge = EDGES.find((e) => e.id === v.edgeId);
        if (!edge) continue;
        const [x1, y1] = getNodeXY(edge.from, w, h);
        const [x2, y2] = getNodeXY(edge.to, w, h);
        const vx = x1 + (x2 - x1) * v.t;
        const vy = y1 + (y2 - y1) * v.t;
        const c = cong[edge.id];
        const vColor =
          c === "high"
            ? "#ff8090"
            : c === "medium"
              ? "#ffe090"
              : C.vehicleDefault;
        ctx.save();
        ctx.shadowColor = vColor;
        ctx.shadowBlur = 7;
        ctx.fillStyle = vColor;
        ctx.beginPath();
        ctx.arc(vx, vy, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Scanlines
      ctx.fillStyle = C.scanline;
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      // Moving scan sweep
      const sweepY = (t * 1.8) % h;
      const sweepGrad = ctx.createLinearGradient(
        0,
        sweepY - 40,
        0,
        sweepY + 40,
      );
      sweepGrad.addColorStop(0, "rgba(0,212,255,0)");
      sweepGrad.addColorStop(0.5, "rgba(0,212,255,0.05)");
      sweepGrad.addColorStop(1, "rgba(0,212,255,0)");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, sweepY - 40, w, 80);

      // Legend
      const legendItems = [
        { color: C.roadLow, label: "LOW" },
        { color: C.roadMedium, label: "MOD" },
        { color: C.roadHigh, label: "HIGH" },
      ];
      legendItems.forEach(({ color, label }, i) => {
        const lx = 14;
        const ly = h - 14 - i * 16;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillRect(lx, ly - 5, 18, 6);
        ctx.restore();
        ctx.font = `9px "JetBrains Mono", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.textAlign = "left";
        ctx.fillText(label, lx + 22, ly);
      });

      if (route) {
        const ly = h - 14 - 3 * 16;
        ctx.save();
        ctx.shadowColor = C.routeOptimized;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = C.routeOptimized;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14, ly - 2);
        ctx.lineTo(32, ly - 2);
        ctx.stroke();
        ctx.restore();
        ctx.font = `9px "JetBrains Mono", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.textAlign = "left";
        ctx.fillText("OPT", 36, ly);

        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.shadowColor = C.routeCongested;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = C.routeCongested;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(14, ly - 2 - 16);
        ctx.lineTo(32, ly - 2 - 16);
        ctx.stroke();
        ctx.restore();
        ctx.font = `9px "JetBrains Mono", monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.textAlign = "left";
        ctx.fillText("CURR", 36, ly - 16);
      }
    },
    [],
  );

  useEffect(() => {
    initVehicles();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const lw = rect.width;
      const lh = rect.height;
      if (
        canvas.width !== Math.round(lw * dpr) ||
        canvas.height !== Math.round(lh * dpr)
      ) {
        canvas.width = Math.round(lw * dpr);
        canvas.height = Math.round(lh * dpr);
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(lw, lh, ctx);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [initVehicles, draw]);

  return (
    <canvas
      ref={canvasRef}
      data-ocid="map.canvas_target"
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
