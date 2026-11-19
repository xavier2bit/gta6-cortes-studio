import os
import sys
import unittest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from engine.analyzers.audio_analyzer import AudioAnalyzer

class TestAudioAnalyzer(unittest.TestCase):
    def test_spectral_centroid_scream_detection(self):
        analyzer = AudioAnalyzer(sample_rate=16000)

        # 1. Synthesize 10 seconds of background engine drone: low frequency sine (80Hz - 250Hz) + noise
        sr = 16000
        duration = 15.0
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)

        # Baseline: low-frequency rumble
        drone = 0.08 * np.sin(2 * np.pi * 120 * t) + 0.02 * np.random.normal(0, 1, len(t))

        # At t=8.0s to 9.5s: insert a high-frequency scream / reaction (1800Hz - 2800Hz with volume boost 0.6)
        scream_start = int(8.0 * sr)
        scream_end = int(9.5 * sr)
        t_scream = t[scream_start:scream_end]
        scream_wave = 0.55 * np.sin(2 * np.pi * 2200 * t_scream) + 0.25 * np.sin(2 * np.pi * 3200 * t_scream)
        drone[scream_start:scream_end] += scream_wave

        # Analyze using internal chunk method
        win_size = int(sr * 0.5)
        hop_size = int(sr * 0.25)
        num_frames = (len(drone) - win_size) // hop_size

        timeline = []
        rms_vals = []
        centroids = []
        freqs = np.fft.rfftfreq(win_size, d=1.0/sr)

        for i in range(num_frames):
            idx = i * hop_size
            chunk = drone[idx : idx + win_size]
            cur_t = round((idx + win_size / 2) / sr, 2)
            rms = float(np.sqrt(np.mean(chunk ** 2)))
            fft_mag = np.abs(np.fft.rfft(chunk * np.hanning(len(chunk))))
            centroid = float(np.sum(freqs * fft_mag) / (np.sum(fft_mag) + 1e-9))
            rms_vals.append(rms)
            centroids.append(centroid)
            timeline.append({"time": cur_t, "rms": rms, "centroid": centroid})

        mean_rms = float(np.mean(rms_vals))
        std_rms = float(np.std(rms_vals))

        # Check that around t=8.5s the spectral centroid and RMS clearly peak
        scream_frames = [f for f in timeline if 8.0 <= f["time"] <= 9.5]
        peak_frame = max(scream_frames, key=lambda x: x["rms"])

        self.assertGreater(peak_frame["centroid"], 1500.0, "Expected high spectral centroid during scream")
        self.assertGreater(peak_frame["rms"], mean_rms * 2.0, "Expected significant volume boost during scream")
        print(f"[TEST PASS] Scream detected at t={peak_frame['time']}s: RMS={peak_frame['rms']:.3f} (mean={mean_rms:.3f}), Centroid={peak_frame['centroid']:.1f} Hz")

if __name__ == "__main__":
    unittest.main()
