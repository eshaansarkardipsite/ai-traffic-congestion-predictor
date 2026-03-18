export interface MapNode {
  id: string;
  label: string;
  displayName: string;
  fx: number;
  fy: number;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
}

export type CongestionLevel = "low" | "medium" | "high";

export interface RouteResult {
  fromName: string;
  toName: string;
  congestedPath: string[];
  optimizedPath: string[];
  currentMinutes: number;
  optimizedMinutes: number;
}

export const PRESET_LOCATIONS = [
  "Downtown Hub",
  "Airport Terminal",
  "Tech District",
  "Harbor Port",
  "University Campus",
  "Central Station",
  "Medical Center",
  "Shopping Mall",
];

export const NAME_TO_NODE: Record<string, string> = {
  "Downtown Hub": "downtown",
  "Airport Terminal": "airport",
  "Tech District": "tech",
  "Harbor Port": "harbor",
  "University Campus": "university",
  "Central Station": "central",
  "Medical Center": "medical",
  "Shopping Mall": "shopping",
};

export const NODES: Record<string, MapNode> = {
  downtown: {
    id: "downtown",
    label: "Downtown Hub",
    displayName: "DWNTN",
    fx: 0.11,
    fy: 0.18,
  },
  airport: {
    id: "airport",
    label: "Airport Terminal",
    displayName: "AIRPT",
    fx: 0.86,
    fy: 0.14,
  },
  tech: {
    id: "tech",
    label: "Tech District",
    displayName: "TECH",
    fx: 0.84,
    fy: 0.54,
  },
  harbor: {
    id: "harbor",
    label: "Harbor Port",
    displayName: "HARBR",
    fx: 0.11,
    fy: 0.8,
  },
  university: {
    id: "university",
    label: "University Campus",
    displayName: "UNIV",
    fx: 0.46,
    fy: 0.84,
  },
  central: {
    id: "central",
    label: "Central Station",
    displayName: "CNTRL",
    fx: 0.48,
    fy: 0.46,
  },
  medical: {
    id: "medical",
    label: "Medical Center",
    displayName: "MEDCL",
    fx: 0.28,
    fy: 0.29,
  },
  shopping: {
    id: "shopping",
    label: "Shopping Mall",
    displayName: "SHPNG",
    fx: 0.72,
    fy: 0.8,
  },
};

export const EDGES: MapEdge[] = [
  { id: "e1", from: "downtown", to: "medical" },
  { id: "e2", from: "downtown", to: "harbor" },
  { id: "e3", from: "medical", to: "airport" },
  { id: "e4", from: "medical", to: "central" },
  { id: "e5", from: "airport", to: "tech" },
  { id: "e6", from: "tech", to: "central" },
  { id: "e7", from: "tech", to: "shopping" },
  { id: "e8", from: "central", to: "university" },
  { id: "e9", from: "harbor", to: "university" },
  { id: "e10", from: "university", to: "shopping" },
  { id: "e11", from: "downtown", to: "central" },
  { id: "e12", from: "central", to: "shopping" },
];

// Adjacency list
export const ADJ: Record<string, string[]> = {};
for (const edge of EDGES) {
  if (!ADJ[edge.from]) ADJ[edge.from] = [];
  if (!ADJ[edge.to]) ADJ[edge.to] = [];
  ADJ[edge.from].push(edge.to);
  ADJ[edge.to].push(edge.from);
}

function getEdge(a: string, b: string): MapEdge | undefined {
  return EDGES.find(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a),
  );
}

// Dijkstra - low weights = preferred path
export function findPath(
  start: string,
  end: string,
  edgeWeights: Record<string, number>,
): string[] {
  if (start === end) return [start];
  const dist: Record<string, number> = {};
  const prev: Record<string, string> = {};
  const unvisited = new Set(Object.keys(NODES));

  for (const id of Object.keys(NODES)) dist[id] = Number.POSITIVE_INFINITY;
  dist[start] = 0;

  while (unvisited.size > 0) {
    let u = "";
    let minD = Number.POSITIVE_INFINITY;
    for (const id of unvisited) {
      if (dist[id] < minD) {
        minD = dist[id];
        u = id;
      }
    }
    if (!u || u === end) break;
    unvisited.delete(u);
    for (const v of ADJ[u] || []) {
      if (!unvisited.has(v)) continue;
      const e = getEdge(u, v);
      const w = e ? (edgeWeights[e.id] ?? 2) : 2;
      const alt = dist[u] + w;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }

  const path: string[] = [];
  let curr: string | undefined = end;
  while (curr && curr !== start) {
    path.unshift(curr);
    curr = prev[curr];
  }
  path.unshift(start);
  return path.length > 1 ? path : [start, end];
}

export function calcPathMinutes(
  path: string[],
  congestion: Record<string, CongestionLevel>,
): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const e = getEdge(path[i], path[i + 1]);
    if (e) {
      const c = congestion[e.id];
      total += c === "high" ? 14 : c === "medium" ? 9 : 5;
    }
  }
  return total || 10;
}

export function buildCongestionWeights(
  congestion: Record<string, CongestionLevel>,
  preferCongested: boolean,
): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const edge of EDGES) {
    const c = congestion[edge.id];
    if (preferCongested) {
      weights[edge.id] = c === "high" ? 1 : c === "medium" ? 2 : 4;
    } else {
      weights[edge.id] = c === "high" ? 4 : c === "medium" ? 2 : 1;
    }
  }
  return weights;
}

export function initCongestion(): Record<string, CongestionLevel> {
  const levels: CongestionLevel[] = ["low", "medium", "high"];
  const result: Record<string, CongestionLevel> = {};
  for (const edge of EDGES) {
    result[edge.id] = levels[Math.floor(Math.random() * 3)];
  }
  return result;
}

export function randomizeCongestion(
  prev: Record<string, CongestionLevel>,
): Record<string, CongestionLevel> {
  const levels: CongestionLevel[] = ["low", "medium", "high"];
  const next = { ...prev };
  // Update ~half the edges to create realistic gradual change
  for (const edge of EDGES) {
    if (Math.random() < 0.5) {
      next[edge.id] = levels[Math.floor(Math.random() * 3)];
    }
  }
  return next;
}
