# 👥 Work Division & Team Allocation Plan
**Project Aegis-Vision: AI De-Smoking & Victim Localization System**
*(SIH1417 & SIH1422 Capstone Project)*

This document breaks down the project into 4 decoupled, independent work packages so team members can develop concurrently without blocking each other.

---

## 🏗️ Architecture Contract Summary
Before diving into individual roles, here are the shared contracts that keep all components in sync:

```
[Virtual Feeder / Drone]
       │ RTSP (rtsp://localhost:8554/live)
       ▼
[MediaMTX / Backend Gateway (Port 4000)] 
       │ WebSocket / HTTP Frame Buffer
       ▼
[AI Microservice (Port 8000)]
  ├── Track 1: De-smoking (AOD-Net / PyTorch)
  └── Track 2: Thermal Tracking (YOLOv8 + ByteTrack)
       │ JSON Metadata & Clean Binary Frame
       ▼
[Backend Gateway (Port 4000)]
       │ WebSocket broadcast (Telemetry + Bounding Boxes + Survivors)
       ▼
[Frontend Command Dashboard (Port 3000)]
  ├── Dual Video Player (Raw vs Clean Side-by-Side)
  ├── 2.5D Interactive Indoor Floor Plan
  └── Real-time Incident & Survivor Alert Log
```

---

## 🧑‍💻 Track 1: AI Track 1 — Real-Time De-Smoking / De-Hazing
**Directory**: `capstone/ai-service/models/desmoker.py` & training notebooks
**Assigned To**: AI Specialist / Vision Engineer

### Responsibilities:
1. **Model Implementation**:
   - Implement lightweight **AOD-Net** (All-in-One Dehazing Network) or **FFA-Net** in PyTorch.
   - Optimize for inference: use Half Precision (`torch.cuda.amp` or TensorRT/ONNX Runtime).
   - Target benchmark: $\le 20\text{ ms}$ per frame on GPU or $\le 60\text{ ms}$ on CPU ($>15$ to $30\text{ FPS}$).
2. **Loss Functions & Training Pipeline**:
   - Formulate loss function combining:
     $$\mathcal{L}_{total} = \lambda_1 \mathcal{L}_1 + \lambda_2 (1 - \text{SSIM}) + \lambda_3 \mathcal{L}_{perceptual}$$
   - Curate/generate synthetic smoky datasets (RESIDE, Foggy Cityscapes, Fire/Smoke drill dataset).
3. **Inference Interface**:
   - Implement `class DeSmoker` with method `clean_frame(frame: np.ndarray) -> np.ndarray`.
   - Ensure clean frame preserves edge boundaries needed by rescuers (doors, walls, stairs).

---

## 🧑‍💻 Track 2: AI Track 2 — Thermal Human Detection & Survivor Tracking
**Directory**: `capstone/ai-service/models/tracker.py`
**Assigned To**: AI/ML Engineer (Detection & Tracking)

### Responsibilities:
1. **Human Heat Signature Detection**:
   - Integrate **Ultralytics YOLOv8 / YOLOv11** (`yolov8n-pose` or `yolov8n` fine-tuned on thermal FLIR / KAIST dataset).
   - Output normalized bounding boxes `[x1, y1, x2, y2]`, confidence score, and estimated body pose (standing, prone/trapped).
2. **Persistent Survivor Tracking (ByteTrack)**:
   - Implement ByteTrack association to assign persistent, non-duplicate `survivor_id`s across frame drops and occlusion.
   - Detect motionless status (e.g., survivor trapped or unconscious for $>10\text{ s}$).
3. **Inference Interface**:
   - Implement `class SurvivorTracker` with method `detect_and_track(frame: np.ndarray) -> List[SurvivorData]`.
   - Output JSON structure:
     ```json
     {
       "survivor_id": 104,
       "bbox": [120, 240, 180, 390],
       "confidence": 0.92,
       "status": "trapped", // "moving" | "prone" | "trapped"
       "estimated_room": "Room-204"
     }
     ```

---

## 🧑‍💻 Track 3: Streaming Ingestion & Backend Gateway
**Directory**: `capstone/backend/`
**Assigned To**: Backend / Systems Engineer

### Responsibilities:
1. **Stream Ingestion & Broadcast Pipeline**:
   - Ingest RTSP stream (`rtsp://localhost:8554/live`) using FFmpeg / fluent-ffmpeg pipe.
   - Manage video buffer and pump frames to the Python AI service via async WebSocket / HTTP.
   - Fastify WebSocket broadcast (`/ws/live`) to stream synchronous raw and processed frames + telemetry to frontend.
2. **Spatial Coordinate & Floorplan Mapping**:
   - Convert drone/camera viewport telemetry (FOV, pitch, yaw, camera location) to indoor (x, y) coordinates on the building floor plan.
   - Store room boundary polygons and log survivor discoveries in PostgreSQL / PostGIS or in-memory fallback.
3. **Redis Real-time Pub/Sub**:
   - Maintain active survivor state, coordinate caching, and instantaneous hazard alerts.
   - REST API endpoints for rescue teams (`GET /api/survivors`, `GET /api/floorplans`, `POST /api/incidents`).

---

## 🧑‍💻 Track 4: Command Tactical Web Dashboard (Frontend)
**Directory**: `capstone/frontend/`
**Assigned To**: Frontend & UI/UX Engineer

### Responsibilities:
1. **Side-by-Side Synchronized Video Player**:
   - Dual-canvas / dual-video view: **Raw Smoky Feed** on the left, **AI De-Smoked + Thermal Bounding Boxes** on the right.
   - Interactive split-screen slider (wipe across raw vs. enhanced feed in real time).
2. **Interactive 2.5D Indoor Floor Plan Visualizer**:
   - Canvas / Leaflet.js indoor map showing building layout, rooms, exits, hazard heatmaps.
   - Live pulsating pins for detected survivors with ID, trapped duration, and thermal status.
   - Click a survivor pin to focus video feed or trigger rescue dispatched status.
3. **Mission Control Telemetry & HUD**:
   - FPS counter, smoke density index meter, system latency HUD ($<300\text{ms}$ indicator).
   - Audio-visual alert banner when a new victim is detected in a zero-visibility room.
   - Export incident summary report (PDF / JSON) for incident commanders.

---

## 📅 Suggested Sprint Milestones

| Sprint | Focus | Deliverable |
|---|---|---|
| **Sprint 1 (Days 1–3)** | **Foundation & Contracts** | All 4 services running stubs, WebSocket ping/pong verified, mock video stream flowing. |
| **Sprint 2 (Days 4–7)** | **Model Integration & Player** | AOD-Net baseline cleaning frames, YOLO detecting humans, dual video player rendering live feed. |
| **Sprint 3 (Days 8–11)** | **Tracking & Floorplan Mapping** | ByteTrack IDs stable, indoor coordinate conversion plotting pins on 2.5D floor plan. |
| **Sprint 4 (Days 12–14)** | **Optimization & Polish** | End-to-end latency $<300\text{ms}$, Docker compose 1-click startup, demo presentation ready. |
