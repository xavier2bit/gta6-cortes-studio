import os
import sys
import unittest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from engine.analyzers.gta_hud_detector import GtaHudDetector

class TestGtaHudDetector(unittest.TestCase):
    def test_wanted_stars_and_wasted_detection(self):
        detector = GtaHudDetector()

        # 1. Normal gameplay frame: 1920x1080 with colorful scene
        normal_frame = np.random.randint(50, 180, (1080, 1920, 3), dtype=np.uint8)
        # Add high saturation
        normal_frame[:, :, 0] = 120 # Blue
        normal_frame[:, :, 1] = 180 # Green
        normal_frame[:, :, 2] = 220 # Red

        res_normal = detector.analyze_frame_roi(normal_frame)
        self.assertEqual(len(res_normal["events"]), 0)

        # 2. Frame with Wanted Stars in Top-Right (x: 80%..98%, y: 2%..12%)
        # Put bright white stars (>210)
        wanted_frame = normal_frame.copy()
        wanted_frame[int(1080 * 0.03):int(1080 * 0.10), int(1920 * 0.82):int(1920 * 0.96)] = 250
        res_wanted = detector.analyze_frame_roi(wanted_frame)
        self.assertIn("wanted_level_active", res_wanted["events"])
        print(f"[TEST PASS] Wanted Stars event detected with HUD score {res_wanted['hud_score']}")

        # 3. Frame with Wasted death screen (Desaturated + contrast in center)
        wasted_frame = np.full((1080, 1920, 3), 40, dtype=np.uint8) # Dark grayscale
        # Add red/white banner in center
        wasted_frame[int(1080 * 0.45):int(1080 * 0.55), int(1920 * 0.30):int(1920 * 0.70)] = [20, 20, 230]
        res_wasted = detector.analyze_frame_roi(wasted_frame)
        self.assertIn("wasted_or_busted", res_wasted["events"])
        print(f"[TEST PASS] Wasted death screen detected with HUD score {res_wasted['hud_score']}")

if __name__ == "__main__":
    unittest.main()
