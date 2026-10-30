'use client';

import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, SlidersHorizontal, Flame } from 'lucide-react';
import { Survivor } from '../types';

interface DualStreamPlayerProps {
  rawFrameUrl?: string;
  cleanFrameUrl?: string;
  smokeDensity: number;
  survivors: Survivor[];
}

export const DualStreamPlayer: React.FC<DualStreamPlayerProps> = ({
  rawFrameUrl,
  cleanFrameUrl,
  smokeDensity,
  survivors,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

  // Fallback demo canvas visuals if video frames are not transmitted as base64
  const renderSyntheticCanvas = (isClean: boolean) => (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${
        isClean ? 'bg-slate-900' : 'bg-stone-900'
      }`}
    >
      {/* Structural Hallway Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80">
        <div className="w-[85%] h-[80%] border-4 border-slate-700/60 rounded-lg flex items-center justify-center relative">
          {/* Corridor Doorway */}
          <div className="w-36 h-64 border-2 border-slate-600 bg-slate-950/70 absolute bottom-0 flex flex-col items-center pt-2">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">DOOR 204</span>
          </div>
          {/* Hazard Sign */}
          <div className="absolute top-4 left-6 text-xs font-mono text-amber-500/80 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>SECTOR B - ZERO VISIBILITY ZONE</span>
          </div>
        </div>
      </div>

      {/* Trapped Victim Heat Silhouette */}
      <div className="absolute bottom-[28%] left-[46%] flex flex-col items-center">
        {/* Thermal Glow */}
        <div
          className={`w-14 h-8 rounded-full ${
            isClean
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-yellow-400 blur-sm opacity-90'
              : 'bg-amber-600/30 blur-md opacity-40'
          }`}
        />
        {isClean && (
          <div className="absolute -top-7 whitespace-nowrap bg-red-950/90 border border-red-500 text-red-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-lg animate-bounce">
            VICTIM #101 [TRAPPED]
          </div>
        )}
      </div>

      {/* Raw Smoke Layer Simulation */}
      {!isClean && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(200, 190, 180, ${smokeDensity * 0.92}) 0%, rgba(130, 120, 110, ${smokeDensity * 0.98}) 80%)`,
            backdropFilter: `blur(${smokeDensity * 12}px)`,
          }}
        >
          <div className="absolute inset-0 bg-stone-900/40 mix-blend-multiply" />
        </div>
      )}

      {/* AI HUD Bracket when in Clean Mode */}
      {isClean && (
        <div className="absolute bottom-[22%] left-[44%] w-24 h-24 border-2 border-red-500/80 rounded pointer-events-none">
          <div className="absolute -top-2 -left-2 w-3 h-3 border-t-2 border-l-2 border-red-400" />
          <div className="absolute -top-2 -right-2 w-3 h-3 border-t-2 border-r-2 border-red-400" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 border-b-2 border-l-2 border-red-400" />
          <div className="absolute -bottom-2 -right-2 w-3 h-3 border-b-2 border-r-2 border-red-400" />
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden flex flex-col shadow-2xl">
      {/* Player Header Controls */}
      <div className="px-4 py-3 bg-surface-border/40 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            Synchronized Vision Feed (30 FPS)
          </h2>
          <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            AOD-Net & ByteTrack Active
          </span>
        </div>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-surface-border">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              viewMode === 'slider'
                ? 'bg-tactical text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Comparison Slider
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              viewMode === 'side-by-side'
                ? 'bg-tactical text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Dual Screen
          </button>
        </div>
      </div>

      {/* Main Video Screen Container */}
      <div className="relative aspect-[16/9] w-full bg-black select-none overflow-hidden">
        {viewMode === 'slider' ? (
          /* Split Wipe Slider Mode */
          <div className="relative w-full h-full">
            {/* Background: AI Clean Stream */}
            <div className="absolute inset-0">
              {cleanFrameUrl ? (
                <img src={cleanFrameUrl} alt="Cleaned AI Stream" className="w-full h-full object-cover" />
              ) : (
                renderSyntheticCanvas(true)
              )}
              {/* Clean Tag */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-tactical/40 text-tactical text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI DE-SMOKED + THERMAL HUD</span>
              </div>
            </div>

            {/* Foreground: Raw Smoky Stream (Clipped by slider position) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%`, borderRight: '2px solid #06b6d4' }}
            >
              <div className="absolute inset-0 w-full h-full min-w-[100vw] md:min-w-full">
                {rawFrameUrl ? (
                  <img src={rawFrameUrl} alt="Raw Smoky Camera Stream" className="w-full h-full object-cover" />
                ) : (
                  renderSyntheticCanvas(false)
                )}
              </div>
              {/* Raw Tag */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-amber-500/40 text-amber-400 text-xs font-mono font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>RAW SMOKY DRONE OPTICS</span>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
              style={{ left: `calc(${sliderPosition}% - 14px)` }}
            >
              <div className="w-7 h-7 rounded-full bg-tactical text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-white text-[10px]">
                ⇄
              </div>
            </div>

            {/* Invisible Slider Input for mouse/touch tracking */}
            <input
              type="range"
              min="5"
              max="95"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              aria-label="Split Comparison Slider"
            />
          </div>
        ) : (
          /* Side-by-Side Dual View */
          <div className="grid grid-cols-2 w-full h-full divide-x divide-surface-border">
            {/* Left: Raw */}
            <div className="relative w-full h-full">
              {rawFrameUrl ? (
                <img src={rawFrameUrl} alt="Raw" className="w-full h-full object-cover" />
              ) : (
                renderSyntheticCanvas(false)
              )}
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded text-[11px] font-mono text-amber-400 border border-amber-500/30">
                RAW FEED (VISIBILITY 12%)
              </div>
            </div>

            {/* Right: AI Clean */}
            <div className="relative w-full h-full">
              {cleanFrameUrl ? (
                <img src={cleanFrameUrl} alt="Clean" className="w-full h-full object-cover" />
              ) : (
                renderSyntheticCanvas(true)
              )}
              <div className="absolute top-3 left-3 bg-slate-950/80 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 border border-cyan-500/30">
                AI DE-HAZED (RECOVERED)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Player Status Bar */}
      <div className="px-4 py-2.5 bg-surface text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-4 border-t border-surface-border">
        <div className="flex items-center gap-4">
          <div>
            SOURCE: <span className="text-slate-200">RTSP/MediaMTX Drone Cam 1</span>
          </div>
          <div>
            RESOLUTION: <span className="text-slate-200">1920x1080 @ 30fps</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            SMOKE EXTINCTION: <span className="text-amber-400 font-bold">{(smokeDensity * 100).toFixed(1)}%</span>
          </div>
          <div>
            CONFIDENCE: <span className="text-emerald-400 font-bold">94.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
