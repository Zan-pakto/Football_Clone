'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, UserCheck, Flame, MapPin } from 'lucide-react';
import { Survivor } from '../types';

interface SurvivorAlertsProps {
  survivors: Survivor[];
  onUpdateStatus: (id: number, status: 'trapped' | 'moving' | 'rescued') => void;
}

export const SurvivorAlerts: React.FC<SurvivorAlertsProps> = ({
  survivors,
  onUpdateStatus,
}) => {
  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden flex flex-col shadow-2xl">
      <div className="px-4 py-3 bg-surface-border/40 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            Real-Time Survivor Localization Log
          </h2>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {survivors.filter((s) => s.status === 'trapped').length} Trapped
        </span>
      </div>

      <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
        {survivors.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No active heat signatures detected in current sector.
          </div>
        ) : (
          survivors.map((s) => {
            const isTrapped = s.status === 'trapped';
            const isRescued = s.status === 'rescued';

            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isRescued
                    ? 'border-emerald-500/40 bg-emerald-950/20 opacity-70'
                    : isTrapped
                    ? 'border-rose-500/60 bg-rose-950/30'
                    : 'border-amber-500/50 bg-amber-950/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRescued
                          ? 'bg-emerald-400'
                          : isTrapped
                          ? 'bg-rose-500 animate-ping'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-sm font-mono font-bold text-slate-100">
                      VICTIM #{s.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        isRescued
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isTrapped
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Confidence: <span className="text-slate-200">{(s.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-tactical" />
                    <span className="text-slate-200 font-medium">
                      {s.roomName || 'Corridor Zone'} ({s.roomId || 'UNASSIGNED'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trapped: {s.durationSeconds}s</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-2">
                  {!isRescued ? (
                    <>
                      <button
                        onClick={() => onUpdateStatus(s.id, 'rescued')}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Rescued
                      </button>
                      <button
                        onClick={() => onUpdateStatus(s.id, isTrapped ? 'moving' : 'trapped')}
                        className="px-2.5 py-1 text-xs font-medium rounded bg-surface border border-surface-border text-slate-300 hover:text-white transition"
                      >
                        Toggle Status
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                      <UserCheck className="w-3.5 h-3.5" />
                      Evacuated to Medical Bay
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
