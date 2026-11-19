import subprocess
import os
import math
import numpy as np
from typing import Dict, Any, List, Optional

class AudioAnalyzer:
    """
    Multimodal Audio Analysis:
    - RMS Energy (Volume Bursts)
    - Spectral Centroid & High-Frequency Flux (Screaming vs Engine rumble)
    - Pitch / Zero-Crossing Dynamics (Laughter bursts)
    - Silence & Natural Pauses detection (for clean narrative cuts)
    """
    def __init__(self, ffmpeg_bin: str = "ffmpeg", sample_rate: int = 16000):
        self.ffmpeg_bin = ffmpeg_bin
        self.sample_rate = sample_rate

    def extract_pcm(self, video_path: str, duration_limit: Optional[float] = None) -> np.ndarray:
        """Extracts raw 16-bit mono PCM samples at 16kHz using FFmpeg."""
        cmd = [
            self.ffmpeg_bin,
            "-v", "error",
            "-i", video_path,
        ]
        if duration_limit:
            cmd.extend(["-t", str(duration_limit)])
        cmd.extend([
            "-f", "s16le",
            "-ac", "1",
            "-ar", str(self.sample_rate),
            "-"
        ])

        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        raw_bytes, stderr = proc.communicate()
        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg audio extraction failed: {stderr.decode('utf-8', errors='ignore')}")

        samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        return samples

    def analyze(self, video_path: str, duration_sec: float) -> Dict[str, Any]:
        """Performs full acoustic analysis across the timeline."""
        try:
            samples = self.extract_pcm(video_path, duration_limit=duration_sec)
        except Exception as e:
            print(f"[AudioAnalyzer] Fallback error extracting audio: {e}")
            timeline_len = int(math.ceil(duration_sec))
            return {
                "has_audio": False,
                "timeline": [{"time": t, "rms": 0.0, "excitement_score": 0.0, "is_speech": False} for t in range(timeline_len)],
                "spikes": [],
                "silence_points": []
            }

        total_samples = len(samples)
        if total_samples == 0:
            return {"has_audio": False, "timeline": [], "spikes": [], "silence_points": []}

        actual_duration = total_samples / self.sample_rate
        # Analyze in 0.5s windows with 50% overlap (hop = 0.25s)
        win_size = int(self.sample_rate * 0.5)
        hop_size = int(self.sample_rate * 0.25)
        num_frames = max(1, (total_samples - win_size) // hop_size)

        timeline = []
        rms_values = []
        zcr_values = []
        spec_centroids = []

        # Frequency bins for 16kHz
        freqs = np.fft.rfftfreq(win_size, d=1.0/self.sample_rate)

        for i in range(num_frames):
            idx = i * hop_size
            chunk = samples[idx : idx + win_size]
            t = round((idx + win_size / 2) / self.sample_rate, 2)

            # 1. RMS Energy
            rms = float(np.sqrt(np.mean(chunk ** 2)))
            rms_values.append(rms)

            # 2. Zero Crossing Rate (ZCR)
            zcr = float(np.mean(np.abs(np.diff(np.signbit(chunk)))))
            zcr_values.append(zcr)

            # 3. Spectral Centroid (identifies high pitched voice / screams)
            fft_mag = np.abs(np.fft.rfft(chunk * np.hanning(len(chunk))))
            sum_mag = np.sum(fft_mag)
            centroid = float(np.sum(freqs * fft_mag) / (sum_mag + 1e-9))
            spec_centroids.append(centroid)

            timeline.append({
                "time": t,
                "rms": round(rms, 4),
                "zcr": round(zcr, 3),
                "centroid": round(centroid, 1)
            })

        # Global statistics
        mean_rms = float(np.mean(rms_values)) if rms_values else 0.01
        std_rms = float(np.std(rms_values)) if rms_values else 0.01

        # Adaptive rolling background (15-second window) to avoid triggering on steady loud noise (e.g. constant car engine)
        rolling_win = int(15.0 / 0.25) # 60 frames
        silence_threshold = mean_rms * 0.15

        spikes = []
        silence_points = []

        for i, entry in enumerate(timeline):
            # Rolling baseline around frame i
            start_w = max(0, i - rolling_win // 2)
            end_w = min(len(rms_values), i + rolling_win // 2 + 1)
            local_mean = float(np.mean(rms_values[start_w:end_w]))
            local_std = float(np.std(rms_values[start_w:end_w])) + 1e-6

            rms = entry["rms"]
            centroid = entry["centroid"]

            # Dynamic excitement score:
            # - Volume surge above local baseline
            # - Spectral centroid in scream/laugh range (1200Hz - 4500Hz)
            vol_boost = max(0.0, (rms - local_mean) / local_std)
            is_high_pitch = 1.0 if (1200 <= centroid <= 4800) else 0.2

            excitement = min(1.0, (vol_boost / 3.5) * 0.7 + is_high_pitch * 0.3)
            entry["excitement_score"] = round(float(excitement), 3)

            # Detect loud reaction spikes
            if vol_boost >= 2.2 and rms >= mean_rms * 1.5:
                spikes.append({
                    "time": entry["time"],
                    "vol_boost": round(vol_boost, 2),
                    "excitement_score": entry["excitement_score"],
                    "centroid": centroid,
                    "type": "scream_or_shout" if centroid > 1800 else "loud_burst"
                })

            # Detect natural pauses / silence (ideal for start/end cut alignment)
            if rms <= silence_threshold:
                silence_points.append(entry["time"])

        return {
            "has_audio": True,
            "mean_rms": round(mean_rms, 4),
            "duration_sec": round(actual_duration, 2),
            "timeline": timeline,
            "spikes": spikes,
            "silence_points": silence_points
        }
