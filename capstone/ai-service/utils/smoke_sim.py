"""
Synthetic Smoke and Haze Generator for Simulation & Model Benchmarking
Implements Koschmieder's Atmospheric Light Attenuation Model:
I(x) = J(x) * t(x) + A * (1 - t(x))
"""

import cv2
import numpy as np


class SyntheticSmokeGenerator:
    """
    Generates realistic dynamic volumetric smoke, dust plumes, and toxic aerosols.
    """
    def __init__(self, atmospheric_light: float = 0.9):
        self.A = atmospheric_light
        self.time_step = 0.0

    def apply_smoke(self, frame: np.ndarray, density: float = 0.65) -> np.ndarray:
        """
        Synthesizes atmospheric haze and turbulent smoke on top of a clean frame.
        """
        h, w = frame.shape[:2]
        self.time_step += 0.05

        # Create smooth Perlin-like low-frequency turbulence
        small_h, small_w = max(8, h // 16), max(8, w // 16)
        noise = np.random.normal(loc=0.5, scale=0.2, size=(small_h, small_w)).astype(np.float32)
        noise = cv2.GaussianBlur(noise, (5, 5), 1.5)
        
        # Upsample noise to full frame size
        full_noise = cv2.resize(noise, (w, h), interpolation=cv2.INTER_CUBIC)
        full_noise = np.clip(full_noise, 0.1, 1.0)

        # Transmission map t(x) = exp(-beta * d(x))
        transmission = np.exp(-density * (1.5 - full_noise))
        transmission = np.clip(transmission, 0.05, 0.95)[:, :, np.newaxis]

        # Atmospheric scattering formula
        normalized_frame = frame.astype(np.float32) / 255.0
        A_vector = np.array([self.A * 0.95, self.A, self.A * 1.05], dtype=np.float32)  # slight grey-blue smoke tint

        smoky_frame = normalized_frame * transmission + A_vector * (1.0 - transmission)
        smoky_bgr = np.clip(smoky_frame * 255.0, 0, 255).astype(np.uint8)

        # Add slight blur to mimic forward scattering
        smoky_bgr = cv2.GaussianBlur(smoky_bgr, (3, 3), 0.8)

        return smoky_bgr
