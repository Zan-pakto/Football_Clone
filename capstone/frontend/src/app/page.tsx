'use client';

import React from 'react';
import { Shield, Radio, Wifi, WifiOff, FileDown, BellRing } from 'lucide-react';
import { useLiveStream } from '../hooks/useLiveStream';
import { DualStreamPlayer } from '../components/DualStreamPlayer';
import { FloorPlanMap } from '../components/FloorPlanMap';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { SurvivorAlerts } from '../components/SurvivorAlerts';

export default function MissionControlDashboard() {
  const { connected, telemetry, markSurvivorStatus } = useLiveStream();

  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 space-y-5 max-w-[1720px] mx-auto">
      {/* Top Tactical Command Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Shield className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                PROJECT AEGIS-VISION
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SIH1417 & SIH1422
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Tactical AI De-Smoking & Victim Localization Console | Sub-300ms Real-Time Ingest
            </p>
          </div>
        </div>

        {/* Status Indicators & Export */}
        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
              connected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>LIVE GATEWAY CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>SIMULATED STREAM MODE</span>
              </>
            )}
          </div>

          {/* Export Tactical Sitrep */}
          <button
            onClick={() => {
              alert(
                `[SITREP GENERATED]\nTrapped Victims: ${
                  telemetry.survivors.filter((s) => s.status === 'trapped').length
                }\nSector: Floor 1 (Server & Battery Room)\nLatency: ${telemetry.latencyMs}ms\nReport logged to Incident Command.`
              );
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-slate-200 hover:text-white hover:border-slate-500 text-xs font-mono font-medium transition"
          >
            <FileDown className="w-3.5 h-3.5 text-tactical" />
            <span>EXPORT SITREP</span>
          </button>
        </div>
      </header>

      {/* Real-time Telemetry Metrics HUD */}
      <TelemetryPanel
        fps={telemetry.fps}
        latencyMs={telemetry.latencyMs}
        smokeDensity={telemetry.smokeDensity}
        drone={telemetry.drone}
        totalSurvivors={telemetry.survivors.length}
      />

      {/* Main Core Grid: Dual Video Player (Left) + 2.5D Floorplan & Alerts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Dual Video Player with Wipe Comparison */}
        <div className="lg:col-span-7 space-y-4">
          <DualStreamPlayer
            rawFrameUrl={telemetry.rawFrameBase64}
            cleanFrameUrl={telemetry.cleanFrameBase64}
            smokeDensity={telemetry.smokeDensity}
            survivors={telemetry.survivors}
          />

          {/* Golden Hour Countdown Banner */}
          <div className="bg-gradient-to-r from-red-950/40 via-surface to-surface border border-red-500/40 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold text-red-300">
                  CRITICAL SEARCH & RESCUE PHASE
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Autonomous scout drone deployed to Room 103. Immediate evacuation recommended.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">ELAPSED TIME</span>
              <span className="text-sm font-mono font-bold text-slate-200">00:14:28</span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Floorplan 2.5D Map + Survivor Log */}
        <div className="lg:col-span-5 space-y-5">
          <FloorPlanMap
            rooms={telemetry.rooms}
            survivors={telemetry.survivors}
            drone={telemetry.drone}
          />

          <SurvivorAlerts
            survivors={telemetry.survivors}
            onUpdateStatus={markSurvivorStatus}
          />
        </div>
      </div>
    </main>
  );
}
