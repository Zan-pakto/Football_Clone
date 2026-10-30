# Project Aegis-Vision: AI-Powered Search & Rescue De-Smoking & Victim Localization System
**SIH Problem Statements: SIH1417 & SIH1422 (Capstone Project)**

> **Intelligent real-time de-smoking / de-hazing algorithm and thermal identification & localization of victims in zero-visibility environments (building fires, chemical hazards, subway collapses, avalanches).**

---

## 🎯 Executive Summary
During structural fires and collapsed buildings, toxic smoke, dust, and particulate scattering blind standard scout drone and firefighter helmet cameras. This system operates as **"Digital X-Ray Glasses"**:
1. **Real-time De-Smoking & De-Hazing**: Removes smoke and aerosol interference at 30 FPS with sub-300ms latency.
2. **Thermal Human Identification & Persistent Tracking**: Detects human body heat signatures using YOLOv8/v11 + ByteTrack to prevent duplicate victim counts.
3. **Synchronized Tactical Dashboard**: Provides side-by-side video (Raw Smoky vs. AI-Cleaned) and maps survivor locations onto an interactive 2.5D indoor floor plan.

---

## 📂 Repository Structure

```
capstone/
├── README.md                 # Project Overview & Quickstart Guide
├── ARCHITECTURE.md           # End-to-end System Architecture & Data Contracts
├── WORK_DIVISION.md          # Team Task Allocation & Sprint Milestones
├── docker-compose.yml        # Orchestration (MediaMTX, Redis, PostGIS, Backend, AI, Frontend)
├── .env.example              # Centralized environment variable template
│
├── frontend/                 # Tactical Command Web Dashboard (Next.js 15, TypeScript, Tailwind)
│   ├── src/
│   │   ├── app/              # Next.js app router & mission control dashboard
│   │   ├── components/       # DualStreamPlayer, FloorPlanMap, TelemetryPanel, SurvivorAlerts
│   │   ├── hooks/            # WebSocket live telemetry & stream hook
│   │   └── types/            # TypeScript schemas & contracts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Real-Time Streaming Gateway (Node.js, TypeScript, Fastify, WebSocket)
│   ├── src/
│   │   ├── server.ts         # Fastify HTTP & WebSocket server
│   │   ├── routes/           # Stream ingestion, survivor queries, telemetry
│   │   ├── services/         # AI Bridge, Redis Pub/Sub, Floorplan Spatial Mapper
│   │   └── types/            # Message packet definitions
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/               # AI Inference Pipeline (Python, FastAPI, PyTorch, YOLOv8)
│   ├── main.py               # FastAPI server (/infer, /ws/stream, /health)
│   ├── models/
│   │   ├── desmoker.py       # AI Track 1: AOD-Net / De-smoking pipeline
│   │   └── tracker.py        # AI Track 2: Thermal human detection & ByteTrack
│   ├── utils/                # Synthetic smoke generator & frame processing
│   └── requirements.txt
│
└── simulator/                # Virtual Video & Drone Stream Feeder
    ├── stream_feeder.py      # Simulates drone/bodycam RTSP stream with synthetic smoke
    ├── mediamtx.yml          # MediaMTX zero-dependency RTSP/WebRTC server config
    └── requirements.txt
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **Python**: 3.10+ (tested on v3.14)
- **Docker & Docker Compose** (optional for one-command containerized launch)

### 2. Running Individual Services (Local Dev Mode)

#### A. AI Service (Python FastAPI)
```bash
cd ai-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate
pip install -r requirements.txt
python main.py
# Runs at http://localhost:8000 (Docs: http://localhost:8000/docs)
```

#### B. Streaming Backend (Node.js + Fastify + WebSocket)
```bash
cd backend
npm install
npm run dev
# Runs at http://localhost:4000 (WebSocket: ws://localhost:4000/ws/live)
```

#### C. Command Dashboard (Next.js Frontend)
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

#### D. Virtual RTSP Stream Feeder (Optional Drone Simulator)
```bash
cd simulator
python stream_feeder.py
```

---

## 👥 How to Divide Work
See [WORK_DIVISION.md](file:///d:/nigeria/capstone/WORK_DIVISION.md) for clear module separation:
- **Member 1 (AI Track 1 - Smoke Cleaner)**: Focus on `ai-service/models/desmoker.py` (AOD-Net, FFA-Net, real-time FPS optimization).
- **Member 2 (AI Track 2 - Thermal Tracker)**: Focus on `ai-service/models/tracker.py` (YOLOv8 thermal weights, ByteTrack survivor ID tracking).
- **Member 3 (Streaming & Backend Gateway)**: Focus on `backend/` (Fastify WebSocket, RTSP ingestion via FFmpeg, Redis pub/sub, PostGIS mapping).
- **Member 4 (Frontend Tactical UI/UX)**: Focus on `frontend/` (Next.js dual video slider, Leaflet/Canvas 2.5D indoor floor plan, audio/visual alerts).
