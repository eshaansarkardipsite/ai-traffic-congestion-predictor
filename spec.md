# AI Traffic Congestion Prediction & Smart Route Optimization System

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Full single-page dashboard app simulating an AI-powered smart city traffic control center
- Interactive canvas-based city road network map with glowing roads, animated vehicle light trails, and color-coded congestion (green/yellow/red)
- AI Congestion Prediction left panel: predicted congestion level, estimated travel time, traffic density score, confidence level with animated progress bars
- Route Optimization right panel: dropdown selectors for start/destination from preset city locations, showing congested vs optimized route on map with time saved and congestion risk
- Traffic Analytics bottom section: hourly traffic trend chart (Chart.js), peak traffic indicator, AI prediction graph, congestion heatmap
- AI System Status panel: model info (Random Forest), data sources, prediction window, animated data stream effect
- Top bar with project title and live system status indicators
- All data simulated/randomized with periodic updates to feel live

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Minimal Motoko backend exposing a `getTrafficData` query returning simulated traffic segment data
2. React frontend with Canvas-based city map (custom 2D grid city with glowing roads, animated trails)
3. Left panel with AI prediction stats using animated progress bars and numeric counters
4. Right panel with route optimization selector and route visualization on map canvas
5. Bottom analytics bar with Chart.js line chart for hourly trend and mini heatmap grid
6. AI system status strip with scrolling data stream animation
7. Futuristic cyberpunk dark theme: dark bg, neon blue/cyan highlights, purple glow, orange/red alerts
8. All traffic data simulated in frontend with setInterval updates
