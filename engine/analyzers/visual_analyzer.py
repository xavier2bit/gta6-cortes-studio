import os
from typing import Dict, Any, List
from scenedetect import open_video, SceneManager, ContentDetector, AdaptiveDetector

class VisualAnalyzer:
    """
    Video Scene and Visual Motion Analyzer using PySceneDetect.
    Identifies camera cuts, scene changes, and visual shifts.
    """
    def __init__(self, threshold: float = 27.0):
        self.threshold = threshold

    def detect_scenes(self, video_path: str, max_duration_sec: float = None) -> List[Dict[str, float]]:
        """Detects scene cuts using PySceneDetect."""
        try:
            video = open_video(video_path)
            scene_manager = SceneManager()
            scene_manager.add_detector(ContentDetector(threshold=self.threshold))

            # Run scene detection
            scene_manager.detect_scenes(video, show_progress=False)
            scene_list = scene_manager.get_scene_list()

            scenes = []
            for i, scene in enumerate(scene_list):
                start_sec = scene[0].get_seconds()
                end_sec = scene[1].get_seconds()
                if max_duration_sec and start_sec > max_duration_sec:
                    break
                scenes.append({
                    "scene_idx": i + 1,
                    "start": round(start_sec, 2),
                    "end": round(min(end_sec, max_duration_sec) if max_duration_sec else end_sec, 2),
                    "duration": round(end_sec - start_sec, 2)
                })

            return scenes
        except Exception as e:
            print(f"[VisualAnalyzer] Error in PySceneDetect: {e}. Falling back to empty scene list.")
            return []

    def get_nearest_scene_cut(self, timestamp: float, scenes: List[Dict[str, float]], max_distance: float = 3.0) -> float:
        """Finds the closest clean scene cut within max_distance seconds."""
        closest = timestamp
        min_dist = float('inf')

        for s in scenes:
            for cut in [s["start"], s["end"]]:
                dist = abs(cut - timestamp)
                if dist < min_dist and dist <= max_distance:
                    min_dist = dist
                    closest = cut

        return closest
