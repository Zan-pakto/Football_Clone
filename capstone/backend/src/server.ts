import fastifyCors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import Fastify from 'fastify';
import { AIBridgeService } from './services/aiBridge.js';
import { SpatialMapperService } from './services/spatialMapper.js';
import { DroneTelemetry, TelemetryPacket } from './types/index.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const server = Fastify({ logger: true });

const spatialMapper = new SpatialMapperService();
const aiBridge = new AIBridgeService();

// Register plugins
await server.register(fastifyCors, { origin: '*' });
await server.register(fastifyWebsocket);

// Drone simulated telemetry state
let droneState: DroneTelemetry = {
  droneId: 'DRONE-SCOUT-01',
  altitudeMeters: 2.3,
  batteryPercent: 88,
  headingDegrees: 142,
  currentFloor: 1,
  location: { x: 70, y: 25 },
  connectionStatus: 'ONLINE',
};

// ---------------- REST ENDPOINTS ----------------

server.get('/health', async () => {
  return { status: 'healthy', timestamp: Date.now(), service: 'Aegis Streaming Gateway' };
});

server.get('/api/floorplan', async () => {
  return {
    floor: 1,
    building: 'Sector-7 Industrial Complex',
    rooms: spatialMapper.getRooms(),
  };
});

server.get('/api/survivors', async () => {
  return {
    count: spatialMapper.getSurvivors().length,
    survivors: spatialMapper.getSurvivors(),
  };
});

server.post<{ Params: { id: string }; Body: { status: 'trapped' | 'moving' | 'rescued' } }>(
  '/api/survivors/:id/status',
  async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const { status } = request.body;
    const success = spatialMapper.updateSurvivorStatus(id, status);
    if (!success) {
      return reply.code(404).send({ error: 'Survivor ID not found' });
    }
    return { success: true, id, status };
  }
);

// ---------------- WEBSOCKET STREAMING ----------------

server.register(async function (fastify) {
  fastify.get('/ws/live', { websocket: true }, (connection /* SocketStream */, req) => {
    server.log.info('Client connected to live tactical stream');

    const interval = setInterval(async () => {
      try {
        // Fetch latest processed AI frame
        const aiData = await aiBridge.fetchLatestProcessedFrame();

        // Slightly drift simulated drone path for realistic telemetry
        const t = Date.now() / 4000;
        droneState.location.x = 65 + Math.sin(t) * 8;
        droneState.location.y = 25 + Math.cos(t) * 6;
        droneState.batteryPercent = Math.max(12, 88 - Math.floor((Date.now() % 1000000) / 15000));

        // Sync AI detections with spatial floor coordinates
        const activeSurvivors = spatialMapper.syncAITracks(aiData.survivors, droneState.location);

        const packet: TelemetryPacket = {
          type: 'STREAM_UPDATE',
          timestamp: Date.now(),
          fps: aiData.fps,
          latencyMs: aiData.latencyMs,
          smokeDensity: aiData.smokeDensity,
          rawFrameBase64: aiData.rawFrameBase64,
          cleanFrameBase64: aiData.cleanFrameBase64,
          drone: { ...droneState },
          survivors: activeSurvivors,
          rooms: spatialMapper.getRooms(),
        };

        if (connection.socket.readyState === connection.socket.OPEN) {
          connection.socket.send(JSON.stringify(packet));
        }
      } catch (err) {
        server.log.error(err);
      }
    }, 100); // 10 updates per second

    connection.socket.on('close', () => {
      clearInterval(interval);
      server.log.info('Client disconnected from tactical stream');
    });
  });
});

// Start Fastify server
const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Aegis Streaming Gateway running at http://localhost:${PORT}`);
    console.log(`📡 WebSocket stream accessible at ws://localhost:${PORT}/ws/live`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
