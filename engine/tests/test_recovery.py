import os
import sys
import unittest
import time
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from engine.highlight_detector import run_highlight_pipeline

class TestInterruptionRecovery(unittest.TestCase):
    def test_checkpoint_cache_recovery(self):
        video_path = "hd_clip.mp4"
        out_json = "output/test_recovery.json"
        ffmpeg_bin = "C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-127043-g5a54fcf75e-win64-gpl\\bin\\ffmpeg.exe"
        ffprobe_bin = "C:\\Users\\Admin\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-127043-g5a54fcf75e-win64-gpl\\bin\\ffprobe.exe"

        if not os.path.exists(video_path):
            self.skipTest("hd_clip.mp4 not found")

        # Run 1: Cold start (generates checkpoints)
        t0 = time.time()
        res1 = run_highlight_pipeline(video_path, out_json, ffmpeg_bin=ffmpeg_bin, ffprobe_bin=ffprobe_bin, use_cache=True, generate_previews=False)
        t1 = time.time() - t0

        # Run 2: Hot start (restores from checkpoints)
        t2 = time.time()
        res2 = run_highlight_pipeline(video_path, out_json, ffmpeg_bin=ffmpeg_bin, ffprobe_bin=ffprobe_bin, use_cache=True, generate_previews=False)
        t3 = time.time() - t2

        self.assertEqual(res1["candidates_count"], res2["candidates_count"])
        # Second run should be substantially faster because all analyzers restore from checkpoint
        self.assertLess(t3, t1, f"Expected cached run ({t3:.2f}s) to be faster than cold run ({t1:.2f}s)")
        print(f"[TEST PASS] Interruption recovery verified: Cold run: {t1:.2f}s -> Cached run: {t3:.2f}s ({t1/t3:.1f}x speedup)")

if __name__ == "__main__":
    unittest.main()
