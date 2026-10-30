export interface Survivor {
  id: number;
  bbox: [number, number, number, number];
  confidence: number;
  pose: 'prone' | 'standing';
  status: 'trapped' | 'moving' | 'rescued';
  durationSeconds: number;
  roomId?: string;
  roomName?: string;
  floor: number;
  floorCoords: { x: number; y: number };
  lastSeenTimestamp: number;
}

export interface RoomPolygon {
  id: string;
  name: string;
  floor: number;
  bounds: { x: number; y: number; width: number; height: number };
  hazardLevel: 'SAFE' | 'MODERATE' | 'CRITICAL';
  smokeDensity: number;
}

export interface DroneTelemetry {
  droneId: string;
  altitudeMeters: number;
  batteryPercent: number;
  headingDegrees: number;
  currentFloor: number;
  location: { x: number; y: number };
  connectionStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
}

export interface TelemetryPacket {
  type: string;
  timestamp: number;
  fps: number;
  latencyMs: number;
  smokeDensity: number;
  rawFrameBase64?: string;
  cleanFrameBase64?: string;
  drone: DroneTelemetry;
  survivors: Survivor[];
  rooms: RoomPolygon[];
}
