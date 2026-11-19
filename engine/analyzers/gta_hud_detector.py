import cv2
import numpy as np
from typing import Dict, Any, List

class GtaHudDetector:
    """
    Experimental GTA / GTA 6 HUD and Game Event Detector.
    Analyzes specific Regions of Interest (ROI) at low sampling rates to detect:
    1. Wanted Stars (Estrelas da Polícia) flashing in top-right
    2. 'WASTED' / 'BUSTED' death screen (color desaturation + slow-mo + center flash)
    3. Health Bar critical damage flash in bottom-left (around mini-map)
    4. Sudden high-speed motion / collisions
    """
    def __init__(self):
        pass

    def analyze_frame_roi(self, frame: np.ndarray, prev_gray: np.ndarray = None) -> Dict[str, Any]:
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        events = []
        hud_score = 0.0

        # 1. Wanted Stars ROI: Top-Right corner (x: 80%..98%, y: 2%..12%)
        top_right_roi = gray[int(h * 0.02):int(h * 0.12), int(w * 0.80):int(w * 0.98)]
        # Stars are bright white or flash red/blue against the dark HUD background
        bright_pixels = np.count_nonzero(top_right_roi > 210)
        roi_total = top_right_roi.size
        bright_ratio = bright_pixels / (roi_total + 1e-6)

        # Star shapes trigger localized bright clusters
        if bright_ratio > 0.06:
            events.append("wanted_level_active")
            hud_score += 0.45

        # 2. Death Screen / 'WASTED' Detection:
        # In GTA, death triggers intense desaturation (sepia/grayscale) or red vignette flash
        mean_saturation = np.mean(hsv[:, :, 1])
        if mean_saturation < 35.0: # Highly desaturated frame
            # Check center banner contrast (where 'WASTED' or 'SE FUDEU' appears)
            center_roi = gray[int(h * 0.42):int(h * 0.58), int(w * 0.25):int(w * 0.75)]
            center_contrast = float(np.std(center_roi))
            if center_contrast > 18.0:
                events.append("wasted_or_busted")
                hud_score += 0.70

        # 3. Health / Armor Flash ROI: Bottom-Left (x: 2%..18%, y: 78%..96%)
        # When taking damage, red health flashes in the mini-map arc/bar
        bottom_left_hsv = hsv[int(h * 0.78):int(h * 0.96), int(w * 0.02):int(w * 0.18)]
        # Red hue in HSV: 0-10 and 170-180
        mask_red1 = cv2.inRange(bottom_left_hsv, np.array([0, 120, 120]), np.array([10, 255, 255]))
        mask_red2 = cv2.inRange(bottom_left_hsv, np.array([170, 120, 120]), np.array([180, 255, 255]))
        red_pixels = np.count_nonzero(mask_red1 | mask_red2)
        red_ratio = red_pixels / (bottom_left_hsv.shape[0] * bottom_left_hsv.shape[1] + 1e-6)

        if red_ratio > 0.04:
            events.append("critical_health_or_damage")
            hud_score += 0.35

        # 4. Motion / Optical Flow estimation if previous frame available
        motion_score = 0.0
        if prev_gray is not None and prev_gray.shape == gray.shape:
            diff = cv2.absdiff(gray, prev_gray)
            motion_score = float(np.mean(diff))

        return {
            "events": events,
            "hud_score": min(1.0, hud_score),
            "motion_score": motion_score,
            "gray": gray
        }

    def analyze_video(self, video_path: str, duration_sec: float, sample_fps: float = 1.0) -> Dict[str, Any]:
        """Samples frames at sample_fps to detect game events."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"has_hud": False, "events": [], "timeline": []}

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(video_fps / sample_fps))

        timeline = []
        detected_events = []
        prev_gray = None
        frame_idx = 0
        current_time = 0.0

        while cap.isOpened() and current_time <= duration_sec:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                current_time = frame_idx / video_fps
                metrics = self.analyze_frame_roi(frame, prev_gray)
                prev_gray = metrics["gray"]

                if metrics["events"]:
                    for ev in metrics["events"]:
                        detected_events.append({
                            "time": round(current_time, 2),
                            "type": ev,
                            "hud_score": metrics["hud_score"]
                        })

                timeline.append({
                    "time": round(current_time, 2),
                    "events": metrics["events"],
                    "hud_score": metrics["hud_score"],
                    "motion_score": round(metrics["motion_score"], 2)
                })

            frame_idx += 1

        cap.release()

        return {
            "has_hud": True,
            "events_detected": len(detected_events),
            "events": detected_events,
            "timeline": timeline
        }
