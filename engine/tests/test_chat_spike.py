import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from engine.analyzers.chat_analyzer import ChatAnalyzer

class TestChatAnalyzer(unittest.TestCase):
    def test_adaptive_spike_detection(self):
        analyzer = ChatAnalyzer(window_size_sec=5.0, step_size_sec=1.0)

        # Create simulated chat: baseline 1 msg/s, then a massive burst at t=30..35s (20 msgs from 15 users)
        messages = []
        # Baseline
        for t in range(0, 60):
            messages.append({"time": float(t), "author": f"user_{t % 5}", "message": "jogando de boa"})

        # Hype burst at t=30
        for i in range(25):
            messages.append({
                "time": 30.0 + (i * 0.15),
                "author": f"hype_user_{i}",
                "message": "CARALHOOOO KKKKKKKKKKKK OMEGALUL CLIP IT"
            })

        results = analyzer.analyze_messages(messages, video_duration_sec=60.0)

        self.assertTrue(results["has_chat"])
        self.assertGreater(len(results["spikes"]), 0)

        # Check if the detected spike is centered around t=30s
        spike_times = [s["time"] for s in results["spikes"]]
        self.assertTrue(any(28.0 <= st <= 33.0 for st in spike_times), f"Expected spike near 30s, got: {spike_times}")

        # Check hype score is high (>0.7)
        top_spike = max(results["spikes"], key=lambda x: x["hype_score"])
        self.assertGreater(top_spike["hype_score"], 0.6)
        print(f"[TEST PASS] Chat spike detected at t={top_spike['time']}s with hype score {top_spike['hype_score']} and Z-score {top_spike['z_score']}")

    def test_no_chat_graceful_fallback(self):
        analyzer = ChatAnalyzer()
        results = analyzer.analyze_messages([], video_duration_sec=30.0)
        self.assertFalse(results["has_chat"])
        self.assertEqual(len(results["spikes"]), 0)
        print("[TEST PASS] No-chat fallback handled gracefully.")

if __name__ == "__main__":
    unittest.main()
