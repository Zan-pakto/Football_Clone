'use client';

import { useEffect, useState, useRef } from 'react';
import { TelemetryPacket, Survivor, RoomPolygon, DroneTelemetry } from '../types';

const DEFAULT_ROOMS: RoomPolygon[] = [
  { id: 'ROOM-101', name: 'North Conference Hall', floor: 1, bounds: { x: 5, y: 10, width: 35, height: 35 }, hazardLevel: 'SAFE', smokeDensity: 0.15 },
  { id: 'ROOM-102', name: 'Corridor Alpha', floor: 1, bounds: { x: 40, y: 10, width: 20, height: 80 }, hazardLevel: 'MODERATE', smokeDensity: 0.48 },
  { id: 'ROOM-103', name: 'Server & Battery Room', floor: 1, bounds: { x: 60, y: 10, width: 35, height: 40 }, hazardLevel: 'CRITICAL', smokeDensity: 0.89 },
  { id: 'ROOM-104', name: 'South Storage & Stairwell', floor: 1, bounds: { x: 5, y: 55, width: 35, height: 35 }, hazardLevel: 'MODERATE', smokeDensity: 0.54 },
  { id: 'ROOM-105', name: 'Medical Emergency Bay', floor: 1, bounds: { x: 60, y: 55, width: 35, height: 35 }, hazardLevel: 'SAFE', smokeDensity: 0.12 },
];

export function useLiveStream() {
  const [connected, setConnected] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryPacket>({
    type: 'STREAM_UPDATE',
    timestamp: Date.now(),
    fps: 30,
    latencyMs: 38,
    smokeDensity: 0.82,
    drone: {
      droneId: 'DRONE-ALPHA-01',
      altitudeMeters: 2.1,
      batteryPercent: 84,
      headingDegrees: 135,
      currentFloor: 1,
      location: { x: 74, y: 28 },
      connectionStatus: 'ONLINE',
    },
    survivors: [
      {
        id: 101,
        bbox: [180, 220, 260, 420],
        confidence: 0.94,
        pose: 'prone',
        status: 'trapped',
        durationSeconds: 145,
        roomId: 'ROOM-103',
        roomName: 'Server & Battery Room',
        floor: 1,
        floorCoords: { x: 76, y: 30 },
        lastSeenTimestamp: Date.now(),
      },
    ],
    rooms: DEFAULT_ROOMS,
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:4000/ws/live';
    let fallbackInterval: NodeJS.Timeout | null = null;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          if (fallbackInterval) clearInterval(fallbackInterval);
        };

        ws.onmessage = (event) => {
          try {
            const data: TelemetryPacket = JSON.parse(event.data);
            setTelemetry(data);
          } catch {
            // parsing error
          }
        };

        ws.onclose = () => {
          setConnected(false);
          startFallback();
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setConnected(false);
          ws.close();
        };
      } catch {
        startFallback();
      }
    }

    function startFallback() {
      if (fallbackInterval) return;
      fallbackInterval = setInterval(() => {
        setTelemetry((prev) => {
          const t = Date.now() / 2500;
          const nextDroneX = 70 + Math.sin(t) * 8;
          const nextDroneY = 28 + Math.cos(t) * 5;

          return {
            ...prev,
            timestamp: Date.now(),
            fps: Math.round(29 + Math.sin(t * 2) * 2),
            latencyMs: Math.round(35 + Math.cos(t) * 8),
            smokeDensity: Math.min(0.95, Math.max(0.65, 0.8 + Math.sin(t) * 0.1)),
            drone: {
              ...prev.drone,
              location: { x: nextDroneX, y: nextDroneY },
              headingDegrees: (prev.drone.headingDegrees + 1) % 360,
            },
            survivors: prev.survivors.map((s) => ({
              ...s,
              durationSeconds: s.durationSeconds + 1,
            })),
          };
        });
      }, 1000);
    }

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  const markSurvivorStatus = (id: number, status: 'trapped' | 'moving' | 'rescued') => {
    setTelemetry((prev) => ({
      ...prev,
      survivors: prev.survivors.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  };

  return { connected, telemetry, markSurvivorStatus };
}
