"""
Virtual Video Feeder for Search & Rescue Drone Simulation
Generates synthetic smoke overlaid video and pushes it to MediaMTX RTSP stream
Usage: python stream_feeder.py [--rtsp_url rtsp://localhost:8554/live]
"""

import cv2
import numpy as np
import subprocess
import time
import argparse


def generate_synthetic_scene(w=640, h=480, frame_idx=0):
    """
    Generates synthetic emergency building fire scene with survivors and moving drone perspective
    """
    frame = np.full((h, w, 3), 35, dtype=np.uint8)

    # Perspective shift based on drone motion
    dx = int(np.sin(frame_idx * 0.05) * 20)
    dy = int(np.cos(frame_idx * 0.03) * 10)

    # Building hallway architecture
    cv2.rectangle(frame, (80 + dx, 60 + dy), (560 + dx, 440 + dy), (75, 75, 80), -1)
    cv2.rectangle(frame, (240 + dx, 120 + dy), (400 + dx, 440 + dy), (35, 40, 50), -1)

    # Survivor body heat signature
    cv2.ellipse(frame, (320 + dx, 380 + dy), (40, 20), 0, 0, 360, (230, 240, 255), -1)
    cv2.circle(frame, (295 + dx, 375 + dy), 16, (255, 245, 200), -1)

    # Smoke overlay using atmospheric scattering
    noise = np.random.normal(loc=0.5, scale=0.2, size=(h // 16, w // 16)).astype(np.float32)
    noise = cv2.resize(cv2.GaussianBlur(noise, (5, 5), 1.5), (w, h))
    transmission = np.exp(-0.75 * (1.5 - noise))[:, :, np.newaxis]

    atmospheric_light = np.array([210, 215, 220], dtype=np.float32)
    smoky = frame.astype(np.float32) * transmission + atmospheric_light * (1.0 - transmission)
    return np.clip(smoky, 0, 255).astype(np.uint8)


def push_rtsp_stream(rtsp_url="rtsp://localhost:8554/live", width=640, height=480, fps=30):
    print(f"📡 Starting virtual drone RTSP feed to {rtsp_url} ({width}x{height} @ {fps}fps)...")

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-pix_fmt", "bgr24",
        "-s", f"{width}x{height}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-f", "rtsp",
        rtsp_url,
    ]

    try:
        process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    except FileNotFoundError:
        print("[Notice] FFmpeg executable not found in system PATH. Running in preview test loop.")
        process = None

    frame_idx = 0
    try:
        while True:
            t0 = time.time()
            frame = generate_synthetic_scene(width, height, frame_idx)
            frame_idx += 1

            if process and process.stdin:
                try:
                    process.stdin.write(frame.tobytes())
                except BrokenPipeError:
                    break
            else:
                # Standalone preview when testing locally
                cv2.imshow("Aegis-Vision Drone Simulator (Press Q to quit)", frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            elapsed = time.time() - t0
            time.sleep(max(0.0, (1.0 / fps) - elapsed))
    except KeyboardInterrupt:
        print("\nStopping virtual video feeder...")
    finally:
        if process:
            process.terminate()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Aegis-Vision Drone Feeder Simulator")
    parser.add_argument("--rtsp_url", default="rtsp://localhost:8554/live", help="RTSP publish destination")
    args = parser.parse_args()

    push_rtsp_stream(args.rtsp_url)
