/**
 * AI Bridge Service
 * Handles high-throughput communication with the Python FastAPI AI microservice (:8000).
 * Features automatic fallback to keep the streaming pipeline alive even if the AI container is restarting.
 */

export class AIBridgeService {
  private aiUrl: string;

  constructor(aiUrl: string = process.env.AI_SERVICE_URL || 'http://localhost:8000') {
    this.aiUrl = aiUrl;
  }

  public async fetchLatestProcessedFrame(): Promise<{
    rawFrameBase64: string;
    cleanFrameBase64: string;
    smokeDensity: number;
    fps: number;
    latencyMs: number;
    survivors: any[];
  }> {
    try {
      const response = await fetch(`${this.aiUrl}/api/v1/demo-synthetic-frame`, {
        signal: AbortSignal.timeout(1200),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return {
          rawFrameBase64: data.raw_frame_base64,
          cleanFrameBase64: data.clean_frame_base64,
          smokeDensity: data.metrics.smoke_density_index,
          fps: data.metrics.fps,
          latencyMs: data.metrics.inference_time_ms,
          survivors: data.survivors || [],
        };
      }
    } catch {
      // AI Service offline or starting up - use graceful fallback
    }

    // Graceful offline mock feed for seamless frontend development
    return {
      rawFrameBase64: '',
      cleanFrameBase64: '',
      smokeDensity: 0.72 + (Math.sin(Date.now() / 2000) * 0.1),
      fps: 32.4,
      latencyMs: 24.6,
      survivors: [
        {
          id: 101,
          bbox: [220, 180, 310, 410],
          confidence: 0.93,
          pose: 'prone',
          status: 'trapped',
          duration_seconds: Math.floor((Date.now() / 1000) % 300),
        },
      ],
    };
  }
}
