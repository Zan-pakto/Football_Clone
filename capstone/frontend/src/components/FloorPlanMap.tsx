'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, AlertTriangle, Layers, Radio } from 'lucide-react';
import { RoomPolygon, Survivor, DroneTelemetry } from '../types';

interface FloorPlanMapProps {
  rooms: RoomPolygon[];
  survivors: Survivor[];
  drone: DroneTelemetry;
  onSelectSurvivor?: (id: number) => void;
}

export const FloorPlanMap: React.FC<FloorPlanMapProps> = ({
  rooms,
  survivors,
  drone,
  onSelectSurvivor,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [activeRoomHover, setActiveRoomHover] = useState<RoomPolygon | null>(null);

  const getHazardBorder = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'border-red-500/80 bg-red-950/20 text-red-400';
      case 'MODERATE':
        return 'border-amber-500/70 bg-amber-950/20 text-amber-400';
      default:
        return 'border-emerald-500/50 bg-emerald-950/15 text-emerald-400';
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden flex flex-col shadow-2xl">
      {/* Header Controls */}
      <div className="px-4 py-3 bg-surface-border/40 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-tactical" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            2.5D Indoor Floorplan & Localization Map
          </h2>
        </div>

        {/* Floor Switcher */}
        <div className="flex items-center gap-1.5 bg-background/80 px-2 py-1 rounded-lg border border-surface-border text-xs font-mono">
          <span className="text-slate-400">FLOOR:</span>
          {[1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={`px-2 py-0.5 rounded transition ${
                selectedFloor === f
                  ? 'bg-tactical text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              L{f}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Blueprint Canvas Area */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 p-4 overflow-hidden border-b border-surface-border">
        {/* Blueprint Grid Lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Blueprint Perimeter Container */}
        <div className="relative w-full h-full border-2 border-slate-700/80 rounded-lg bg-slate-900/60 p-2">
          {/* Render Rooms */}
          {rooms
            .filter((r) => r.floor === selectedFloor)
            .map((room) => {
              const { x, y, width, height } = room.bounds;
              const isHovered = activeRoomHover?.id === room.id;
              const hazardClasses = getHazardBorder(room.hazardLevel);

              return (
                <div
                  key={room.id}
                  onMouseEnter={() => setActiveRoomHover(room)}
                  onMouseLeave={() => setActiveRoomHover(null)}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                  className={`absolute border rounded-md p-2 transition-all duration-200 flex flex-col justify-between cursor-pointer ${hazardClasses} ${
                    isHovered ? 'ring-2 ring-tactical z-10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono font-bold leading-tight truncate">
                      {room.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 rounded bg-black/40">
                      {room.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono opacity-80">
                    <span>SMOKE: {(room.smokeDensity * 100).toFixed(0)}%</span>
                    <span className="uppercase">{room.hazardLevel}</span>
                  </div>
                </div>
              );
            })}

          {/* Render Live Drone Position Indicator */}
          <div
            style={{
              left: `${drone.location.x}%`,
              top: `${drone.location.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-20 transition-all duration-500 pointer-events-none flex flex-col items-center"
          >
            {/* Compass Heading Arrow */}
            <div
              style={{ transform: `rotate(${drone.headingDegrees}deg)` }}
              className="w-7 h-7 rounded-full bg-cyan-500/20 border-2 border-tactical flex items-center justify-center text-tactical shadow-[0_0_15px_rgba(6,182,212,0.6)]"
            >
              <Navigation className="w-3.5 h-3.5 fill-tactical" />
            </div>
            <span className="text-[9px] font-mono bg-slate-950/90 text-cyan-300 px-1 py-0.5 rounded border border-cyan-500/40 mt-1 whitespace-nowrap">
              {drone.droneId} ({drone.altitudeMeters}m)
            </span>
          </div>

          {/* Render Detected Survivor Pulsing Pins */}
          {survivors
            .filter((s) => s.floor === selectedFloor)
            .map((survivor) => {
              const isTrapped = survivor.status === 'trapped';
              return (
                <div
                  key={survivor.id}
                  onClick={() => onSelectSurvivor?.(survivor.id)}
                  style={{
                    left: `${survivor.floorCoords.x}%`,
                    top: `${survivor.floorCoords.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-30 cursor-pointer flex flex-col items-center group"
                >
                  {/* Pulsing Beacon Ring */}
                  <div
                    className={`absolute -inset-3 rounded-full victim-pulse pointer-events-none ${
                      isTrapped ? 'bg-red-500/40' : 'bg-amber-500/30'
                    }`}
                  />

                  {/* Pin Core */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white ${
                      isTrapped ? 'bg-red-600 animate-pulse' : 'bg-amber-600'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                  </div>

                  {/* Floating Tag */}
                  <div className="mt-1 bg-slate-950/95 border border-red-500/80 rounded px-1.5 py-0.5 text-[9px] font-mono text-red-300 whitespace-nowrap shadow-xl flex items-center gap-1 group-hover:scale-110 transition">
                    <Radio className="w-2.5 h-2.5 text-red-400 animate-ping" />
                    <span>
                      VICTIM #{survivor.id} ({survivor.durationSeconds}s)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="px-4 py-2.5 bg-surface text-xs font-mono text-slate-400 flex items-center justify-between border-t border-surface-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-300">Trapped Victim</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Scout Drone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-950/60 border border-red-500/60" />
            <span className="text-slate-300">Critical Smoke Zone</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          COORDINATES: <span className="text-slate-200">SECTOR-7 (POSTGIS)</span>
        </div>
      </div>
    </div>
  );
};
