'use client';

import React from 'react';
import { Activity, Gauge, Flame, BatteryCharging, Clock, Cpu } from 'lucide-react';
import { DroneTelemetry } from '../types';

interface TelemetryPanelProps {
  fps: number;
  latencyMs: number;
  smokeDensity: number;
  drone: DroneTelemetry;
  totalSurvivors: number;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  fps,
  latencyMs,
  smokeDensity,
  drone,
  totalSurvivors,
}) => {
  const isLatencyHealthy = latencyMs < 300; // Problem statement SLA <300ms

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* 1. System Latency (<300ms SLA indicator) */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>LATENCY (SLA &lt;300ms)</span>
          <Gauge className={`w-4 h-4 ${isLatencyHealthy ? 'text-emerald-400' : 'text-red-400'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold font-mono ${isLatencyHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
            {latencyMs}
          </span>
          <span className="text-xs text-slate-400 font-mono">ms</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-emerald-400/80">
          Target: Real-Time Stream
        </div>
      </div>

      {/* 2. Processing FPS */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>FRAME RATE</span>
          <Activity className="w-4 h-4 text-tactical" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-tactical">{fps}</span>
          <span className="text-xs text-slate-400 font-mono">FPS</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-400">
          PyTorch AOD-Net Pipeline
        </div>
      </div>

      {/* 3. Smoke Extinction Index */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>SMOKE DENSITY</span>
          <Flame className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {(smokeDensity * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-slate-400 font-mono">obscured</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-amber-400/80">
          Dark Channel Prior Analysis
        </div>
      </div>

      {/* 4. Active Victims Tracked */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>VICTIMS IDENTIFIED</span>
          <Clock className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-rose-400">{totalSurvivors}</span>
          <span className="text-xs text-slate-400 font-mono">heat signatures</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-rose-400/80">
          Persistent ByteTrack IDs
        </div>
      </div>

      {/* 5. Drone Scout Battery */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>DRONE BATTERY</span>
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {drone.batteryPercent}%
          </span>
          <span className="text-xs text-slate-400 font-mono">LiPo</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-slate-400">
          Alt: {drone.altitudeMeters}m | Floor: {drone.currentFloor}
        </div>
      </div>

      {/* 6. AI Inference Worker */}
      <div className="bg-surface rounded-xl border border-surface-border p-3.5 flex flex-col justify-between shadow">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>AI ACCELERATOR</span>
          <Cpu className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono text-purple-300">GPU / CPU</span>
          <span className="text-xs text-slate-400 font-mono">FP16</span>
        </div>
        <div className="mt-1 text-[10px] font-mono text-emerald-400">
          YOLOv8 + AOD-Net OK
        </div>
      </div>
    </div>
  );
};
