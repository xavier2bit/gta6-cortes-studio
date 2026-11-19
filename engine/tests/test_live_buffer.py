import os
import sys
import unittest
import time
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from engine.analyzers.chat_analyzer import ChatAnalyzer

class TestLiveStreamBuffer(unittest.TestCase):
    def test_rolling_live_buffer_spikes(self):
        """
        Simulates an incoming live stream buffer where new messages arrive incrementally
        and the radar updates live without recalculating from zero.
        """
        analyzer = ChatAnalyzer(window_size_sec=6.0, step_size_sec=1.0)
        live_message_buffer = []

        # Buffer Window 1: t=0..20s (Peaceful gameplay)
        for t in range(0, 20):
            live_message_buffer.append({"time": float(t), "author": f"viewer_{t}", "message": "jogando de boa"})

        state1 = analyzer.analyze_messages(live_message_buffer, video_duration_sec=20.0)
        self.assertEqual(len(state1["spikes"]), 0, "No spikes expected in quiet buffer")

        # Buffer Window 2: t=20..35s (Sudden epic police chase / streamer scream)
        # 30 messages arrive in 5 seconds
        for i in range(30):
            live_message_buffer.append({
                "time": 25.0 + (i * 0.15),
                "author": f"hype_viewer_{i}",
                "message": "POLICIA CHEGOU CARALHOOO KKKKKKKKKKK W W W CLIP IT"
            })

        state2 = analyzer.analyze_messages(live_message_buffer, video_duration_sec=35.0)
        self.assertGreater(len(state2["spikes"]), 0, "Spike expected when live buffer encounters burst")
        
        latest_spike = state2["spikes"][-1]
        self.assertGreaterEqual(latest_spike["time"], 24.0)
        print(f"[TEST PASS] Live stream buffer simulation: Spike detected in real-time at t={latest_spike['time']}s (Z-score: {latest_spike['z_score']}, Hype: {latest_spike['hype_score']})")

if __name__ == "__main__":
    unittest.main()
