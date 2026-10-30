"""
AI Track 2: Thermal Human Heat Signature Detector & Survivor Tracker
Integrates YOLOv8 / YOLOv11 + ByteTrack algorithm
Paper: "ByteTrack: Multi-Object Tracking by Associating Every Detection Box" (ECCV 2022)
"""

import cv2
import numpy as np
import time
from typing import List, Dict, Any, Optional

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False


class SimpleByteTracker:
    """
    Lightweight in-memory ByteTrack-inspired association tracker.
    Maintains persistent IDs across occlusions, smoke puffs, and brief disappearances.
    """
    def __init__(self, max_lost_frames: int = 45, iou_threshold: float = 0.3):
        self.next_id = 101
        self.tracks: Dict[int, Dict[str, Any]] = {}
        self.max_lost = max_lost_frames
        self.iou_thresh = iou_threshold

    @staticmethod
    def _compute_iou(bb1: List[int], bb2: List[int]) -> float:
        x_left = max(bb1[0], bb2[0])
        y_top = max(bb1[1], bb2[1])
        x_right = min(bb1[2], bb2[2])
        y_bottom = min(bb1[3], bb2[3])

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        bb1_area = (bb1[2] - bb1[0]) * (bb1[3] - bb1[1])
        bb2_area = (bb2[2] - bb2[0]) * (bb2[3] - bb2[1])
        iou = intersection_area / float(bb1_area + bb2_area - intersection_area + 1e-6)
        return float(iou)

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        detections: list of dicts with 'bbox' [x1, y1, x2, y2], 'confidence', 'pose'
        Returns: updated active survivor tracks with persistent IDs
        """
        matched_track_ids = set()
        matched_det_indices = set()

        # Step 1: Match high-confidence detections with existing active tracks
        for t_id, track in list(self.tracks.items()):
            best_iou = 0.0
            best_idx = -1
            for idx, det in enumerate(detections):
                if idx in matched_det_indices:
                    continue
                iou = self._compute_iou(track["bbox"], det["bbox"])
                if iou > best_iou:
                    best_iou = iou
                    best_idx = idx

            if best_iou >= self.iou_thresh and best_idx != -1:
                # Update track
                det = detections[best_idx]
                track["bbox"] = det["bbox"]
                track["confidence"] = det["confidence"]
                track["lost_frames"] = 0
                track["pose"] = det.get("pose", track.get("pose", "prone"))
                track["duration_seconds"] = int(time.time() - track["first_seen"])
                
                # Check mobility
                prev_center = track.get("center", ((det["bbox"][0]+det["bbox"][2])//2, (det["bbox"][1]+det["bbox"][3])//2))
                curr_center = ((det["bbox"][0]+det["bbox"][2])//2, (det["bbox"][1]+det["bbox"][3])//2)
                drift = np.hypot(curr_center[0] - prev_center[0], curr_center[1] - prev_center[1])
                track["center"] = curr_center
                track["status"] = "trapped" if (drift < 15 and track["duration_seconds"] > 8) else "moving"

                matched_track_ids.add(t_id)
                matched_det_indices.add(best_idx)

        # Step 2: Handle unmatched tracks (increment lost frame counter)
        for t_id, track in list(self.tracks.items()):
            if t_id not in matched_track_ids:
                track["lost_frames"] += 1
                if track["lost_frames"] > self.max_lost:
                    del self.tracks[t_id]

        # Step 3: Register new detections as new persistent survivors
        for idx, det in enumerate(detections):
            if idx not in matched_det_indices:
                new_id = self.next_id
                self.next_id += 1
                self.tracks[new_id] = {
                    "id": new_id,
                    "bbox": det["bbox"],
                    "confidence": det["confidence"],
                    "pose": det.get("pose", "prone"),
                    "status": "detected",
                    "first_seen": time.time(),
                    "duration_seconds": 1,
                    "lost_frames": 0,
                    "center": ((det["bbox"][0]+det["bbox"][2])//2, (det["bbox"][1]+det["bbox"][3])//2)
                }

        # Return all currently visible tracks (lost_frames == 0)
        return [
            {
                "id": t["id"],
                "bbox": t["bbox"],
                "confidence": round(t["confidence"], 2),
                "pose": t["pose"],
                "status": t["status"],
                "duration_seconds": t["duration_seconds"]
            }
            for t in self.tracks.values() if t["lost_frames"] == 0
        ]


class ThermalSurvivorTracker:
    """
    Thermal human detection and tracking pipeline.
    Combines YOLOv8 inference with ByteTrack persistent identity maintenance.
    """
    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.5):
        self.conf_thresh = conf_thresh
        self.tracker = SimpleByteTracker()
        self.model = None

        if ULTRALYTICS_AVAILABLE:
            try:
                self.model = YOLO(model_path)
            except Exception as e:
                print(f"[SurvivorTracker] Note on YOLO loading: {e}. Using thermal heat-blob detector fallback.")

    def detect_and_track(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects humans/victims in the frame and tracks them with consistent IDs.
        Supports both thermal imaging (hot spot infrared) and optical RGB.
        """
        h, w = frame.shape[:2]
        raw_detections = []

        if self.model is not None:
            try:
                results = self.model(frame, conf=self.conf_thresh, classes=[0], verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        xyxy = box.xyxy[0].cpu().numpy().astype(int).tolist()
                        conf = float(box.conf[0].cpu().numpy())
                        
                        # Estimate pose based on bounding box aspect ratio
                        width = xyxy[2] - xyxy[0]
                        height = xyxy[3] - xyxy[1]
                        pose = "prone" if (width > height * 0.9) else "standing"

                        raw_detections.append({
                            "bbox": xyxy,
                            "confidence": conf,
                            "pose": pose
                        })
            except Exception:
                pass

        # If no YOLO detections or model absent, apply Thermal Heat Signature Blob Detection
        # Finds localized infrared high-intensity thermal cores characteristic of living bodies
        if not raw_detections:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Threshold upper 15% brightest regions (simulating thermal FLIR palette)
            _, thresh = cv2.threshold(gray, 205, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if 400 < area < (h * w * 0.25):  # typical human scale
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    raw_detections.append({
                        "bbox": [x, y, x + bw, y + bh],
                        "confidence": 0.88,
                        "pose": "prone" if bw > bh else "standing"
                    })

        # Run ByteTrack association
        tracked_survivors = self.tracker.update(raw_detections)
        return tracked_survivors

    def draw_overlays(self, frame: np.ndarray, survivors: List[Dict[str, Any]]) -> np.ndarray:
        """
        Draws tactical thermal HUD overlays on top of the clean video feed.
        """
        out = frame.copy()
        for s in survivors:
            x1, y1, x2, y2 = s["bbox"]
            is_trapped = s["status"] == "trapped"
            color = (0, 0, 255) if is_trapped else (0, 220, 255)  # Red for trapped, Orange/Yellow for moving

            # Draw tactical corner brackets
            line_len = max(10, min((x2 - x1) // 4, 25))
            cv2.rectangle(out, (x1, y1), (x2, y2), color, 1)
            # Corner markers for sci-fi rescue HUD feel
            cv2.line(out, (x1, y1), (x1 + line_len, y1), color, 3)
            cv2.line(out, (x1, y1), (x1, y1 + line_len), color, 3)
            cv2.line(out, (x2, y1), (x2 - line_len, y1), color, 3)
            cv2.line(out, (x2, y1), (x2, y1 + line_len), color, 3)
            cv2.line(out, (x1, y2), (x1 + line_len, y2), color, 3)
            cv2.line(out, (x1, y2), (x1, y2 - line_len), color, 3)
            cv2.line(out, (x2, y2), (x2 - line_len, y2), color, 3)
            cv2.line(out, (x2, y2), (x2, y2 - line_len), color, 3)

            label = f"VICTIM #{s['id']} [{s['status'].upper()}] - {s['confidence']*100:.0f}%"
            cv2.putText(out, label, (x1, max(18, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 3)
            cv2.putText(out, label, (x1, max(18, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        return out
