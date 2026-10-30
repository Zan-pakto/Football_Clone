import { RoomPolygon, Survivor } from '../types/index.js';

/**
 * Spatial Floorplan Service
 * Maps camera viewpoints, bounding boxes, and drone coordinates to 2.5D indoor room blueprints.
 */
export class SpatialMapperService {
  private rooms: RoomPolygon[] = [
    {
      id: 'ROOM-101',
      name: 'North Conference Hall',
      floor: 1,
      bounds: { x: 5, y: 10, width: 35, height: 35 },
      hazardLevel: 'SAFE',
      smokeDensity: 0.12,
    },
    {
      id: 'ROOM-102',
      name: 'Corridor Alpha',
      floor: 1,
      bounds: { x: 40, y: 10, width: 20, height: 80 },
      hazardLevel: 'MODERATE',
      smokeDensity: 0.45,
    },
    {
      id: 'ROOM-103',
      name: 'Server & Battery Room',
      floor: 1,
      bounds: { x: 60, y: 10, width: 35, height: 40 },
      hazardLevel: 'CRITICAL',
      smokeDensity: 0.88,
    },
    {
      id: 'ROOM-104',
      name: 'South Storage & Exit Stairwell',
      floor: 1,
      bounds: { x: 5, y: 55, width: 35, height: 35 },
      hazardLevel: 'MODERATE',
      smokeDensity: 0.52,
    },
    {
      id: 'ROOM-105',
      name: 'Emergency Medical Bay',
      floor: 1,
      bounds: { x: 60, y: 55, width: 35, height: 35 },
      hazardLevel: 'SAFE',
      smokeDensity: 0.18,
    },
  ];

  private survivorStore: Map<number, Survivor> = new Map();

  constructor() {
    // Seed initial mock survivor for demonstration
    this.survivorStore.set(101, {
      id: 101,
      bbox: [180, 220, 260, 420],
      confidence: 0.94,
      pose: 'prone',
      status: 'trapped',
      durationSeconds: 124,
      roomId: 'ROOM-103',
      roomName: 'Server & Battery Room',
      floor: 1,
      floorCoords: { x: 74, y: 28 },
      lastSeenTimestamp: Date.now(),
    });
  }

  public getRooms(): RoomPolygon[] {
    return this.rooms;
  }

  public getSurvivors(): Survivor[] {
    return Array.from(this.survivorStore.values());
  }

  public updateSurvivorStatus(id: number, status: 'trapped' | 'moving' | 'rescued'): boolean {
    const s = this.survivorStore.get(id);
    if (!s) return false;
    s.status = status;
    return true;
  }

  /**
   * Projects a detected video bounding box + drone position into floor coordinates
   */
  public resolveRoomForCoordinates(x: number, y: number): { roomId: string; roomName: string } {
    for (const room of this.rooms) {
      const b = room.bounds;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return { roomId: room.id, roomName: room.name };
      }
    }
    return { roomId: 'CORRIDOR', roomName: 'General Hallway' };
  }

  public syncAITracks(aiDetections: any[], droneCoords: { x: number; y: number }): Survivor[] {
    const now = Date.now();
    for (const d of aiDetections) {
      const id = d.id;
      const existing = this.survivorStore.get(id);

      // Estimate position relative to drone position
      const estimatedX = Math.min(95, Math.max(5, droneCoords.x + ((d.bbox[0] + d.bbox[2]) / 2 / 640 - 0.5) * 15));
      const estimatedY = Math.min(95, Math.max(5, droneCoords.y + ((d.bbox[1] + d.bbox[3]) / 2 / 480 - 0.5) * 15));
      const room = this.resolveRoomForCoordinates(estimatedX, estimatedY);

      if (existing) {
        existing.bbox = d.bbox;
        existing.confidence = d.confidence;
        existing.pose = d.pose;
        existing.status = d.status;
        existing.durationSeconds = d.duration_seconds;
        existing.lastSeenTimestamp = now;
        existing.floorCoords = { x: Math.round(estimatedX), y: Math.round(estimatedY) };
        existing.roomId = room.roomId;
        existing.roomName = room.roomName;
      } else {
        this.survivorStore.set(id, {
          id: d.id,
          bbox: d.bbox,
          confidence: d.confidence,
          pose: d.pose,
          status: d.status,
          durationSeconds: d.duration_seconds || 1,
          roomId: room.roomId,
          roomName: room.roomName,
          floor: 1,
          floorCoords: { x: Math.round(estimatedX), y: Math.round(estimatedY) },
          lastSeenTimestamp: now,
        });
      }
    }
    return this.getSurvivors();
  }
}
