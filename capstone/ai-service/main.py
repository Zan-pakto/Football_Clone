"""
AI Inference Microservice: Project Aegis-Vision
Exposes HTTP and WebSocket endpoints for real-time frame de-smoking & survivor tracking.
"""

import base64
import cv2
import io
import numpy as np
import time
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from models.desmoker import DeSmokerPipeline
from models.tracker import ThermalSurvivorTracker
from utils.smoke_sim import SyntheticSmokeGenerator

app = FastAPI(
    title="Aegis-Vision AI Inference Engine",
    description="Real-time De-Smoking & Victim Localization Pipeline (SIH1417 & SIH1422)",
    version="1.0.0"
)

# Enable CORS for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI pipelines
desmoker = DeSmokerPipeline(device="cpu")
tracker = ThermalSurvivorTracker()
smoke_sim = SyntheticSmokeGenerator()


class SurvivorResponse(BaseModel):
    id: int
    bbox: List[int]
    confidence: float
    pose: str
    status: str
    duration_seconds: int


class InferMetrics(BaseModel):
    smoke_density_index: float
    inference_time_ms: float
    fps: float


class InferenceResult(BaseModel):
    timestamp: float
    metrics: InferMetrics
    survivors: List[SurvivorResponse]
    clean_frame_base64: Optional[str] = None
    raw_frame_base64: Optional[str] = None


@app.get("/")
def root():
    return {
        "service": "Aegis-Vision AI Inference Engine",
        "status": "healthy",
        "tracks": {
            "track_1_smoke_cleaner": "AOD-Net / FFA-Net Active",
            "track_2_thermal_tracker": "YOLOv8 + ByteTrack Active"
        },
        "docs_url": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/api/v1/infer", response_model=InferenceResult)
async def infer_frame(
    frame: UploadFile = File(...),
    apply_overlay: bool = Form(True)
):
    """
    Core AI Inference Endpoint:
    1. Ingests raw smoky frame
    2. Strips smoke via AOD-Net
    3. Detects & tracks survivors via YOLO + ByteTrack
    4. Returns metrics, persistent survivor IDs, and clean image
    """
    start_time = time.perf_counter()
    
    # Read binary image file
    contents = await frame.read()
    nparr = np.frombuffer(contents, np.uint8)
    raw_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if raw_bgr is None:
        raw_bgr = np.zeros((480, 640, 3), dtype=np.uint8)

    # 1. AI Track 1: De-smoking
    clean_bgr, smoke_density = desmoker.clean_frame(raw_bgr)

    # 2. AI Track 2: Thermal survivor tracking
    survivors = tracker.detect_and_track(clean_bgr)

    # 3. Optional tactical HUD overlay
    if apply_overlay:
        display_frame = tracker.draw_overlays(clean_bgr, survivors)
    else:
        display_frame = clean_bgr

    duration_ms = (time.perf_counter() - start_time) * 1000.0
    fps = 1000.0 / max(duration_ms, 1.0)

    # Encode to JPEG Base64
    _, buffer = cv2.imencode(".jpg", display_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    clean_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "timestamp": time.time(),
        "metrics": {
            "smoke_density_index": round(smoke_density, 3),
            "inference_time_ms": round(duration_ms, 2),
            "fps": round(fps, 1)
        },
        "survivors": survivors,
        "clean_frame_base64": f"data:image/jpeg;base64,{clean_base64}",
        "raw_frame_base64": None
    }


@app.get("/api/v1/demo-synthetic-frame")
def generate_demo_pair():
    """
    Generates a synchronized pair of Raw Smoky and Clean De-Smoked frames
    with simulated survivors for instant testing without video capture hardware.
    """
    start_time = time.perf_counter()

    # Generate test scene with room walls and doorway
    w, h = 640, 480
    clean_scene = np.full((h, w, 3), 40, dtype=np.uint8)
    
    # Draw simulated corridor and doorway
    cv2.rectangle(clean_scene, (100, 80), (540, 440), (80, 80, 85), -1)
    cv2.rectangle(clean_scene, (260, 140), (380, 440), (45, 50, 60), -1)  # doorway
    cv2.putText(clean_scene, "ZONE B - CORRIDOR 04", (120, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 2)

    # Add simulated trapped survivor heat signature
    # (Victim near doorway)
    cv2.ellipse(clean_scene, (320, 390), (45, 25), 0, 0, 360, (230, 240, 255), -1)
    cv2.circle(clean_scene, (290, 385), 18, (255, 250, 220), -1)

    # Generate synthetic smoke overlay
    smoky_scene = smoke_sim.apply_smoke(clean_scene, density=0.82)

    # Process through pipeline
    recovered_scene, smoke_density = desmoker.clean_frame(smoky_scene)
    survivors = tracker.detect_and_track(recovered_scene)
    hud_scene = tracker.draw_overlays(recovered_scene, survivors)

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    _, raw_buf = cv2.imencode(".jpg", smoky_scene, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    _, clean_buf = cv2.imencode(".jpg", hud_scene, [int(cv2.IMWRITE_JPEG_QUALITY), 85])

    return {
        "timestamp": time.time(),
        "metrics": {
            "smoke_density_index": round(smoke_density, 3),
            "inference_time_ms": round(duration_ms, 2),
            "fps": round(1000.0 / max(duration_ms, 1.0), 1)
        },
        "survivors": survivors,
        "raw_frame_base64": f"data:image/jpeg;base64,{base64.b64encode(raw_buf).decode('utf-8')}",
        "clean_frame_base64": f"data:image/jpeg;base64,{base64.b64encode(clean_buf).decode('utf-8')}"
    }


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    High-frequency WebSocket endpoint for bi-directional live frame streaming.
    Receives JPEG binary bytes -> processes -> returns telemetry JSON & clean frame.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            raw = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if raw is not None:
                clean, density = desmoker.clean_frame(raw)
                survivors = tracker.detect_and_track(clean)
                hud = tracker.draw_overlays(clean, survivors)

                _, enc = cv2.imencode(".jpg", hud, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                await websocket.send_json({
                    "timestamp": time.time(),
                    "smoke_density": round(density, 3),
                    "survivors": survivors,
                    "frame_base64": base64.b64encode(enc).decode("utf-8")
                })
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
